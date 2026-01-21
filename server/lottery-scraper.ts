import axios from "axios";
import * as cheerio from "cheerio";

/* =========================
   INTERFACES
========================= */

interface LotteryResult {
  lotteryType: string;
  date: string;
  firstPrize?: string;
  threeDigitTop?: string;
  threeDigitBottom?: string;
  twoDigitTop?: string;
  twoDigitBottom?: string;
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

interface MalaysiaResult {
  lotteryType: string;
  date: string;
  company: string;
  firstPrize: string;
  secondPrize: string;
  thirdPrize: string;
  specialPrizes: string[];
  consolationPrizes: string[];
  source: string;
  error?: string;
}

/* =========================
   1. THAI GOVERNMENT LOTTERY
========================= */

export async function fetchThaiGovLottery(): Promise<LotteryResult> {
  // Method 1: Rayriffy API
  try {
    console.log("📡 Fetching Thai Gov via Rayriffy API...");
    const { data } = await axios.get("https://lotto.api.rayriffy.com/latest", {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (data?.status === "success" && data?.response) {
      const response = data.response;
      const prizeFirst = response.prizes?.find((p: any) => p.id === "prizeFirst");
      const firstPrize = prizeFirst?.number?.[0];
      const frontThree = response.runningNumbers?.find((r: any) => r.id === "runningNumberFrontThree");
      const backThree = response.runningNumbers?.find((r: any) => r.id === "runningNumberBackThree");
      const backTwo = response.runningNumbers?.find((r: any) => r.id === "runningNumberBackTwo");

      if (firstPrize) {
        console.log("✅ Thai Gov success:", firstPrize);
        return {
          lotteryType: "THAI_GOV",
          date: response.date || new Date().toLocaleDateString("th-TH"),
          firstPrize,
          threeDigitTop: frontThree?.number?.join(", "),
          threeDigitBottom: backThree?.number?.join(", "),
          twoDigitBottom: backTwo?.number?.[0],
          source: "Rayriffy API",
        };
      }
    }
  } catch (error: any) {
    console.error("❌ Rayriffy failed:", error.message);
  }

  // Method 2: GLO Official
  try {
    console.log("📡 Fetching Thai Gov via GLO API...");
    const { data } = await axios.post(
      "https://www.glo.or.th/api/lottery/getLatestLottery",
      {},
      {
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
          "Origin": "https://www.glo.or.th",
        },
      }
    );

    if (data?.response?.data) {
      const result = data.response.data;
      const firstPrize = result.first?.number?.[0]?.value;

      if (firstPrize) {
        console.log("✅ GLO success:", firstPrize);
        return {
          lotteryType: "THAI_GOV",
          date: result.date || new Date().toLocaleDateString("th-TH"),
          firstPrize,
          threeDigitTop: result.last3f?.number?.map((n: any) => n.value).join(", "),
          threeDigitBottom: result.last3b?.number?.map((n: any) => n.value).join(", "),
          twoDigitBottom: result.last2?.number?.[0]?.value,
          source: "GLO Official",
        };
      }
    }
  } catch (error: any) {
    console.error("❌ GLO failed:", error.message);
  }

  return {
    lotteryType: "THAI_GOV",
    date: new Date().toLocaleDateString("th-TH"),
    source: "Error",
    error: "ไม่สามารถดึงข้อมูลหวยรัฐบาลได้",
  };
}

/* =========================
   2. THAI STOCK (SET INDEX)
========================= */

export async function fetchThaiStock(): Promise<StockResult> {
  const now = new Date();
  const hours = now.getHours();
  const day = now.getDay();
  const isTradingDay = day >= 1 && day <= 5;
  const isMorningSession = hours >= 10 && hours < 12;
  const isAfternoonSession = hours >= 14 && hours < 17;
  const isMarketOpen = isTradingDay && (isMorningSession || isAfternoonSession);

  try {
    console.log("📡 Fetching SET via Yahoo Finance...");
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/%5ESET.BK?interval=1m&range=1d";
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const quote = data.chart?.result?.[0]?.meta;
    if (quote?.regularMarketPrice) {
      const price = parseFloat(quote.regularMarketPrice);
      const priceStr = price.toFixed(2).replace(".", "");

      console.log("✅ SET success:", price);
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

  const estimatedPrice = 1350 + Math.random() * 50;
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
    error: "ไม่สามารถดึงข้อมูลจริงได้",
  };
}

/* =========================
   3. NIKKEI 225
========================= */

export async function fetchNikkei(): Promise<StockResult> {
  try {
    console.log("📡 Fetching Nikkei via Yahoo Finance...");
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/%5EN225?interval=1m&range=1d";
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const quote = data.chart?.result?.[0]?.meta;
    if (quote?.regularMarketPrice) {
      const price = parseFloat(quote.regularMarketPrice);
      const priceStr = price.toFixed(2).replace(".", "");

      console.log("✅ Nikkei success:", price);
      return {
        lotteryType: "STOCK_NIKKEI",
        date: new Date().toLocaleDateString("th-TH"),
        symbol: "NIKKEI",
        price,
        change: parseFloat(quote.regularMarketChange || "0"),
        changePercent: parseFloat(quote.regularMarketChangePercent || "0"),
        twoDigit: priceStr.slice(-2),
        threeDigit: priceStr.slice(-3),
        marketState: quote.marketState || "CLOSED",
        source: "Yahoo Finance",
      };
    }
  } catch (error: any) {
    console.error("❌ Nikkei failed:", error.message);
  }

  const basePrice = 38000 + Math.random() * 1000;
  const priceStr = basePrice.toFixed(2).replace(".", "");
  return {
    lotteryType: "STOCK_NIKKEI",
    date: new Date().toLocaleDateString("th-TH"),
    symbol: "NIKKEI",
    price: basePrice,
    change: 0,
    changePercent: 0,
    twoDigit: priceStr.slice(-2),
    threeDigit: priceStr.slice(-3),
    marketState: "CLOSED",
    source: "Estimated",
    error: "ไม่สามารถดึงข้อมูลจริงได้",
  };
}

/* =========================
   4. HANG SENG INDEX
========================= */

export async function fetchHangSeng(): Promise<StockResult> {
  try {
    console.log("📡 Fetching Hang Seng via Yahoo Finance...");
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/%5EHSI?interval=1m&range=1d";
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const quote = data.chart?.result?.[0]?.meta;
    if (quote?.regularMarketPrice) {
      const price = parseFloat(quote.regularMarketPrice);
      const priceStr = price.toFixed(2).replace(".", "");

      console.log("✅ Hang Seng success:", price);
      return {
        lotteryType: "STOCK_HSI",
        date: new Date().toLocaleDateString("th-TH"),
        symbol: "HSI",
        price,
        change: parseFloat(quote.regularMarketChange || "0"),
        changePercent: parseFloat(quote.regularMarketChangePercent || "0"),
        twoDigit: priceStr.slice(-2),
        threeDigit: priceStr.slice(-3),
        marketState: quote.marketState || "CLOSED",
        source: "Yahoo Finance",
      };
    }
  } catch (error: any) {
    console.error("❌ Hang Seng failed:", error.message);
  }

  const basePrice = 19000 + Math.random() * 500;
  const priceStr = basePrice.toFixed(2).replace(".", "");
  return {
    lotteryType: "STOCK_HSI",
    date: new Date().toLocaleDateString("th-TH"),
    symbol: "HSI",
    price: basePrice,
    change: 0,
    changePercent: 0,
    twoDigit: priceStr.slice(-2),
    threeDigit: priceStr.slice(-3),
    marketState: "CLOSED",
    source: "Estimated",
    error: "ไม่สามารถดึงข้อมูลจริงได้",
  };
}

/* =========================
   5. DOW JONES
========================= */

export async function fetchDowJones(): Promise<StockResult> {
  try {
    console.log("📡 Fetching Dow Jones via Yahoo Finance...");
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/%5EDJI?interval=1m&range=1d";
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const quote = data.chart?.result?.[0]?.meta;
    if (quote?.regularMarketPrice) {
      const price = parseFloat(quote.regularMarketPrice);
      const priceStr = price.toFixed(2).replace(".", "");

      console.log("✅ Dow Jones success:", price);
      return {
        lotteryType: "STOCK_DOW",
        date: new Date().toLocaleDateString("th-TH"),
        symbol: "DOW",
        price,
        change: parseFloat(quote.regularMarketChange || "0"),
        changePercent: parseFloat(quote.regularMarketChangePercent || "0"),
        twoDigit: priceStr.slice(-2),
        threeDigit: priceStr.slice(-3),
        marketState: quote.marketState || "CLOSED",
        source: "Yahoo Finance",
      };
    }
  } catch (error: any) {
    console.error("❌ Dow Jones failed:", error.message);
  }

  const basePrice = 42000 + Math.random() * 1000;
  const priceStr = basePrice.toFixed(2).replace(".", "");
  return {
    lotteryType: "STOCK_DOW",
    date: new Date().toLocaleDateString("th-TH"),
    symbol: "DOW",
    price: basePrice,
    change: 0,
    changePercent: 0,
    twoDigit: priceStr.slice(-2),
    threeDigit: priceStr.slice(-3),
    marketState: "CLOSED",
    source: "Estimated",
    error: "ไม่สามารถดึงข้อมูลจริงได้",
  };
}

/* =========================
   6. MALAYSIA 4D
========================= */

export async function fetchMalaysia4D(): Promise<MalaysiaResult[]> {
  const results: MalaysiaResult[] = [];
  const companies = ["Magnum 4D", "Damacai", "Sports Toto"];

  // Method 1: Try 4D Result API
  try {
    console.log("📡 Fetching Malaysia 4D...");
    const { data } = await axios.get("https://www.magnum4d.my/en/past-results", {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const $ = cheerio.load(data);
    
    // Try to parse Magnum results
    const firstPrize = $(".first-prize, .prize1, [data-prize='1']").first().text().trim();
    const secondPrize = $(".second-prize, .prize2, [data-prize='2']").first().text().trim();
    const thirdPrize = $(".third-prize, .prize3, [data-prize='3']").first().text().trim();

    if (firstPrize && /^\d{4}$/.test(firstPrize.replace(/\D/g, "").slice(0, 4))) {
      results.push({
        lotteryType: "MALAYSIA",
        date: new Date().toLocaleDateString("th-TH"),
        company: "Magnum 4D",
        firstPrize: firstPrize.replace(/\D/g, "").slice(0, 4),
        secondPrize: secondPrize.replace(/\D/g, "").slice(0, 4) || "----",
        thirdPrize: thirdPrize.replace(/\D/g, "").slice(0, 4) || "----",
        specialPrizes: [],
        consolationPrizes: [],
        source: "Magnum4D Website",
      });
    }
  } catch (error: any) {
    console.error("❌ Magnum4D scrape failed:", error.message);
  }

  // Method 2: Try Check4D API
  try {
    const { data } = await axios.get("https://www.check4d.com/", {
      timeout: 15000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(data);
    
    // Parse results from check4d
    $(".result-box, .draw-result").each((_, el) => {
      const company = $(el).find(".company-name, .draw-name").text().trim();
      const first = $(el).find(".first, .prize-1").text().trim().replace(/\D/g, "");
      
      if (first && first.length === 4 && !results.find(r => r.company === company)) {
        results.push({
          lotteryType: "MALAYSIA",
          date: new Date().toLocaleDateString("th-TH"),
          company: company || "Unknown",
          firstPrize: first,
          secondPrize: $(el).find(".second, .prize-2").text().trim().replace(/\D/g, "").slice(0, 4) || "----",
          thirdPrize: $(el).find(".third, .prize-3").text().trim().replace(/\D/g, "").slice(0, 4) || "----",
          specialPrizes: [],
          consolationPrizes: [],
          source: "Check4D",
        });
      }
    });
  } catch (error: any) {
    console.error("❌ Check4D failed:", error.message);
  }

  // Fallback: Return placeholder
  if (results.length === 0) {
    console.log("⚠️ Using placeholder Malaysia 4D data");
    for (const company of companies) {
      results.push({
        lotteryType: "MALAYSIA",
        date: new Date().toLocaleDateString("th-TH"),
        company,
        firstPrize: "----",
        secondPrize: "----",
        thirdPrize: "----",
        specialPrizes: [],
        consolationPrizes: [],
        source: "Placeholder",
        error: "รอผลออกรางวัล พ, ส, อา 19:00",
      });
    }
  }

  return results;
}

/* =========================
   FETCH ALL STOCKS
========================= */

export async function fetchAllStocks(): Promise<StockResult[]> {
  const results = await Promise.all([
    fetchThaiStock(),
    fetchNikkei(),
    fetchHangSeng(),
    fetchDowJones(),
  ]);
  return results;
}

/* =========================
   FETCH STOCK BY SYMBOL
========================= */

export async function fetchInternationalStock(symbol: string): Promise<StockResult> {
  switch (symbol.toUpperCase()) {
    case "NIKKEI":
      return fetchNikkei();
    case "HSI":
      return fetchHangSeng();
    case "DOW":
      return fetchDowJones();
    default:
      return {
        lotteryType: `STOCK_${symbol.toUpperCase()}`,
        date: new Date().toLocaleDateString("th-TH"),
        symbol: symbol.toUpperCase(),
        price: 0,
        change: 0,
        changePercent: 0,
        twoDigit: "00",
        threeDigit: "000",
        marketState: "CLOSED",
        source: "Error",
        error: "Invalid symbol",
      };
  }
}
