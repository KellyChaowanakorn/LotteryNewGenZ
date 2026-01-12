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
========================= */
export async function fetchThaiGovLottery(): Promise<LotteryResult> {
  try {
    // ใช้ API ฟรีจาก thailottoapi.com
    const url = "https://api-v2.thailottoapi.com/latest";
    const { data } = await axios.get(url, { timeout: 10000 });

    if (data && data.status === "success" && data.data) {
      const result = data.data;
      
      return {
        lotteryType: "THAI_GOV",
        date: result.date || new Date().toLocaleDateString("th-TH"),
        firstPrize: result.first_prize || result.prizeFirst?.[0] || undefined,
        threeDigitTop: result.three_digit_top || result.threeTop?.[0] || undefined,
        threeDigitBottom: result.three_digit_bottom || result.threeBottom?.[0] || undefined,
        twoDigitTop: result.two_digit || result.twoDigit || undefined,
        twoDigitBottom: result.two_digit_bottom || result.twoBottom || undefined,
        source: "Thailand Lotto API",
      };
    }

    throw new Error("Invalid response format");
  } catch (error: any) {
    console.error("Fetch หวยรัฐบาลล้มเหลว:", error.message);
    
    // Fallback: ลอง scrape จาก GLO
    try {
      const { data } = await axios.get("https://www.glo.or.th/", {
        timeout: 10000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      
      const $ = cheerio.load(data);
      const firstPrize = $(".first-prize .number").first().text().trim();
      
      if (firstPrize && firstPrize.length === 6) {
        return {
          lotteryType: "THAI_GOV",
          date: new Date().toLocaleDateString("th-TH"),
          firstPrize,
          source: "GLO Website (scrape)",
        };
      }
    } catch (scrapeError) {
      console.error("Scrape GLO ล้มเหลว:", scrapeError);
    }

    return {
      lotteryType: "THAI_GOV",
      date: new Date().toLocaleDateString("th-TH"),
      source: "Error",
      error: "ไม่สามารถดึงข้อมูลหวยรัฐบาลได้",
    };
  }
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
export async function fetchThaiStock(): Promise<StockResult> {
  try {
    // SET API (unofficial)
    const url = "https://www.set.or.th/api/set/todayStat/set/WORK";
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (data && data.close) {
      const price = parseFloat(data.close);
      const priceStr = price.toFixed(2);
      
      return {
        lotteryType: "THAI_STOCK",
        date: new Date().toLocaleDateString("th-TH"),
        symbol: "SET",
        price,
        change: parseFloat(data.change || "0"),
        changePercent: parseFloat(data.percentChange || "0"),
        twoDigit: priceStr.replace(".", "").slice(-2),
        threeDigit: priceStr.replace(".", "").slice(-3),
        marketState: data.marketStatus || "CLOSED",
        source: "SET API",
      };
    }

    throw new Error("Invalid API response");
  } catch (error: any) {
    console.error("Fetch หุ้นไทยล้มเหลว:", error.message);
    
    // Mock data as fallback
    const mockPrice = 1500 + Math.random() * 100;
    return {
      lotteryType: "THAI_STOCK",
      date: new Date().toLocaleDateString("th-TH"),
      symbol: "SET",
      price: mockPrice,
      change: 0,
      changePercent: 0,
      twoDigit: mockPrice.toFixed(2).replace(".", "").slice(-2),
      threeDigit: mockPrice.toFixed(2).replace(".", "").slice(-3),
      marketState: "CLOSED",
      source: "Mock Data",
      error: "ไม่สามารถดึงข้อมูลจริงได้ ใช้ข้อมูล Mock",
    };
  }
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