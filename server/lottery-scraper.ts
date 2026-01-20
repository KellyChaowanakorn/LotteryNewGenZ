import axios from "axios";
import * as cheerio from "cheerio";

interface LotteryResult {
  lotteryType: string;
  date: string;
  firstPrize?: string;
  threeDigitTop?: string;
  threeDigitBottom?: string;
  twoDigitTop?: string;
  twoDigitBottom?: string;
  runTop?: string;
  runBottom?: string;
  source: string;
  error?: string;
}

interface StockResult {
  lotteryType: string;
  date: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  twoDigit: string;
  threeDigit: string;
  marketState: string;
  source: string;
  error?: string;
}

/* =========================
   THAI GOVERNMENT LOTTERY
   ใช้ 3 แหล่ง: 
   1. Rayriffy API (Sanook)
   2. GLO Official API  
   3. Scrape จาก Sanook
========================= */
export async function fetchThaiGovLottery(): Promise<LotteryResult> {
  
  // Method 1: ใช้ Rayriffy API (ดึงจาก Sanook) - Reliable!
  try {
    console.log("Trying Rayriffy API (Sanook)...");
    const { data } = await axios.get("https://lotto.api.rayriffy.com/latest", {
      timeout: 15000,
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
      },
    });

    if (data && data.status === "success" && data.response) {
      const response = data.response;
      
      // หารางวัลที่ 1
      const prizeFirst = response.prizes?.find((p: any) => p.id === "prizeFirst");
      const firstPrize = prizeFirst?.number?.[0];
      
      // หาเลขหน้า 3 ตัว
      const frontThree = response.runningNumbers?.find((r: any) => r.id === "runningNumberFrontThree");
      const threeDigitTop = frontThree?.number?.join(", ");
      
      // หาเลขท้าย 3 ตัว
      const backThree = response.runningNumbers?.find((r: any) => r.id === "runningNumberBackThree");
      const threeDigitBottom = backThree?.number?.join(", ");
      
      // หาเลขท้าย 2 ตัว
      const backTwo = response.runningNumbers?.find((r: any) => r.id === "runningNumberBackTwo");
      const twoDigitBottom = backTwo?.number?.[0];

      if (firstPrize) {
        console.log("✅ Rayriffy API success:", firstPrize);
        return {
          lotteryType: "THAI_GOV",
          date: response.date || new Date().toLocaleDateString("th-TH"),
          firstPrize,
          threeDigitTop,
          threeDigitBottom,
          twoDigitBottom,
          source: "Sanook via Rayriffy API",
        };
      }
    }
    throw new Error("Invalid Rayriffy response");
  } catch (error: any) {
    console.error("❌ Rayriffy API failed:", error.message);
  }

  // Method 2: ใช้ GLO Official API
  try {
    console.log("Trying GLO Official API...");
    const { data } = await axios.post(
      "https://www.glo.or.th/api/lottery/getLatestLottery",
      {},
      {
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Origin": "https://www.glo.or.th",
          "Referer": "https://www.glo.or.th/"
        },
      }
    );

    if (data && data.response) {
      const result = data.response;
      const firstPrize = result.data?.first?.number?.[0]?.value;
      
      if (firstPrize) {
        console.log("✅ GLO API success:", firstPrize);
        return {
          lotteryType: "THAI_GOV",
          date: result.data?.date || new Date().toLocaleDateString("th-TH"),
          firstPrize,
          threeDigitTop: result.data?.last3f?.number?.map((n: any) => n.value).join(", "),
          threeDigitBottom: result.data?.last3b?.number?.map((n: any) => n.value).join(", "),
          twoDigitBottom: result.data?.last2?.number?.[0]?.value,
          source: "GLO Official API",
        };
      }
    }
    throw new Error("Invalid GLO response");
  } catch (error: any) {
    console.error("❌ GLO API failed:", error.message);
  }

  // Method 3: Scrape จาก Sanook โดยตรง
  try {
    console.log("Trying Sanook scrape...");
    const { data } = await axios.get("https://news.sanook.com/lotto/", {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
      },
    });

    const $ = cheerio.load(data);
    
    // หารางวัลที่ 1 จาก Sanook
    let firstPrize = "";
    
    // ลอง selector แบบต่างๆ
    const selectors = [
      ".lottocheck__sec--highlight .lottocheck__box--loss .lottocheck__num",
      ".lottocheck__sec--highlight .lottocheck__num",
      "[data-id='prizeFirst'] .lottocheck__num",
      ".lotto-check-result__first-prize",
      ".first-prize .number",
      "#firstPrize",
    ];
    
    for (const selector of selectors) {
      const text = $(selector).first().text().trim().replace(/\s+/g, "");
      if (text && /^\d{6}$/.test(text)) {
        firstPrize = text;
        break;
      }
    }

    // ถ้าหาไม่เจอ ลองหาจาก text content
    if (!firstPrize) {
      $("*").each((_, el) => {
        const text = $(el).text().trim();
        if (/รางวัลที่\s*1/.test(text)) {
          const match = text.match(/\d{6}/);
          if (match) {
            firstPrize = match[0];
            return false; // break
          }
        }
      });
    }

    if (firstPrize && firstPrize.length === 6) {
      console.log("✅ Sanook scrape success:", firstPrize);
      
      // หาเลข 2 ตัวท้าย
      let twoDigitBottom = "";
      const twoDigitSelectors = [
        ".lottocheck__sec--sub .lottocheck__num",
        "[data-id='runningNumberBackTwo'] .lottocheck__num",
      ];
      
      for (const selector of twoDigitSelectors) {
        const text = $(selector).last().text().trim().replace(/\s+/g, "");
        if (text && /^\d{2}$/.test(text)) {
          twoDigitBottom = text;
          break;
        }
      }

      return {
        lotteryType: "THAI_GOV",
        date: $(".lottocheck__header__date, .lotto-date").first().text().trim() || new Date().toLocaleDateString("th-TH"),
        firstPrize,
        twoDigitBottom: twoDigitBottom || firstPrize.slice(-2),
        threeDigitTop: firstPrize.slice(0, 3),
        threeDigitBottom: firstPrize.slice(-3),
        source: "Sanook (scrape)",
      };
    }
    throw new Error("Could not parse Sanook page");
  } catch (error: any) {
    console.error("❌ Sanook scrape failed:", error.message);
  }

  // Final Fallback: ส่งค่า error กลับ
  console.log("❌ All methods failed");
  return {
    lotteryType: "THAI_GOV",
    date: new Date().toLocaleDateString("th-TH"),
    source: "Error",
    error: "ไม่สามารถดึงข้อมูลหวยรัฐบาลได้ กรุณาลองใหม่อีกครั้ง",
  };
}

/* =========================
   LAO LOTTERY
========================= */
export async function fetchLaoLottery(): Promise<LotteryResult> {
  try {
    // ใช้ API ฟรี
    const url = "https://www.huay.com/lao/latest";
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (data && data.result) {
      const num = data.result.toString();
      return {
        lotteryType: "LAO",
        date: data.date || new Date().toLocaleDateString("th-TH"),
        firstPrize: num,
        threeDigitTop: num.slice(-3),
        twoDigitTop: num.slice(-2),
        source: "Huay API",
      };
    }

    throw new Error("Invalid API response");
  } catch (error: any) {
    console.error("Fetch หวยลาวล้มเหลว (API):", error.message);
    
    // Fallback: Scrape จาก Sanook
    try {
      const { data } = await axios.get("https://www.sanook.com/lotto/laos/", {
        timeout: 10000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const $ = cheerio.load(data);
      const firstPrize = $(".lottocheck__lotto__number").first().text().trim().replace(/\s+/g, "");

      if (firstPrize && firstPrize.length >= 4) {
        return {
          lotteryType: "LAO",
          date: new Date().toLocaleDateString("th-TH"),
          firstPrize,
          threeDigitTop: firstPrize.slice(-3),
          twoDigitTop: firstPrize.slice(-2),
          source: "Sanook (scrape)",
        };
      }
    } catch (scrapeError) {
      console.error("Scrape Sanook ล้มเหลว:", scrapeError);
    }

    return {
      lotteryType: "LAO",
      date: new Date().toLocaleDateString("th-TH"),
      source: "Error",
      error: "ไม่สามารถดึงข้อมูลหวยลาวได้",
    };
  }
}

/* =========================
   MALAYSIA LOTTERY
========================= */
export async function fetchMalaysiaLottery(): Promise<LotteryResult> {
  try {
    // Magnum 4D มี API แบบไม่เป็นทางการ
    const url = "https://www.magnum4d.my/en/api/results/latest";
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (data && data.results && data.results.length > 0) {
      const result = data.results[0];
      const firstPrize = result.first_prize || result["1st"];
      
      return {
        lotteryType: "MALAYSIA",
        date: result.date || new Date().toLocaleDateString("th-TH"),
        firstPrize,
        threeDigitTop: firstPrize?.slice(-3),
        twoDigitTop: firstPrize?.slice(-2),
        source: "Magnum 4D API",
      };
    }

    throw new Error("Invalid API response");
  } catch (error: any) {
    console.error("Fetch หวยมาเลย์ล้มเหลว:", error.message);
    
    return {
      lotteryType: "MALAYSIA",
      date: new Date().toLocaleDateString("th-TH"),
      source: "Error",
      error: "ไม่สามารถดึงข้อมูลหวยมาเลย์ได้",
    };
  }
}

/* =========================
   SINGAPORE LOTTERY
========================= */
export async function fetchSingaporeLottery(): Promise<LotteryResult> {
  try {
    // Singapore Pools มี unofficial API
    const url = "https://data.4d88.net/4d/singapore/latest";
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (data && data.result) {
      const firstPrize = data.result.first_prize || data.result["1st"];
      
      return {
        lotteryType: "SINGAPORE",
        date: data.date || new Date().toLocaleDateString("th-TH"),
        firstPrize,
        threeDigitTop: firstPrize?.slice(-3),
        twoDigitTop: firstPrize?.slice(-2),
        source: "4D88 API",
      };
    }

    throw new Error("Invalid API response");
  } catch (error: any) {
    console.error("Fetch หวยสิงคโปร์ล้มเหลว:", error.message);
    
    return {
      lotteryType: "SINGAPORE",
      date: new Date().toLocaleDateString("th-TH"),
      source: "Error",
      error: "ไม่สามารถดึงข้อมูลหวยสิงคโปร์ได้",
    };
  }
}

/* =========================
   HANOI LOTTERY
========================= */
export async function fetchHanoiLottery(): Promise<LotteryResult> {
  try {
    // Vietnam Hanoi API
    const url = "https://api.vietlott.live/hanoi/latest";
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (data && data.result) {
      const special = data.result.special_prize || data.result.special;
      
      return {
        lotteryType: "HANOI",
        date: data.date || new Date().toLocaleDateString("th-TH"),
        firstPrize: special,
        threeDigitTop: special?.slice(-3),
        twoDigitTop: special?.slice(-2),
        source: "VietLott API",
      };
    }

    throw new Error("Invalid API response");
  } catch (error: any) {
    console.error("Fetch หวยฮานอยล้มเหลว:", error.message);
    
    return {
      lotteryType: "HANOI",
      date: new Date().toLocaleDateString("th-TH"),
      source: "Error",
      error: "ไม่สามารถดึงข้อมูลหวยฮานอยได้",
    };
  }
}

/* =========================
   THAI STOCK (SET)
========================= */
/* =========================
   THAI STOCK (SET INDEX) - REAL-TIME
   ใช้ 3 แหล่ง: 
   1. SET Official Website scrape
   2. Yahoo Finance API
   3. Investing.com scrape
========================= */
export async function fetchThaiStock(): Promise<StockResult> {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const day = now.getDay();
  
  // ตรวจสอบเวลาตลาด (จ-ศ 10:00-12:30, 14:30-16:30)
  const isTradingDay = day >= 1 && day <= 5;
  const isMorningSession = hours >= 10 && (hours < 12 || (hours === 12 && minutes <= 30));
  const isAfternoonSession = (hours >= 14 && minutes >= 30) || (hours >= 15 && hours < 16) || (hours === 16 && minutes <= 30);
  const isMarketOpen = isTradingDay && (isMorningSession || isAfternoonSession);
  
  // Method 1: Scrape จาก SET Website
  try {
    console.log("Trying SET Website scrape...");
    const { data } = await axios.get("https://www.set.or.th/th/market/index/set/overview", {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
      },
    });

    const $ = cheerio.load(data);
    
    // ลอง selector หลายแบบ
    let priceText = "";
    const priceSelectors = [
      ".index-value",
      ".last-price",
      "[data-field='last']",
      ".price-value",
      ".index-number",
    ];
    
    for (const selector of priceSelectors) {
      const text = $(selector).first().text().trim().replace(/,/g, "");
      if (text && /^\d+\.?\d*$/.test(text)) {
        priceText = text;
        break;
      }
    }

    // ลองหาจาก script JSON
    if (!priceText) {
      $("script").each((_, el) => {
        const scriptContent = $(el).html() || "";
        const match = scriptContent.match(/"SET"[^}]*"last"\s*:\s*([\d.]+)/);
        if (match) {
          priceText = match[1];
          return false;
        }
      });
    }

    if (priceText) {
      const price = parseFloat(priceText);
      const priceStr = price.toFixed(2).replace(".", "");
      
      console.log("✅ SET scrape success:", price);
      return {
        lotteryType: "THAI_STOCK",
        date: now.toLocaleDateString("th-TH"),
        symbol: "SET",
        price,
        change: 0,
        changePercent: 0,
        twoDigit: priceStr.slice(-2),
        threeDigit: priceStr.slice(-3),
        marketState: isMarketOpen ? "OPEN" : "CLOSED",
        source: "SET Website",
      };
    }
  } catch (error: any) {
    console.error("❌ SET scrape failed:", error.message);
  }

  // Method 2: Yahoo Finance API
  try {
    console.log("Trying Yahoo Finance API...");
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/%5ESET.BK?interval=1m&range=1d";
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const quote = data.chart?.result?.[0]?.meta;
    if (quote && quote.regularMarketPrice) {
      const price = parseFloat(quote.regularMarketPrice);
      const priceStr = price.toFixed(2).replace(".", "");
      
      console.log("✅ Yahoo Finance success:", price);
      return {
        lotteryType: "THAI_STOCK",
        date: now.toLocaleDateString("th-TH"),
        symbol: "SET",
        price,
        change: parseFloat(quote.regularMarketChange || "0"),
        changePercent: parseFloat(quote.regularMarketChangePercent || "0"),
        twoDigit: priceStr.slice(-2),
        threeDigit: priceStr.slice(-3),
        marketState: quote.marketState === "REGULAR" ? "OPEN" : "CLOSED",
        source: "Yahoo Finance",
      };
    }
  } catch (error: any) {
    console.error("❌ Yahoo Finance failed:", error.message);
  }

  // Method 3: Investing.com scrape
  try {
    console.log("Trying Investing.com scrape...");
    const { data } = await axios.get("https://www.investing.com/indices/thailand-set", {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    const $ = cheerio.load(data);
    const priceText = $("[data-test='instrument-price-last']").first().text().trim().replace(/,/g, "");
    
    if (priceText && /^\d+\.?\d*$/.test(priceText)) {
      const price = parseFloat(priceText);
      const priceStr = price.toFixed(2).replace(".", "");
      
      console.log("✅ Investing.com success:", price);
      return {
        lotteryType: "THAI_STOCK",
        date: now.toLocaleDateString("th-TH"),
        symbol: "SET",
        price,
        change: 0,
        changePercent: 0,
        twoDigit: priceStr.slice(-2),
        threeDigit: priceStr.slice(-3),
        marketState: isMarketOpen ? "OPEN" : "CLOSED",
        source: "Investing.com",
      };
    }
  } catch (error: any) {
    console.error("❌ Investing.com failed:", error.message);
  }

  // Fallback: ใช้ค่าประมาณ (ไม่แนะนำสำหรับ production)
  console.log("❌ All methods failed, using estimated value");
  const estimatedPrice = 1420 + Math.random() * 20; // ประมาณ SET Index
  const priceStr = estimatedPrice.toFixed(2).replace(".", "");
  
  return {
    lotteryType: "THAI_STOCK",
    date: now.toLocaleDateString("th-TH"),
    symbol: "SET",
    price: estimatedPrice,
    change: 0,
    changePercent: 0,
    twoDigit: priceStr.slice(-2),
    threeDigit: priceStr.slice(-3),
    marketState: "CLOSED",
    source: "Estimated",
    error: "ไม่สามารถดึงข้อมูลจริงได้ กรุณารอสักครู่แล้วลองใหม่",
  };
}

/* =========================
   INTERNATIONAL STOCKS
========================= */
export async function fetchInternationalStock(symbol: string): Promise<StockResult> {
  try {
    const symbolMap: Record<string, string> = {
      NIKKEI: "^N225",
      DOW: "^DJI",
      FTSE: "^FTSE",
      DAX: "^GDAXI",
    };

    const yahooSymbol = symbolMap[symbol.toUpperCase()];
    if (!yahooSymbol) {
      throw new Error("Invalid symbol");
    }

    // Yahoo Finance API (v8)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const quote = data.chart?.result?.[0]?.meta;
    if (quote && quote.regularMarketPrice) {
      const price = parseFloat(quote.regularMarketPrice);
      const priceStr = price.toFixed(2);
      
      return {
        lotteryType: `STOCK_${symbol.toUpperCase()}`,
        date: new Date().toLocaleDateString("th-TH"),
        symbol: symbol.toUpperCase(),
        price,
        change: parseFloat(quote.regularMarketChange || "0"),
        changePercent: parseFloat(quote.regularMarketChangePercent || "0"),
        twoDigit: priceStr.replace(".", "").slice(-2),
        threeDigit: priceStr.replace(".", "").slice(-3),
        marketState: quote.marketState || "CLOSED",
        source: "Yahoo Finance",
      };
    }

    throw new Error("Invalid API response");
  } catch (error: any) {
    console.error(`Fetch ${symbol} ล้มเหลว:`, error.message);
    
    // Mock data as fallback
    const basePrices: Record<string, number> = {
      NIKKEI: 33000,
      DOW: 38000,
      FTSE: 7500,
      DAX: 17000,
    };
    
    const basePrice = basePrices[symbol.toUpperCase()] || 10000;
    const mockPrice = basePrice + Math.random() * 1000 - 500;
    const priceStr = mockPrice.toFixed(2);
    
    return {
      lotteryType: `STOCK_${symbol.toUpperCase()}`,
      date: new Date().toLocaleDateString("th-TH"),
      symbol: symbol.toUpperCase(),
      price: mockPrice,
      change: 0,
      changePercent: 0,
      twoDigit: priceStr.replace(".", "").slice(-2),
      threeDigit: priceStr.replace(".", "").slice(-3),
      marketState: "CLOSED",
      source: "Mock Data",
      error: "ไม่สามารถดึงข้อมูลจริงได้ ใช้ข้อมูล Mock",
    };
  }
}

/* =========================
   FETCH ALL
========================= */
export async function fetchAllForeignLotteries(): Promise<LotteryResult[]> {
  const results = await Promise.all([
    fetchLaoLottery(),
    fetchMalaysiaLottery(),
    fetchSingaporeLottery(),
    fetchHanoiLottery(),
  ]);
  return results;
}

export async function fetchAllStocks(): Promise<StockResult[]> {
  const results = await Promise.all([
    fetchThaiStock(),
    fetchInternationalStock("NIKKEI"),
    fetchInternationalStock("DOW"),
    fetchInternationalStock("FTSE"),
    fetchInternationalStock("DAX"),
  ]);
  return results;
}