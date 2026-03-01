import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  fetchThaiGovLottery,
  fetchThaiStock,
  fetchNikkei,
  fetchHangSeng,
  fetchDowJones,
  fetchMalaysia4D,
  fetchAllStocks,
  fetchInternationalStock,
} from "./lottery-scraper";
import { db } from "./db";
import { lotteryResults } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  /* =========================
     ADMIN AUTH (Session-based)
  ========================= */

  const ADMIN_USERNAME = "QNQgod1688";
  const ADMIN_PASSWORD = "$$$QNQgod1688";

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.isAdmin) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  app.post("/api/admin/login", (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        return res.json({ success: true, message: "Admin login successful" });
      }
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    } catch (error) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }
  });

  app.get("/api/admin/check", (req: Request, res: Response) => {
    res.json({ isAdmin: req.session.isAdmin === true });
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    req.session.isAdmin = false;
    req.session.destroy((err) => {
      if (err) console.error("Session destroy error:", err);
    });
    res.json({ success: true, message: "Admin logged out" });
  });

  /* =========================
     USER AUTH
  ========================= */

  app.post("/api/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json({ user });
  });

  app.post("/api/register", async (req: Request, res: Response) => {
    const { username, password, referralCode, referredBy } = req.body;
    try {
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }
      await storage.createUser({ username, password, referralCode, referredBy: referredBy || null });
      const user = await storage.getUserByUsername(username);
      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     USERS
  ========================= */

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const user = await storage.getUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  /* =========================
     ADMIN - USERS
  ========================= */

  app.get("/api/admin/users", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { isBlocked } = req.body;
      await storage.updateUserBlocked(id, isBlocked);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     ADMIN - STATS
  ========================= */

  app.get("/api/admin/stats", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     LOTTERY RESULTS - DATABASE
  ========================= */

  app.get("/api/results", async (req: Request, res: Response) => {
    const { lotteryType } = req.query as { lotteryType?: string };
    if (!lotteryType) return res.status(400).json({ error: "lotteryType required" });
    const result = await storage.getLatestResults(lotteryType);
    res.json(result);
  });

  /* =========================
     LOTTERY RESULTS - ADMIN CRUD
  ========================= */

  app.get("/api/lottery-results", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const results = await storage.getAllLotteryResults();
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/lottery-results", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { lotteryType, drawDate, firstPrize, threeDigitTop, threeDigitBottom, twoDigitTop, twoDigitBottom } = req.body;
      if (!lotteryType || !drawDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      await storage.createLotteryResult({
        lotteryType,
        drawDate,
        firstPrize,
        threeDigitTop,
        threeDigitBottom,
        twoDigitTop,
        twoDigitBottom,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/lottery-results/:id/process", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await storage.processLotteryResult(id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     ADMIN - WINNERS & PROCESSED DRAWS
  ========================= */

  app.get("/api/admin/winners", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { lotteryType, drawDate } = req.query as { lotteryType?: string; drawDate?: string };
      if (!lotteryType || !drawDate) {
        return res.status(400).json({ error: "lotteryType and drawDate required" });
      }
      const data = await storage.getWinners(lotteryType, drawDate);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/processed-draws", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const draws = await storage.getProcessedDraws();
      res.json(draws);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     LIVE RESULTS - THAI GOV
  ========================= */

  app.get("/api/results/live/thai-gov", async (_req: Request, res: Response) => {
    try {
      const result = await fetchThaiGovLottery();
      if (!result.error) {
        try {
          await db.insert(lotteryResults).values({
            lotteryType: result.lotteryType,
            drawDate: result.date,
            firstPrize: result.firstPrize,
            threeDigitTop: result.threeDigitTop,
            threeDigitBottom: result.threeDigitBottom,
            twoDigitBottom: result.twoDigitBottom,
            isProcessed: 0,
          }).onConflictDoNothing();
        } catch (dbError) {
          console.error("Database save error:", dbError);
        }
      }

      const threeTopNumbers = result.threeDigitTop
        ? result.threeDigitTop.split(",").map((n: string) => n.trim()).filter((n: string) => n)
        : [];
      const threeBottomNumbers = result.threeDigitBottom
        ? result.threeDigitBottom.split(",").map((n: string) => n.trim()).filter((n: string) => n)
        : [];

      res.json({
        status: result.error ? "error" : "success",
        response: {
          date: result.date,
          endpoint: result.source,
          prizes: [{ id: "prizeFirst", name: "รางวัลที่ 1", reward: "6000000", number: result.firstPrize ? [result.firstPrize] : [] }],
          runningNumbers: [
            { id: "runningNumberFrontThree", name: "รางวัลเลขหน้า 3 ตัว", reward: "4000", number: threeTopNumbers },
            { id: "runningNumberBackThree", name: "รางวัลเลขท้าย 3 ตัว", reward: "4000", number: threeBottomNumbers },
            { id: "runningNumberBackTwo", name: "รางวัลเลขท้าย 2 ตัว", reward: "2000", number: result.twoDigitBottom ? [result.twoDigitBottom] : [] },
          ],
        },
        error: result.error,
      });
    } catch (error: any) {
      console.error("Error fetching Thai Gov lottery:", error);
      res.status(500).json({ status: "error", error: "Failed to fetch Thai Government lottery" });
    }
  });

  /* =========================
     LIVE RESULTS - THAI STOCK
  ========================= */

  app.get("/api/results/live/thai-stock", async (_req: Request, res: Response) => {
    try {
      const result = await fetchThaiStock();
      if (!result.error) {
        try {
          await db.insert(lotteryResults).values({
            lotteryType: result.lotteryType,
            drawDate: result.date,
            firstPrize: result.price.toString(),
            threeDigitTop: result.threeDigit,
            twoDigitTop: result.twoDigit,
            isProcessed: 0,
          }).onConflictDoNothing();
        } catch (dbError) {
          console.error("Database save error:", dbError);
        }
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch Thai Stock data" });
    }
  });

  /* =========================
     LIVE RESULTS - INTERNATIONAL STOCKS
  ========================= */

  app.get("/api/results/live/stock/:symbol", async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const result = await fetchInternationalStock(symbol);
      if (!result.error) {
        try {
          await db.insert(lotteryResults).values({
            lotteryType: result.lotteryType,
            drawDate: result.date,
            firstPrize: result.price.toString(),
            threeDigitTop: result.threeDigit,
            twoDigitTop: result.twoDigit,
            isProcessed: 0,
          }).onConflictDoNothing();
        } catch (dbError) {
          console.error("Database save error:", dbError);
        }
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch stock data" });
    }
  });

  /* =========================
     LIVE RESULTS - ALL STOCKS
  ========================= */

  app.get("/api/results/live/stocks", async (_req: Request, res: Response) => {
    try {
      const results = await fetchAllStocks();
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch stock data" });
    }
  });

  /* =========================
     LIVE RESULTS - MALAYSIA 4D
  ========================= */

  app.get("/api/results/live/malaysia", async (_req: Request, res: Response) => {
    try {
      const results = await fetchMalaysia4D();
      for (const result of results) {
        if (!result.error && result.firstPrize !== "----") {
          try {
            await db.insert(lotteryResults).values({
              lotteryType: "MALAYSIA",
              drawDate: result.date,
              firstPrize: result.firstPrize,
              secondPrize: result.secondPrize,
              thirdPrize: result.thirdPrize,
              threeDigitTop: result.firstPrize?.slice(-3),
              twoDigitTop: result.firstPrize?.slice(-2),
              isProcessed: 0,
            }).onConflictDoNothing();
          } catch (dbError) {
            console.error("Database save error:", dbError);
          }
        }
      }
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch Malaysia 4D data" });
    }
  });

  /* =========================
     LIVE RESULTS - ALL
  ========================= */

  app.get("/api/results/live/all", async (_req: Request, res: Response) => {
    try {
      const [thaiGov, stocks, malaysia] = await Promise.all([
        fetchThaiGovLottery(),
        fetchAllStocks(),
        fetchMalaysia4D(),
      ]);
      res.json({ thaiGov, stocks, malaysia, timestamp: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch lottery results" });
    }
  });

  /* =========================
     ADMIN - INSERT RESULTS (legacy)
  ========================= */

  app.post("/api/admin/results", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { lotteryType, drawDate, firstPrize, threeDigitTop, threeDigitBottom, twoDigitTop, twoDigitBottom } = req.body;
      await db.insert(lotteryResults).values({
        lotteryType, drawDate, firstPrize, threeDigitTop, threeDigitBottom, twoDigitTop, twoDigitBottom, isProcessed: 0,
      });
      res.json({ success: true, message: "Results saved successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     BLOCKED NUMBERS
  ========================= */

  app.get("/api/blocked-numbers", async (_req: Request, res: Response) => {
    try {
      const blocked = await storage.getBlockedNumbers();
      res.json(blocked);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/blocked-numbers", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { lotteryType, number, betType, startDate, endDate } = req.body;
      await storage.addBlockedNumber({ lotteryType, number, betType, startDate, endDate });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ★ NEW: PATCH route for toggle active/inactive
  app.patch("/api/blocked-numbers/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { isActive } = req.body;
      await storage.updateBlockedNumber(id, isActive);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/blocked-numbers/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      await storage.removeBlockedNumber(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     PAYOUT SETTINGS
     ★ FIX: Support both /api/payout-settings AND /api/payout-rates
  ========================= */

  app.get("/api/payout-settings", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getPayoutSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ★ Admin.tsx uses /api/payout-rates
  app.get("/api/payout-rates", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getPayoutSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/payout-settings/:betType", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { betType } = req.params;
      const { rate } = req.body;
      await storage.updatePayoutRate(betType, rate);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ★ Admin.tsx uses PATCH /api/payout-rates/:betType
  app.patch("/api/payout-rates/:betType", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { betType } = req.params;
      const { rate } = req.body;
      await storage.updatePayoutRate(betType, rate);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     BET TYPE SETTINGS
     ★ FIX: Support both PUT and PATCH
  ========================= */

  app.get("/api/bet-type-settings", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getBetTypeSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/bet-type-settings/:betType", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { betType } = req.params;
      const { isEnabled } = req.body;
      await storage.updateBetTypeSetting(betType, isEnabled);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ★ Admin.tsx uses PATCH
  app.patch("/api/bet-type-settings/:betType", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { betType } = req.params;
      const { isEnabled } = req.body;
      await storage.updateBetTypeSetting(betType, isEnabled);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     BET LIMITS ★ NEW
  ========================= */

  app.get("/api/bet-limits", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const limits = await storage.getBetLimits();
      res.json(limits);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bet-limits", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { number, maxAmount, lotteryTypes, startDate, endDate } = req.body;
      if (!number || !maxAmount) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const limit = await storage.addBetLimit({
        number,
        maxAmount,
        lotteryTypes: lotteryTypes || [],
        startDate: startDate || null,
        endDate: endDate || null,
      });
      res.json({ success: true, limit });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/bet-limits/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { isActive } = req.body;
      await storage.updateBetLimitStatus(id, isActive);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/bet-limits/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteBetLimit(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     BETS
  ========================= */

  // ★ GET /api/bets — supports ?userId=X (profile) or all bets (admin)
  app.get("/api/bets", async (req: Request, res: Response) => {
    try {
      const { userId } = req.query as { userId?: string };
      if (userId) {
        const userBets = await storage.getUserBets(Number(userId));
        return res.json(userBets);
      }
      // All bets (admin)
      const allBets = await storage.getAllBets();
      res.json(allBets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Keep legacy route for backward compatibility
  app.get("/api/bets/:userId", async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const userBets = await storage.getUserBets(userId);
    res.json(userBets);
  });

  app.post("/api/bets", async (req: Request, res: Response) => {
    try {
      const { userId, items } = req.body;
      if (!userId || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const total = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      if (user.balance < total) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      for (const item of items) {
        await storage.createBet({
          userId,
          lotteryType: item.lotteryType,
          betType: item.betType,
          numbers: item.numbers,
          amount: item.amount,
          potentialWin: item.amount * (item.payoutRate || 90),
          drawDate: new Date().toISOString().split("T")[0],
        });
      }

      await storage.updateUserBalance(userId, user.balance - total);
      res.json({ success: true, newBalance: user.balance - total });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     TRANSACTIONS
  ========================= */

  // ★ GET /api/transactions — all transactions (admin)
  app.get("/api/transactions", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const txs = await storage.getAllTransactions();
      res.json(txs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transactions/:userId", async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const txs = await storage.getUserTransactions(userId);
    res.json(txs);
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const { userId, type, amount, slipUrl } = req.body;
      const reference = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await storage.createTransaction({ userId, type, amount, reference, slipUrl: slipUrl || null });
      res.json({ success: true, reference });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ★ PATCH /api/transactions/:id — approve/reject (admin)
  app.patch("/api/transactions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      const tx = await storage.updateTransactionStatus(id, status);
      if (!tx) return res.status(404).json({ error: "Transaction not found" });

      // If approved deposit, add balance to user
      if (status === "approved" && tx.type === "deposit") {
        const user = await storage.getUserById(tx.userId);
        if (user) {
          await storage.updateUserBalance(tx.userId, user.balance + tx.amount);
        }
      }

      // If approved withdrawal, deduct balance
      if (status === "approved" && tx.type === "withdrawal") {
        const user = await storage.getUserById(tx.userId);
        if (user) {
          await storage.updateUserBalance(tx.userId, Math.max(0, user.balance - tx.amount));
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     SETTINGS INIT
  ========================= */

  app.post("/api/admin/init", requireAdmin, async (_req: Request, res: Response) => {
    await storage.initializePayoutRates();
    await storage.initializeBetTypeSettings();
    res.json({ success: true });
  });

  /* =========================
     ERROR HANDLER
  ========================= */

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("API error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  /* =========================
     AUTO-INIT on server start
  ========================= */

  (async () => {
    try {
      await storage.initializePayoutRates();
      await storage.initializeBetTypeSettings();
      console.log("✅ Payout rates & bet type settings initialized");
    } catch (e) {
      console.error("❌ Auto-init error:", e);
    }
  })();

  const httpServer = createServer(app);
  return httpServer;
}
