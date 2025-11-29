import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

  app.get("/api/blocked-numbers", async (req, res) => {
    try {
      const lotteryType = req.query.lotteryType as string | undefined;
      const blockedNumbers = await storage.getBlockedNumbers(lotteryType);
      res.json(blockedNumbers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blocked numbers" });
    }
  });

  app.post("/api/blocked-numbers", async (req, res) => {
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

  app.patch("/api/blocked-numbers/:id", async (req, res) => {
    try {
      const { id } = req.params;
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

  app.delete("/api/blocked-numbers/:id", async (req, res) => {
    try {
      const { id } = req.params;
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

      const user = await storage.createUser({
        username,
        password,
        balance: 0,
        referralCode: `QNQ${Date.now().toString(36).toUpperCase()}`,
        referredBy: referralCode || null,
        affiliateEarnings: 0,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
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
      if (!user || user.password !== password) {
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
      const user = await storage.getUser(req.params.id);
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
      if (!userId || !items || !Array.isArray(items) || items.length === 0) {
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
          userId,
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

      await storage.updateUserBalance(userId, -totalAmount);

      await storage.createTransaction({
        userId,
        type: "bet",
        amount: -totalAmount,
        status: "approved",
        slipUrl: null,
        reference: `BET${Date.now().toString(36).toUpperCase()}`,
      });

      res.json({ bets: createdBets, totalAmount });
    } catch (error) {
      res.status(500).json({ error: "Failed to create bets" });
    }
  });

  app.get("/api/bets", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const bets = await storage.getBets(userId);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bets" });
    }
  });

  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const transactions = await storage.getTransactions(req.params.userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { userId, type, amount, slipUrl } = req.body;
      if (!userId || !type || amount === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const transaction = await storage.createTransaction({
        userId,
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

  app.get("/api/lottery-results", async (req, res) => {
    const mockResults = [
      {
        lotteryType: "THAI_GOV",
        date: "2024-11-16",
        results: {
          firstPrize: "123456",
          threeDigitTop: ["123", "456"],
          threeDigitBottom: ["789", "012"],
          twoDigit: "56",
        },
        isExternal: false,
      },
      {
        lotteryType: "THAI_STOCK",
        date: "2024-11-29",
        results: {
          firstPrize: "89",
          threeDigitTop: ["889"],
          twoDigit: "89",
        },
        isExternal: false,
      },
      {
        lotteryType: "HANOI",
        date: "2024-11-28",
        results: {
          firstPrize: "12345",
          threeDigitTop: ["123", "345"],
          twoDigit: "45",
        },
        isExternal: false,
      },
    ];

    res.json(mockResults);
  });

  app.get("/api/affiliates/:userId", async (req, res) => {
    try {
      const affiliates = await storage.getAffiliates(req.params.userId);
      res.json(affiliates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch affiliates" });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "admin123") {
      res.json({ success: true, message: "Admin login successful" });
    } else {
      res.status(401).json({ error: "Invalid admin credentials" });
    }
  });

  return httpServer;
}
