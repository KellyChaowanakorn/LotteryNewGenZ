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

// ★ TELEGRAM NOTIFICATIONS
import {
  sendPaymentNotification,
  sendWithdrawalNotification,
  sendBetNotification,
  sendAdminActionNotification,
  sendWinnersNotification,
} from "./telegram";

export function registerRoutes(app: Express): Server {
  /* =========================
     ADMIN AUTH (Token-based — works on Railway/production)
  ========================= */

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "QNQgod1688";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "$$$QNQgod1688";
  const ADMIN_TOKEN = "QNQ_" + Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}:secret`).toString("base64");

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers["x-admin-token"] as string;
    if (token === ADMIN_TOKEN || req.session?.isAdmin) {
      return next();
    }
    return res.status(401).json({ error: "Unauthorized" });
  };

  app.post("/api/admin/login", (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        if (req.session) req.session.isAdmin = true;
        return res.json({ success: true, token: ADMIN_TOKEN });
      }
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    } catch (error) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }
  });

  app.get("/api/admin/check", (req: Request, res: Response) => {
    const token = req.headers["x-admin-token"] as string;
    res.json({ isAdmin: token === ADMIN_TOKEN || req.session?.isAdmin === true });
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.isAdmin = false;
      req.session.destroy(() => {});
    }
    res.json({ success: true });
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

  // ★ In-memory heartbeat tracking
  const userHeartbeats: Map<number, number> = new Map();

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const user = await storage.getUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  // ★ Heartbeat endpoint — client pings every 30s
  app.post("/api/heartbeat", (req: Request, res: Response) => {
    const { userId } = req.body;
    if (userId) {
      userHeartbeats.set(Number(userId), Date.now());
    }
    res.json({ success: true });
  });

  // ★ Admin: get online status for all users
  app.get("/api/admin/online-users", requireAdmin, (_req: Request, res: Response) => {
    const now = Date.now();
    const TIMEOUT = 2 * 60 * 1000; // 2 minutes
    const onlineUsers: Record<number, boolean> = {};
    userHeartbeats.forEach((lastPing, userId) => {
      onlineUsers[userId] = (now - lastPing) < TIMEOUT;
    });
    res.json(onlineUsers);
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
        lotteryType, drawDate, firstPrize, threeDigitTop, threeDigitBottom, twoDigitTop, twoDigitBottom,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ★ PROCESS RESULT + SEND WINNERS NOTIFICATION
  app.post("/api/lottery-results/:id/process", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await storage.processLotteryResult(id);

      // ★ Send winners notification if any winners
      if (result.won > 0) {
        try {
          const lotteryResult = await storage.getLotteryResultById(id);
          if (lotteryResult) {
            const winnersData = await storage.getWinners(lotteryResult.lotteryType, lotteryResult.drawDate);
            if (winnersData.winners.length > 0) {
              await sendWinnersNotification({
                lotteryType: lotteryResult.lotteryType,
                drawDate: lotteryResult.drawDate,
                winners: winnersData.winners.map((w: any) => ({
                  username: w.username,
                  userId: w.userId,
                  betType: w.betType,
                  numbers: w.numbers,
                  amount: w.amount,
                  winAmount: w.winAmount,
                  matchedNumber: w.matchedNumber,
                })),
                totalPayout: winnersData.totalPayout,
              });
            }
          }
        } catch (notifyErr) {
          console.error("Winners notification error:", notifyErr);
        }
      }

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
            lotteryType: result.lotteryType, drawDate: result.date,
            firstPrize: result.firstPrize, threeDigitTop: result.threeDigitTop,
            threeDigitBottom: result.threeDigitBottom, twoDigitBottom: result.twoDigitBottom,
            isProcessed: 0,
          }).onConflictDoNothing();
        } catch (dbError) { console.error("Database save error:", dbError); }
      }
      const threeTopNumbers = result.threeDigitTop ? result.threeDigitTop.split(",").map((n: string) => n.trim()).filter((n: string) => n) : [];
      const threeBottomNumbers = result.threeDigitBottom ? result.threeDigitBottom.split(",").map((n: string) => n.trim()).filter((n: string) => n) : [];
      res.json({
        status: result.error ? "error" : "success",
        response: {
          date: result.date, endpoint: result.source,
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
            lotteryType: result.lotteryType, drawDate: result.date,
            firstPrize: result.price.toString(), threeDigitTop: result.threeDigit,
            twoDigitTop: result.twoDigit, isProcessed: 0,
          }).onConflictDoNothing();
        } catch (dbError) { console.error("Database save error:", dbError); }
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
            lotteryType: result.lotteryType, drawDate: result.date,
            firstPrize: result.price.toString(), threeDigitTop: result.threeDigit,
            twoDigitTop: result.twoDigit, isProcessed: 0,
          }).onConflictDoNothing();
        } catch (dbError) { console.error("Database save error:", dbError); }
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch stock data" });
    }
  });

  app.get("/api/results/live/stocks", async (_req: Request, res: Response) => {
    try { res.json(await fetchAllStocks()); }
    catch (error: any) { res.status(500).json({ error: "Failed to fetch stock data" }); }
  });

  app.get("/api/results/live/malaysia", async (_req: Request, res: Response) => {
    try {
      const results = await fetchMalaysia4D();
      for (const result of results) {
        if (!result.error && result.firstPrize !== "----") {
          try {
            await db.insert(lotteryResults).values({
              lotteryType: "MALAYSIA", drawDate: result.date,
              firstPrize: result.firstPrize, secondPrize: result.secondPrize,
              thirdPrize: result.thirdPrize, threeDigitTop: result.firstPrize?.slice(-3),
              twoDigitTop: result.firstPrize?.slice(-2), isProcessed: 0,
            }).onConflictDoNothing();
          } catch (dbError) { console.error("Database save error:", dbError); }
        }
      }
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch Malaysia 4D data" });
    }
  });

  app.get("/api/results/live/all", async (_req: Request, res: Response) => {
    try {
      const [thaiGov, stocks, malaysia] = await Promise.all([fetchThaiGovLottery(), fetchAllStocks(), fetchMalaysia4D()]);
      res.json({ thaiGov, stocks, malaysia, timestamp: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch lottery results" });
    }
  });

  app.post("/api/admin/results", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { lotteryType, drawDate, firstPrize, threeDigitTop, threeDigitBottom, twoDigitTop, twoDigitBottom } = req.body;
      await db.insert(lotteryResults).values({ lotteryType, drawDate, firstPrize, threeDigitTop, threeDigitBottom, twoDigitTop, twoDigitBottom, isProcessed: 0 });
      res.json({ success: true, message: "Results saved successfully" });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  /* =========================
     BLOCKED NUMBERS
  ========================= */

  app.get("/api/blocked-numbers", async (_req, res) => {
    try { res.json(await storage.getBlockedNumbers()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/blocked-numbers", requireAdmin, async (req, res) => {
    try {
      const { lotteryType, number, betType, startDate, endDate } = req.body;
      await storage.addBlockedNumber({ lotteryType, number, betType, startDate, endDate });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/blocked-numbers/:id", requireAdmin, async (req, res) => {
    try {
      await storage.updateBlockedNumber(Number(req.params.id), req.body.isActive);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/blocked-numbers/:id", requireAdmin, async (req, res) => {
    try {
      await storage.removeBlockedNumber(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  /* =========================
     PAYOUT SETTINGS
  ========================= */

  app.get("/api/payout-settings", async (_req, res) => {
    try { res.json(await storage.getPayoutSettings()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/payout-rates", async (_req, res) => {
    try { res.json(await storage.getPayoutSettings()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/payout-settings/:betType", requireAdmin, async (req, res) => {
    try { await storage.updatePayoutRate(req.params.betType, req.body.rate); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/payout-rates/:betType", requireAdmin, async (req, res) => {
    try { await storage.updatePayoutRate(req.params.betType, req.body.rate); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  /* =========================
     BET TYPE SETTINGS
  ========================= */

  app.get("/api/bet-type-settings", async (_req, res) => {
    try { res.json(await storage.getBetTypeSettings()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/bet-type-settings/:betType", requireAdmin, async (req, res) => {
    try { await storage.updateBetTypeSetting(req.params.betType, req.body.isEnabled); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/bet-type-settings/:betType", requireAdmin, async (req, res) => {
    try { await storage.updateBetTypeSetting(req.params.betType, req.body.isEnabled); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  /* =========================
     BET LIMITS
  ========================= */

  app.get("/api/bet-limits", requireAdmin, async (_req, res) => {
    try { res.json(await storage.getBetLimits()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/bet-limits", requireAdmin, async (req, res) => {
    try {
      const { number, maxAmount, lotteryTypes, startDate, endDate } = req.body;
      if (!number || !maxAmount) return res.status(400).json({ error: "Missing required fields" });
      const limit = await storage.addBetLimit({ number, maxAmount, lotteryTypes: lotteryTypes || [], startDate: startDate || null, endDate: endDate || null });
      res.json({ success: true, limit });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/bet-limits/:id", requireAdmin, async (req, res) => {
    try { await storage.updateBetLimitStatus(Number(req.params.id), req.body.isActive); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/bet-limits/:id", requireAdmin, async (req, res) => {
    try { await storage.deleteBetLimit(Number(req.params.id)); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  /* =========================
     BETS
     ★ CHECKOUT → TELEGRAM NOTIFICATION
  ========================= */

  app.get("/api/bets", async (req: Request, res: Response) => {
    try {
      const { userId } = req.query as { userId?: string };
      if (userId) return res.json(await storage.getUserBets(Number(userId)));
      res.json(await storage.getAllBets());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/bets/:userId", async (req: Request, res: Response) => {
    res.json(await storage.getUserBets(Number(req.params.userId)));
  });

  // ★ PATCH /api/bets/:id — Admin manual status change (won/lost)
  app.patch("/api/bets/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      if (!["won", "lost"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'won' or 'lost'" });
      }
      const result = await storage.updateBetStatus(id, status);
      if (!result) return res.status(404).json({ error: "Bet not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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

      // ★ TELEGRAM: Notify bet purchase
      try {
        await sendBetNotification({
          username: user.username,
          userId: user.id,
          items: items.map((item: any, idx: number) => ({
            lotteryType: item.lotteryType,
            betType: item.betType,
            numbers: item.numbers,
            amount: item.amount,
            isSet: item.isSet || false,
            setIndex: item.setIndex || idx + 1,
          })),
          totalAmount: total,
        });
      } catch (notifyErr) {
        console.error("Bet notification error:", notifyErr);
      }

      res.json({ success: true, newBalance: user.balance - total });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     TRANSACTIONS
     ★ DEPOSIT/WITHDRAWAL → TELEGRAM NOTIFICATION
     ★ ADMIN APPROVE/REJECT → TELEGRAM NOTIFICATION
  ========================= */

  app.get("/api/transactions", requireAdmin, async (_req, res) => {
    try { res.json(await storage.getAllTransactions()); } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/transactions/:userId", async (req, res) => {
    res.json(await storage.getUserTransactions(Number(req.params.userId)));
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const { userId, type, amount, slipUrl } = req.body;
      const reference = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await storage.createTransaction({ userId, type, amount, reference, slipUrl: slipUrl || null });

      // ★ TELEGRAM: Notify deposit or withdrawal
      try {
        const user = await storage.getUserById(userId);
        const username = user?.username || `User #${userId}`;

        if (type === "deposit") {
          await sendPaymentNotification({
            username,
            userId,
            amount: Math.abs(amount),
            reference,
            hasSlip: !!slipUrl,
          });
        } else if (type === "withdrawal") {
          await sendWithdrawalNotification({
            username,
            userId,
            amount: Math.abs(amount),
            reference,
          });
        }
      } catch (notifyErr) {
        console.error("Transaction notification error:", notifyErr);
      }

      res.json({ success: true, reference });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ★ ADMIN APPROVE/REJECT → TELEGRAM NOTIFICATION
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
          await storage.updateUserBalance(tx.userId, Math.max(0, user.balance - Math.abs(tx.amount)));
        }
      }

      // ★ TELEGRAM: Notify admin action (approve/reject)
      try {
        const user = await storage.getUserById(tx.userId);
        const username = user?.username || `User #${tx.userId}`;
        const txType = tx.type === "deposit" ? "deposit" : "withdrawal";

        await sendAdminActionNotification({
          username,
          userId: tx.userId,
          transactionType: txType as 'deposit' | 'withdrawal',
          amount: tx.amount,
          action: status === "approved" ? "approved" : "rejected",
          transactionId: tx.id,
        });
      } catch (notifyErr) {
        console.error("Admin action notification error:", notifyErr);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     CHAT ★ NEW
  ========================= */

  // User: get own chat messages
  app.get("/api/chat/:userId", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // User or Admin: send message
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { userId, senderType, message } = req.body;
      if (!userId || !senderType || !message) {
        return res.status(400).json({ error: "Missing fields" });
      }
      await storage.sendChatMessage(userId, senderType, message.trim());
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Mark messages as read
  app.post("/api/chat/:userId/read", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const { senderType } = req.body;
      await storage.markChatRead(userId, senderType);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Admin: get all chat conversations
  app.get("/api/admin/chats", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const chats = await storage.getAllChats();
      res.json(chats);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  /* =========================
     SETTINGS INIT
  ========================= */

  app.post("/api/admin/init", requireAdmin, async (_req, res) => {
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
