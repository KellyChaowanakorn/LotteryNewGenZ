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
     AUTH
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
      await storage.createUser({
        username,
        password,
        referralCode,
        referredBy: referredBy || null,
      });
      const user = await storage.getUserByUsername(username);
      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     LOTTERY RESULTS - DATABASE
  ========================= */

  app.get("/api/results", async (req: Request, res: Response) => {
    const { lotteryType } = req.query as { lotteryType?: string };
    if (!lotteryType) {
      return res.status(400).json({ error: "lotteryType required" });
    }
    const result = await storage.getLatestResults(lotteryType);
    res.json(result);
  });

  /* =========================
     1. THAI GOVERNMENT LOTTERY
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
        ? result.threeDigitTop.split(",").map((n) => n.trim()).filter((n) => n)
        : [];
      const threeBottomNumbers = result.threeDigitBottom
        ? result.threeDigitBottom.split(",").map((n) => n.trim()).filter((n) => n)
        : [];

      res.json({
        status: result.error ? "error" : "success",
        response: {
          date: result.date,
          endpoint: result.source,
          prizes: [
            {
              id: "prizeFirst",
              name: "รางวัลที่ 1",
              reward: "6000000",
              number: result.firstPrize ? [result.firstPrize] : [],
            },
          ],
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
     2. THAI STOCK (SET)
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
      console.error("Error fetching Thai Stock:", error);
      res.status(500).json({ error: "Failed to fetch Thai Stock data" });
    }
  });

  /* =========================
     3. INTERNATIONAL STOCKS
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
      console.error("Error fetching stock:", error);
      res.status(500).json({ error: "Failed to fetch stock data" });
    }
  });

  /* =========================
     4. ALL STOCKS
  ========================= */

  app.get("/api/results/live/stocks", async (_req: Request, res: Response) => {
    try {
      const results = await fetchAllStocks();
      res.json(results);
    } catch (error: any) {
      console.error("Error fetching all stocks:", error);
      res.status(500).json({ error: "Failed to fetch stock data" });
    }
  });

  /* =========================
     5. MALAYSIA 4D
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
      console.error("Error fetching Malaysia 4D:", error);
      res.status(500).json({ error: "Failed to fetch Malaysia 4D data" });
    }
  });

  /* =========================
     6. ALL RESULTS
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
      console.error("Error fetching all results:", error);
      res.status(500).json({ error: "Failed to fetch lottery results" });
    }
  });

  /* =========================
     ADMIN - INSERT RESULTS
  ========================= */

  app.post("/api/admin/results", async (req: Request, res: Response) => {
    try {
      const { lotteryType, drawDate, firstPrize, threeDigitTop, threeDigitBottom, twoDigitTop, twoDigitBottom } = req.body;
      await db.insert(lotteryResults).values({
        lotteryType,
        drawDate,
        firstPrize,
        threeDigitTop,
        threeDigitBottom,
        twoDigitTop,
        twoDigitBottom,
        isProcessed: 0,
      });
      res.json({ success: true, message: "Results saved successfully" });
    } catch (error: any) {
      console.error("Error saving results:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /* =========================
     BETS
  ========================= */

  app.post("/api/bets", async (req: Request, res: Response) => {
    try {
      const { userId, items } = req.body;
      if (!userId || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
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
      console.error("Error creating bets:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bets/:userId", async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const bets = await storage.getUserBets(userId);
    res.json(bets);
  });

  /* =========================
     TRANSACTIONS
  ========================= */

  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const { userId, type, amount, slipUrl } = req.body;
      const reference = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await storage.createTransaction({ userId, type, amount, reference, slipUrl: slipUrl || null });
      res.json({ success: true, reference });
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transactions/:userId", async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const transactions = await storage.getUserTransactions(userId);
    res.json(transactions);
  });

  /* =========================
     USERS
  ========================= */

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const user = await storage.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  /* =========================
     SETTINGS INIT
  ========================= */

  app.post("/api/admin/init", async (_req: Request, res: Response) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
