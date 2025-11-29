import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword } from "./password";

const payoutRates: Record<string, number> = {
  THREE_TOP: 900,
  THREE_TOOD: 150,
  THREE_FRONT: 450,
  THREE_BOTTOM: 450,
  THREE_REVERSE: 4500,
  TWO_TOP: 90,
  TWO_BOTTOM: 90,
  RUN_TOP: 3.2,
  RUN_BOTTOM: 4.2,
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.isAdmin) {
      return res.status(401).json({ error: "Admin authentication required" });
    }
    next();
  };

  app.get("/api/blocked-numbers", async (req, res) => {
    try {
      const lotteryType = req.query.lotteryType as string | undefined;
      const blockedNumbers = await storage.getBlockedNumbers(lotteryType);
      res.json(blockedNumbers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blocked numbers" });
    }
  });

  app.post("/api/blocked-numbers", requireAdmin, async (req, res) => {
    try {
      const { lotteryType, number, betType, isActive = true } = req.body;
      if (!lotteryType || !number) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const blocked = await storage.createBlockedNumber({
        lotteryType,
        number,
        betType: betType || null,
        isActive,
      });
      res.json(blocked);
    } catch (error) {
      res.status(500).json({ error: "Failed to create blocked number" });
    }
  });

  app.patch("/api/blocked-numbers/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const { isActive } = req.body;
      const blocked = await storage.updateBlockedNumber(id, isActive);
      if (!blocked) {
        return res.status(404).json({ error: "Blocked number not found" });
      }
      res.json(blocked);
    } catch (error) {
      res.status(500).json({ error: "Failed to update blocked number" });
    }
  });

  app.delete("/api/blocked-numbers/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const deleted = await storage.deleteBlockedNumber(id);
      if (!deleted) {
        return res.status(404).json({ error: "Blocked number not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete blocked number" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, referralCode } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      let referredBy: string | null = null;
      if (referralCode) {
        const referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer) {
          referredBy = referralCode;
        }
      }

      const hashedPassword = await hashPassword(password);

      const user = await storage.createUser({
        username,
        password: hashedPassword,
        balance: 0,
        referralCode: `QNQ${Date.now().toString(36).toUpperCase()}`,
        referredBy,
        affiliateEarnings: 0,
      });

      if (referredBy) {
        const referrer = await storage.getUserByReferralCode(referredBy);
        if (referrer) {
          await storage.createAffiliate(referrer.id, user.id);
        }
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/bets", async (req, res) => {
    try {
      const { userId, items } = req.body;
      const userIdNum = typeof userId === "string" ? parseInt(userId, 10) : userId;
      
      if (!userIdNum || isNaN(userIdNum) || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const createdBets = [];
      let totalAmount = 0;

      for (const item of items) {
        const { lotteryType, betType, numbers, amount } = item;
        const potentialWin = amount * (payoutRates[betType] || 1);

        const blocked = await storage.getBlockedNumbers(lotteryType);
        const isBlocked = blocked.some(
          (bn) =>
            bn.isActive &&
            bn.number === numbers &&
            (bn.betType === null || bn.betType === betType)
        );

        if (isBlocked) {
          return res.status(400).json({ error: `Number ${numbers} is blocked` });
        }

        const bet = await storage.createBet({
          userId: userIdNum,
          lotteryType,
          betType,
          numbers,
          amount,
          potentialWin,
          status: "pending",
          drawDate: new Date().toISOString().split("T")[0],
        });

        createdBets.push(bet);
        totalAmount += amount;
      }

      await storage.updateUserBalance(userIdNum, -totalAmount);

      await storage.createTransaction({
        userId: userIdNum,
        type: "bet",
        amount: -totalAmount,
        status: "approved",
        slipUrl: null,
        reference: `BET${Date.now().toString(36).toUpperCase()}`,
      });

      await storage.updateAffiliateStats(userIdNum, totalAmount);

      res.json({ bets: createdBets, totalAmount });
    } catch (error) {
      console.error("Bet creation error:", error);
      res.status(500).json({ error: "Failed to create bets" });
    }
  });

  app.get("/api/bets", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const userIdNum = userId ? parseInt(userId, 10) : undefined;
      const bets = await storage.getBets(userIdNum);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bets" });
    }
  });

  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const id = parseInt(req.params.userId, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const transactions = await storage.getTransactions(id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { userId, type, amount, slipUrl } = req.body;
      const userIdNum = typeof userId === "string" ? parseInt(userId, 10) : userId;
      
      if (!userIdNum || isNaN(userIdNum) || !type || amount === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const transaction = await storage.createTransaction({
        userId: userIdNum,
        type,
        amount,
        status: "pending",
        slipUrl: slipUrl || null,
        reference: `${type.toUpperCase()}${Date.now().toString(36).toUpperCase()}`,
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const { status } = req.body;
      if (!status || !["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const allTransactions = await storage.getAllTransactions();
      const existingTx = allTransactions.find(t => t.id === id);
      if (!existingTx) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (existingTx.status !== "pending") {
        return res.status(400).json({ error: "Transaction already processed" });
      }
      
      const transaction = await storage.updateTransactionStatus(id, status);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (status === "approved" && existingTx.type === "deposit") {
        await storage.updateUserBalance(existingTx.userId, existingTx.amount);
      }

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });


  app.get("/api/affiliates/:userId", async (req, res) => {
    try {
      const id = parseInt(req.params.userId, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const affiliateList = await storage.getAffiliates(id);
      res.json(affiliateList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch affiliates" });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      res.json({ success: true, message: "Admin login successful" });
    } else {
      res.status(401).json({ error: "Invalid admin credentials" });
    }
  });

  app.get("/api/admin/check", (req, res) => {
    res.json({ isAdmin: req.session?.isAdmin === true });
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.isAdmin = false;
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const usersWithoutPassword = allUsers.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const { isBlocked } = req.body;
      if (typeof isBlocked !== "boolean") {
        return res.status(400).json({ error: "isBlocked must be a boolean" });
      }
      const user = await storage.updateUserBlockStatus(id, isBlocked);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allBets = await storage.getBets();
      const allTransactions = await storage.getAllTransactions();
      const allAffiliates = await storage.getAllAffiliates();

      const pendingDeposits = allTransactions.filter(
        (t) => t.type === "deposit" && t.status === "pending"
      );
      const approvedDeposits = allTransactions.filter(
        (t) => t.type === "deposit" && t.status === "approved"
      );
      const totalDeposits = approvedDeposits.reduce((sum, t) => sum + t.amount, 0);

      const totalBetAmount = allBets.reduce((sum, b) => sum + b.amount, 0);
      const pendingBets = allBets.filter((b) => b.status === "pending");
      const wonBets = allBets.filter((b) => b.status === "won");
      const lostBets = allBets.filter((b) => b.status === "lost");

      const totalAffiliateCommission = allAffiliates.reduce((sum, a) => sum + a.commission, 0);

      res.json({
        users: {
          total: allUsers.length,
          blocked: allUsers.filter((u) => u.isBlocked).length,
          active: allUsers.filter((u) => !u.isBlocked).length,
        },
        bets: {
          total: allBets.length,
          pending: pendingBets.length,
          won: wonBets.length,
          lost: lostBets.length,
          totalAmount: totalBetAmount,
        },
        transactions: {
          pendingDeposits: pendingDeposits.length,
          totalDeposits,
        },
        affiliates: {
          total: allAffiliates.length,
          totalCommission: totalAffiliateCommission,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/lottery-results", async (req, res) => {
    try {
      const results = await storage.getAllLotteryResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lottery results" });
    }
  });

  app.post("/api/lottery-results", async (req, res) => {
    try {
      const { lotteryType, drawDate, firstPrize, threeDigitTop, threeDigitBottom, 
              twoDigitTop, twoDigitBottom, runTop, runBottom } = req.body;
      
      if (!lotteryType || !drawDate) {
        return res.status(400).json({ error: "Missing required fields (lotteryType, drawDate)" });
      }

      const existing = await storage.getLotteryResult(lotteryType, drawDate);
      if (existing) {
        return res.status(400).json({ error: "Result already exists for this lottery and date" });
      }

      const result = await storage.createLotteryResult({
        lotteryType,
        drawDate,
        firstPrize: firstPrize || null,
        threeDigitTop: threeDigitTop || null,
        threeDigitBottom: threeDigitBottom || null,
        twoDigitTop: twoDigitTop || null,
        twoDigitBottom: twoDigitBottom || null,
        runTop: runTop || null,
        runBottom: runBottom || null,
        isProcessed: false,
      });

      res.json(result);
    } catch (error) {
      console.error("Error creating lottery result:", error);
      res.status(500).json({ error: "Failed to create lottery result" });
    }
  });

  function checkBetWin(bet: { betType: string; numbers: string }, result: {
    firstPrize?: string | null;
    threeDigitTop?: string | null;
    threeDigitBottom?: string | null;
    twoDigitTop?: string | null;
    twoDigitBottom?: string | null;
    runTop?: string | null;
    runBottom?: string | null;
  }): boolean {
    const betNumber = bet.numbers;
    
    switch (bet.betType) {
      case "THREE_TOP":
        return betNumber === result.firstPrize?.slice(-3);
      
      case "THREE_TOOD": {
        const lastThree = result.firstPrize?.slice(-3);
        if (!lastThree) return false;
        const sortedBet = betNumber.split("").sort().join("");
        const sortedResult = lastThree.split("").sort().join("");
        return sortedBet === sortedResult;
      }
      
      case "THREE_FRONT":
        return betNumber === result.threeDigitTop;
      
      case "THREE_BOTTOM":
        return betNumber === result.threeDigitBottom;
      
      case "THREE_REVERSE": {
        const lastThree = result.firstPrize?.slice(-3);
        if (!lastThree) return false;
        const permutations = getPermutations(lastThree);
        return permutations.includes(betNumber);
      }
      
      case "TWO_TOP":
        return betNumber === result.twoDigitTop || betNumber === result.firstPrize?.slice(-2);
      
      case "TWO_BOTTOM":
        return betNumber === result.twoDigitBottom;
      
      case "RUN_TOP": {
        if (result.runTop && betNumber === result.runTop) return true;
        const lastTwo = result.twoDigitTop || result.firstPrize?.slice(-2);
        return lastTwo ? lastTwo.includes(betNumber) : false;
      }
      
      case "RUN_BOTTOM": {
        if (result.runBottom && betNumber === result.runBottom) return true;
        const bottomTwo = result.twoDigitBottom;
        return bottomTwo ? bottomTwo.includes(betNumber) : false;
      }
      
      default:
        return false;
    }
  }

  function getPermutations(str: string): string[] {
    if (str.length <= 1) return [str];
    const result: string[] = [];
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const remaining = str.slice(0, i) + str.slice(i + 1);
      const perms = getPermutations(remaining);
      for (const perm of perms) {
        result.push(char + perm);
      }
    }
    return [...new Set(result)];
  }

  app.post("/api/lottery-results/:id/process", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const allResults = await storage.getAllLotteryResults();
      const lotteryResult = allResults.find(r => r.id === id);
      
      if (!lotteryResult) {
        return res.status(404).json({ error: "Lottery result not found" });
      }

      if (lotteryResult.isProcessed) {
        return res.status(400).json({ error: "Result already processed" });
      }

      const pendingBets = await storage.getBetsByLotteryAndDate(
        lotteryResult.lotteryType, 
        lotteryResult.drawDate
      );

      let wonCount = 0;
      let lostCount = 0;
      let totalWinnings = 0;

      for (const bet of pendingBets) {
        const isWinner = checkBetWin(bet, lotteryResult);
        
        if (isWinner) {
          await storage.updateBetStatus(bet.id, "won");
          const winAmount = bet.potentialWin;
          await storage.updateUserBalance(bet.userId, winAmount);
          totalWinnings += winAmount;
          wonCount++;
        } else {
          await storage.updateBetStatus(bet.id, "lost");
          lostCount++;
        }
      }

      await storage.updateLotteryResultProcessed(id);

      res.json({
        success: true,
        processed: pendingBets.length,
        won: wonCount,
        lost: lostCount,
        totalWinnings
      });
    } catch (error) {
      console.error("Error processing lottery result:", error);
      res.status(500).json({ error: "Failed to process lottery result" });
    }
  });

  const stockSymbols: Record<string, { symbol: string; name: string }> = {
    STOCK_NIKKEI: { symbol: "^N225", name: "Nikkei 225" },
    STOCK_DOW: { symbol: "^DJI", name: "Dow Jones" },
    STOCK_FTSE: { symbol: "^FTSE", name: "FTSE 100" },
    STOCK_DAX: { symbol: "^GDAXI", name: "DAX" },
    THAI_STOCK: { symbol: "^SET.BK", name: "SET Index" }
  };

  app.get("/api/stock-data/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const stockInfo = stockSymbols[type];
      
      if (!stockInfo) {
        return res.status(400).json({ error: "Invalid stock type" });
      }

      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(stockInfo.symbol)}?interval=1d&range=5d`;
      
      const response = await fetch(yahooUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.chart?.result?.[0];
      
      if (!result) {
        return res.status(404).json({ error: "No data available" });
      }

      const meta = result.meta;
      const timestamps = result.timestamp || [];
      const closes = result.indicators?.quote?.[0]?.close || [];
      
      const latestClose = closes.filter((c: number | null) => c !== null).pop() || meta.regularMarketPrice;
      const previousClose = meta.previousClose || meta.chartPreviousClose;
      const change = latestClose - previousClose;
      const changePercent = (change / previousClose) * 100;

      const latestTimestamp = timestamps[timestamps.length - 1];
      const date = latestTimestamp ? new Date(latestTimestamp * 1000).toISOString() : new Date().toISOString();

      const formattedPrice = latestClose.toFixed(2);
      const twoDigit = formattedPrice.replace(".", "").slice(-2);
      const threeDigit = formattedPrice.replace(".", "").slice(-3);

      res.json({
        type,
        name: stockInfo.name,
        symbol: stockInfo.symbol,
        price: latestClose,
        formattedPrice,
        previousClose,
        change: change.toFixed(2),
        changePercent: changePercent.toFixed(2),
        twoDigit,
        threeDigit,
        date,
        currency: meta.currency || "JPY",
        exchangeName: meta.exchangeName || "Unknown",
        marketState: meta.marketState || "CLOSED",
        externalUrl: type === "STOCK_NIKKEI" 
          ? "https://www.investing.com/indices/japan-ni225"
          : type === "STOCK_DOW"
          ? "https://www.investing.com/indices/us-30"
          : type === "STOCK_FTSE"
          ? "https://www.investing.com/indices/uk-100"
          : type === "STOCK_DAX"
          ? "https://www.investing.com/indices/germany-30"
          : "https://www.set.or.th/th/market/index/set/overview"
      });
    } catch (error) {
      console.error("Error fetching stock data:", error);
      res.status(500).json({ error: "Failed to fetch stock data" });
    }
  });

  app.get("/api/hanoi-lottery", async (req, res) => {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/khiemdoan/vietnam-lottery-xsmb-analysis/refs/heads/main/data/xsmb.json",
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(404).json({ error: "No data available" });
      }

      const latest = data[data.length - 1];
      
      const firstPrize = String(latest.prize1 || "");
      const twoDigit = firstPrize.slice(-2);
      const threeDigit = firstPrize.slice(-3);

      const g7 = [
        String(latest.prize7_1 || ""),
        String(latest.prize7_2 || ""),
        String(latest.prize7_3 || ""),
        String(latest.prize7_4 || "")
      ].filter(n => n);

      res.json({
        date: latest.date,
        firstPrize,
        twoDigit,
        threeDigit,
        prizes: {
          special: firstPrize,
          g1: [String(latest.prize2_1 || ""), String(latest.prize2_2 || "")].filter(n => n),
          g2: [],
          g3: [
            String(latest.prize3_1 || ""), String(latest.prize3_2 || ""), 
            String(latest.prize3_3 || ""), String(latest.prize3_4 || ""),
            String(latest.prize3_5 || ""), String(latest.prize3_6 || "")
          ].filter(n => n),
          g4: [
            String(latest.prize4_1 || ""), String(latest.prize4_2 || ""),
            String(latest.prize4_3 || ""), String(latest.prize4_4 || "")
          ].filter(n => n),
          g5: [
            String(latest.prize5_1 || ""), String(latest.prize5_2 || ""),
            String(latest.prize5_3 || ""), String(latest.prize5_4 || ""),
            String(latest.prize5_5 || ""), String(latest.prize5_6 || "")
          ].filter(n => n),
          g6: [
            String(latest.prize6_1 || ""), String(latest.prize6_2 || ""),
            String(latest.prize6_3 || "")
          ].filter(n => n),
          g7
        },
        isLive: true,
        source: "Vietnam XSMB Daily Data"
      });
    } catch (error) {
      console.error("Error fetching Hanoi lottery data:", error);
      res.status(500).json({ error: "Failed to fetch Hanoi lottery data" });
    }
  });

  app.get("/api/stock-data", async (req, res) => {
    try {
      const results: Record<string, any> = {};
      
      for (const [type, stockInfo] of Object.entries(stockSymbols)) {
        try {
          const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(stockInfo.symbol)}?interval=1d&range=1d`;
          
          const response = await fetch(yahooUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
          });

          if (response.ok) {
            const data = await response.json();
            const result = data.chart?.result?.[0];
            
            if (result) {
              const meta = result.meta;
              const closes = result.indicators?.quote?.[0]?.close || [];
              const latestClose = closes.filter((c: number | null) => c !== null).pop() || meta.regularMarketPrice;
              const previousClose = meta.previousClose || meta.chartPreviousClose;
              const change = latestClose - previousClose;
              const changePercent = (change / previousClose) * 100;

              const formattedPrice = latestClose.toFixed(2);

              results[type] = {
                name: stockInfo.name,
                symbol: stockInfo.symbol,
                price: latestClose,
                formattedPrice,
                change: change.toFixed(2),
                changePercent: changePercent.toFixed(2),
                twoDigit: formattedPrice.replace(".", "").slice(-2),
                threeDigit: formattedPrice.replace(".", "").slice(-3),
                marketState: meta.marketState || "CLOSED"
              };
            }
          }
        } catch (err) {
          console.error(`Error fetching ${type}:`, err);
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Error fetching all stock data:", error);
      res.status(500).json({ error: "Failed to fetch stock data" });
    }
  });

  return httpServer;
}
