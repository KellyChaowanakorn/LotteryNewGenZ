import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  fetchThaiGovLottery,
  fetchAllForeignLotteries,
  fetchThaiStock,
  fetchInternationalStock,
  fetchAllStocks,
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

  app.get("/api/results/:date", async (req: Request, res: Response) => {
    const { lotteryType } = req.query as { lotteryType?: string };
    const { date } = req.params;

    if (!lotteryType) {
      return res.status(400).json({ error: "lotteryType required" });
    }

    const result = await storage.getResultsByDate(lotteryType, date);
    res.json(result);
  });

  /* =========================
     LOTTERY RESULTS - LIVE THAI GOV
  ========================= */

  app.get("/api/results/live/thai-gov", async (_req: Request, res: Response) => {
    try {
      const result = await fetchThaiGovLottery();
      
      // บันทึกลง database
      if (!result.error) {
        try {
          await db.insert(lotteryResults).values({
            lotteryType: result.lotteryType,
            drawDate: result.date,
            firstPrize: result.firstPrize,
            threeDigitTop: result.threeDigitTop,
            threeDigitBottom: result.threeDigitBottom,
            twoDigitTop: result.twoDigitTop,
            twoDigitBottom: result.twoDigitBottom,
            isProcessed: 0,
          }).onConflictDoNothing();
        } catch (dbError) {
          console.error("Database save error:", dbError);
        }
      }

      // แปลงเป็นรูปแบบที่ frontend ต้องการ
      res.json({
        status: result.error ? "error" : "success",
        response: {
          date: result.date,
          endpoint: result.source,
          prizes: [
            {
              id: "prizeFirst",
              name: "รางวัลที่ 1",
              number: result.firstPrize ? [result.firstPrize] : [],
            },
          ],
          runningNumbers: [
            {
              id: "runningNumberFrontThree",
              name: "3 ตัวหน้า",
              number: result.threeDigitTop ? [result.threeDigitTop] : [],
            },
            {
              id: "runningNumberBackTwo",
              name: "2 ตัวท้าย",
              number: result.twoDigitBottom ? [result.twoDigitBottom] : [],
            },
          ],
        },
        error: result.error,
      });
    } catch (error: any) {
      console.error("Error fetching Thai Gov lottery:", error);
      res.status(500).json({
        error: "Failed to fetch Thai Government lottery",
        details: error.message,
      });
    }
  });

  /* =========================
     LOTTERY RESULTS - LIVE FOREIGN
  ========================= */

  app.get("/api/results/live/foreign", async (_req: Request, res: Response) => {
    try {
      const results = await fetchAllForeignLotteries();

      // บันทึกลง database
      for (const result of results) {
        if (!result.error) {
          try {
            await db.insert(lotteryResults).values({
              lotteryType: result.lotteryType,
              drawDate: result.date,
              firstPrize: result.firstPrize,
              threeDigitTop: result.threeDigitTop,
              threeDigitBottom: result.threeDigitBottom,
              twoDigitTop: result.twoDigitTop,
              twoDigitBottom: result.twoDigitBottom,
              isProcessed: 0,
            }).onConflictDoNothing();
          } catch (dbError) {
            console.error("Database save error:", dbError);
          }
        }
      }

      res.json(results);
    } catch (error: any) {
      console.error("Error fetching foreign lotteries:", error);
      res.status(500).json({
        error: "Failed to fetch lottery results",
        details: error.message,
      });
    }
  });

  /* =========================
     LOTTERY RESULTS - LIVE HANOI (SEPARATE)
  ========================= */

  app.get("/api/results/live/hanoi", async (_req: Request, res: Response) => {
    try {
      const results = await fetchAllForeignLotteries();
      const hanoi = results.find((r) => r.lotteryType === "HANOI");

      if (hanoi) {
        res.json(hanoi);
      } else {
        res.json({
          lotteryType: "HANOI",
          date: new Date().toLocaleDateString("th-TH"),
          source: "Error",
          error: "ไม่พบข้อมูลหวยฮานอย",
        });
      }
    } catch (error: any) {
      console.error("Error fetching Hanoi lottery:", error);
      res.status(500).json({
        error: "Failed to fetch Hanoi lottery",
        details: error.message,
      });
    }
  });

  /* =========================
     LOTTERY RESULTS - LIVE THAI STOCK
  ========================= */

  app.get("/api/results/live/thai-stock", async (_req: Request, res: Response) => {
    try {
      const result = await fetchThaiStock();

      // บันทึกลง database
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
      res.status(500).json({
        error: "Failed to fetch Thai Stock data",
        details: error.message,
      });
    }
  });

  /* =========================
     LOTTERY RESULTS - LIVE INTERNATIONAL STOCKS
  ========================= */

  app.get("/api/results/live/stock/:symbol", async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const result = await fetchInternationalStock(symbol);

      // บันทึกลง database
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
      console.error("Error fetching stock data:", error);
      res.status(500).json({
        error: "Failed to fetch stock data",
        details: error.message,
      });
    }
  });

  /* =========================
     LOTTERY RESULTS - ALL LIVE (สำหรับแสดงทั้งหมดพร้อมกัน)
  ========================= */

  app.get("/api/results/live/all", async (_req: Request, res: Response) => {
    try {
      const [thaiGov, foreign, stocks] = await Promise.all([
        fetchThaiGovLottery(),
        fetchAllForeignLotteries(),
        fetchAllStocks(),
      ]);

      res.json({
        thaiGov,
        foreign,
        stocks,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error fetching all results:", error);
      res.status(500).json({
        error: "Failed to fetch lottery results",
        details: error.message,
      });
    }
  });

  /* =========================
     ADMIN - INSERT MANUAL RESULTS
  ========================= */

  app.post("/api/admin/results", async (req: Request, res: Response) => {
    try {
      const {
        lotteryType,
        drawDate,
        firstPrize,
        threeDigitTop,
        threeDigitBottom,
        twoDigitTop,
        twoDigitBottom,
      } = req.body;

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

      // คำนวณยอดรวม
      const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);

      // เช็คยอดเงิน
      if (user.balance < total) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // สร้างการแทง
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

      // หักยอดเงิน (ต้องเพิ่ม function updateUserBalance ใน storage)
      // await storage.updateUserBalance(userId, user.balance - total);

      res.json({ success: true });
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
    await storage.createTransaction(req.body);
    res.json({ success: true });
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
     GLOBAL ERROR HANDLER
  ========================= */

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("API error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  const httpServer = createServer(app);
  return httpServer;
}