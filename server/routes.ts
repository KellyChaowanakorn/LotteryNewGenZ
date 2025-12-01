import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword } from "./password";
import { sendPaymentNotification, sendWithdrawalNotification, sendBetNotification, sendAdminActionNotification, sendTelegramMessage } from "./telegram";


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

  app.get("/api/bet-limits", async (req, res) => {
    try {
      const limits = await storage.getBetLimits();
      res.json(limits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bet limits" });
    }
  });

  app.get("/api/bet-limits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const limit = await storage.getBetLimit(id);
      if (!limit) {
        return res.status(404).json({ error: "Bet limit not found" });
      }
      res.json(limit);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bet limit" });
    }
  });

  app.post("/api/bet-limits", requireAdmin, async (req, res) => {
    try {
      const { number, maxAmount, isActive = true, lotteryTypes = [] } = req.body;
      if (!number || maxAmount === undefined) {
        return res.status(400).json({ error: "Missing required fields: number and maxAmount" });
      }
      if (typeof maxAmount !== "number" || maxAmount <= 0) {
        return res.status(400).json({ error: "maxAmount must be a positive number" });
      }
      const limit = await storage.createBetLimit(
        { number, maxAmount, isActive },
        lotteryTypes
      );
      res.json(limit);
    } catch (error) {
      console.error("Create bet limit error:", error);
      res.status(500).json({ error: "Failed to create bet limit" });
    }
  });

  app.patch("/api/bet-limits/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const { number, maxAmount, isActive, lotteryTypes } = req.body;
      
      const updateData: { number?: string; maxAmount?: number; isActive?: boolean } = {};
      if (number !== undefined) updateData.number = number;
      if (maxAmount !== undefined) updateData.maxAmount = maxAmount;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const limit = await storage.updateBetLimit(id, updateData, lotteryTypes);
      if (!limit) {
        return res.status(404).json({ error: "Bet limit not found" });
      }
      res.json(limit);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bet limit" });
    }
  });

  app.delete("/api/bet-limits/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const deleted = await storage.deleteBetLimit(id);
      if (!deleted) {
        return res.status(404).json({ error: "Bet limit not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bet limit" });
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

      const user = await storage.getUser(userIdNum);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      const betInserts = [];
      for (const item of items) {
        const { lotteryType, betType, numbers, amount } = item;
        
        const isBetTypeEnabled = await storage.isBetTypeEnabled(betType);
        if (!isBetTypeEnabled) {
          return res.status(400).json({ 
            error: `Bet type ${betType} is currently disabled. ไม่รับแทงประเภทนี้ในขณะนี้`
          });
        }

        let payoutRate: number;
        try {
          payoutRate = await storage.getPayoutRate(betType);
        } catch (payoutError: any) {
          console.error("Payout rate error:", payoutError.message);
          return res.status(500).json({ 
            error: "System configuration error. Please contact administrator." 
          });
        }
        
        const potentialWin = amount * payoutRate;

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

        const drawDate = new Date().toISOString().split("T")[0];
        
        const betLimit = await storage.getActiveBetLimitForNumber(numbers, lotteryType);
        if (betLimit) {
          const existingTotal = await storage.getTotalBetAmountForNumber(numbers, lotteryType, drawDate);
          const newTotal = existingTotal + amount;
          
          if (newTotal > betLimit.maxAmount) {
            const remaining = Math.max(0, betLimit.maxAmount - existingTotal);
            return res.status(400).json({ 
              error: `Bet limit exceeded for ${numbers}. Max: ${betLimit.maxAmount.toLocaleString()}฿, Current: ${existingTotal.toLocaleString()}฿, Remaining: ${remaining.toLocaleString()}฿`
            });
          }
        }

        betInserts.push({
          userId: userIdNum,
          lotteryType,
          betType,
          numbers,
          amount,
          potentialWin,
          status: "pending",
          drawDate,
        });
      }

      const { bets: createdBets } = await storage.createBetsWithBalanceDeduction(
        userIdNum,
        betInserts,
        totalAmount
      );

      await storage.updateAffiliateStats(userIdNum, totalAmount);

      const username = user?.username || `User #${userIdNum}`;
      const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || undefined;
      
      sendBetNotification({
        username,
        userId: userIdNum,
        items: items.map((item: any) => ({
          lotteryType: item.lotteryType,
          betType: item.betType,
          numbers: item.numbers,
          amount: item.amount,
          isSet: item.isSet,
          setIndex: item.setIndex
        })),
        totalAmount,
        ip: clientIp
      }).catch(err => {
        console.error("Failed to send Telegram bet notification:", err);
      });

      res.json({ bets: createdBets, totalAmount });
    } catch (error: any) {
      console.error("Bet creation error:", error);
      if (error.message === "Insufficient balance") {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      if (error.message === "User not found") {
        return res.status(404).json({ error: "User not found" });
      }
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

      const user = await storage.getUser(userIdNum);
      const username = user?.username || `User #${userIdNum}`;
      const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || undefined;
      
      if (type === "deposit") {
        sendPaymentNotification({
          username,
          userId: userIdNum,
          amount,
          hasSlip: !!slipUrl,
          ip: clientIp
        }).catch(err => {
          console.error("Failed to send Telegram notification:", err);
        });
      } else if (type === "withdrawal") {
        sendWithdrawalNotification({
          username,
          userId: userIdNum,
          amount,
          ip: clientIp
        }).catch(err => {
          console.error("Failed to send Telegram notification:", err);
        });
      }

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.post("/api/confirm_payment", async (req, res) => {
    try {
      const { user_name = "ผู้ใช้ไม่ระบุ", amount = "ไม่ระบุ", type = "ไม่ระบุ" } = req.body;
      
      let action = "";
      if (type === "deposit") {
        action = `👤 ${user_name} โอนเงินเข้า`;
      } else if (type === "withdrawal") {
        action = `👤 ${user_name} ถอนเงินออก`;
      } else {
        action = `👤 ${user_name} ทำรายการ (ประเภท: ${type})`;
      }
      
      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "ไม่ทราบ";
      const timestamp = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
      const message = `🚨 <b>แจ้งเตือนรายการใหม่!</b>\n${action}\n💰 จำนวน: ${amount} บาท\n⏰ เวลา: ${timestamp}\n📍 IP: ${clientIp}`;
      
      const success = await sendTelegramMessage(message);
      
      if (success) {
        res.json({ status: "success", message: "แจ้งเตือนส่งแล้ว!" });
      } else {
        res.status(500).json({ status: "error", message: "ส่งล้มเหลว" });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ status: "error", message: "เกิดข้อผิดพลาด" });
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

      if (status === "approved" || status === "rejected") {
        const user = await storage.getUser(existingTx.userId);
        const username = user?.username || `User #${existingTx.userId}`;
        
        sendAdminActionNotification({
          username,
          userId: existingTx.userId,
          transactionType: existingTx.type as 'deposit' | 'withdrawal',
          amount: existingTx.amount,
          action: status as 'approved' | 'rejected',
          transactionId: id
        }).catch(err => {
          console.error("Failed to send admin action notification:", err);
        });
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

  // ตรวจสอบหวยถูกรางวัล - 9 ประเภทสำหรับหวยไทย
  // รองรับทั้งเลขเดี่ยวและเลขชุด (comma-separated)
  function checkBetWin(bet: { betType: string; numbers: string }, result: {
    firstPrize?: string | null;
    threeDigitTop?: string | null;
    threeDigitBottom?: string | null;
    twoDigitTop?: string | null;
    twoDigitBottom?: string | null;
    runTop?: string | null;
    runBottom?: string | null;
  }): boolean {
    const firstPrize = result.firstPrize;
    
    // ถ้าไม่มี firstPrize และเป็น bet type ที่ต้องใช้ firstPrize ให้ return false
    if (!firstPrize || firstPrize.length < 2) {
      // TWO_BOTTOM และ RUN_BOTTOM ไม่ต้องใช้ firstPrize
      if (bet.betType !== "TWO_BOTTOM" && bet.betType !== "RUN_BOTTOM") {
        return false;
      }
    }
    
    // แยกเลขที่ซื้อ (รองรับ comma-separated สำหรับหวยชุด)
    const betNumbers = bet.numbers.split(",").map(n => n.trim()).filter(n => n.length > 0);
    
    // ตรวจสอบแต่ละเลขในชุด - ถ้ามีเลขใดถูกก็ถือว่าถูกรางวัล
    for (const betNumber of betNumbers) {
      let isWin = false;
      
      switch (bet.betType) {
        // 2 ตัวบน: 2 ตัวท้ายของรางวัลที่ 1 (461252 → 52)
        case "TWO_TOP":
          isWin = betNumber === firstPrize?.slice(-2);
          break;
        
        // 2 ตัวล่าง: รางวัลเลขท้าย 2 ตัว (รางวัลแยก เช่น 22)
        case "TWO_BOTTOM":
          isWin = betNumber === result.twoDigitBottom;
          break;
        
        // 3 ตัวตรง: 3 ตัวท้ายของรางวัลที่ 1 (461252 → 252)
        case "THREE_TOP":
          isWin = betNumber === firstPrize?.slice(-3);
          break;
        
        // 3 ตัวโต๊ด: สลับตำแหน่งได้ (252, 225, 522, ...)
        case "THREE_TOD": {
          const lastThree = firstPrize?.slice(-3);
          if (lastThree && lastThree.length === 3 && betNumber.length === 3) {
            const sortedBet = betNumber.split("").sort().join("");
            const sortedResult = lastThree.split("").sort().join("");
            isWin = sortedBet === sortedResult;
          }
          break;
        }
        
        // 4 ตัวบน: 4 ตัวท้ายของรางวัลที่ 1 (461252 → 1252)
        case "FOUR_TOP":
          isWin = betNumber === firstPrize?.slice(-4);
          break;
        
        // 5 ตัวบน: 5 ตัวท้ายของรางวัลที่ 1 (461252 → 61252)
        case "FIVE_TOP":
          isWin = betNumber === firstPrize?.slice(-5);
          break;
        
        // วิ่งบน (เลขลอยบน): ซื้อ 1 ตัว ถ้าอยู่ใน 3 ตัวบน (252 → 2, 5 ถูก)
        case "RUN_TOP": {
          const lastThree = firstPrize?.slice(-3);
          if (lastThree && betNumber.length === 1) {
            isWin = lastThree.includes(betNumber);
          }
          break;
        }
        
        // วิ่งล่าง (เลขลอยล่าง): ซื้อ 1 ตัว ถ้าอยู่ใน 2 ตัวล่าง (22 → 2 ถูก)
        case "RUN_BOTTOM": {
          const bottomTwo = result.twoDigitBottom;
          if (bottomTwo && betNumber.length === 1) {
            isWin = bottomTwo.includes(betNumber);
          }
          break;
        }
        
        // เลขกลับ 2 ตัวบน: ซื้อ 52 ถ้าผล 52 หรือ 25 ก็ถูก
        case "REVERSE": {
          const lastTwo = firstPrize?.slice(-2);
          if (lastTwo && lastTwo.length === 2 && betNumber.length === 2) {
            const reversedBet = betNumber.split("").reverse().join("");
            isWin = betNumber === lastTwo || reversedBet === lastTwo;
          }
          break;
        }
        
        default:
          isWin = false;
      }
      
      // ถ้ามีเลขใดถูก ให้ return true ทันที
      if (isWin) {
        return true;
      }
    }
    
    return false;
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
    return Array.from(new Set(result));
  }

  // ฟังก์ชันตรวจสอบว่า bet type นี้ต้องใช้ field ใดของผลหวย
  function canProcessBet(betType: string, result: {
    firstPrize?: string | null;
    twoDigitBottom?: string | null;
  }): { canProcess: boolean; reason?: string } {
    // bet types ที่ต้องใช้ firstPrize
    const needsFirstPrize = ["TWO_TOP", "THREE_TOP", "THREE_TOD", "FOUR_TOP", "FIVE_TOP", "RUN_TOP", "REVERSE"];
    // bet types ที่ต้องใช้ twoDigitBottom
    const needsTwoDigitBottom = ["TWO_BOTTOM", "RUN_BOTTOM"];
    
    if (needsFirstPrize.includes(betType)) {
      if (!result.firstPrize || result.firstPrize.length < 5) {
        return { canProcess: false, reason: "Missing or invalid firstPrize" };
      }
    }
    
    if (needsTwoDigitBottom.includes(betType)) {
      if (!result.twoDigitBottom || result.twoDigitBottom.length !== 2) {
        return { canProcess: false, reason: "Missing or invalid twoDigitBottom" };
      }
    }
    
    return { canProcess: true };
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
      
      // ตรวจสอบว่าผลหวยมีข้อมูลครบ (อย่างน้อยต้องมี firstPrize)
      if (!lotteryResult.firstPrize || lotteryResult.firstPrize.length < 5) {
        return res.status(400).json({ 
          error: "Cannot process: lottery result is incomplete (missing firstPrize)" 
        });
      }

      const pendingBets = await storage.getBetsByLotteryAndDate(
        lotteryResult.lotteryType, 
        lotteryResult.drawDate
      );

      let wonCount = 0;
      let lostCount = 0;
      let skippedCount = 0;
      let totalWinnings = 0;

      for (const bet of pendingBets) {
        // ตรวจสอบว่า bet นี้สามารถประมวลผลได้หรือไม่
        const { canProcess, reason } = canProcessBet(bet.betType, lotteryResult);
        
        if (!canProcess) {
          // ข้าม bet ที่ไม่สามารถประมวลผลได้ (ยังคง pending)
          console.log(`Skipping bet ${bet.id} (${bet.betType}): ${reason}`);
          skippedCount++;
          continue;
        }
        
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
        processed: wonCount + lostCount,
        won: wonCount,
        lost: lostCount,
        skipped: skippedCount,
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

  app.get("/api/payout-rates", async (req, res) => {
    try {
      const settings = await storage.getPayoutSettings();
      if (settings.length === 0) {
        await storage.initializePayoutRates();
        const initializedSettings = await storage.getPayoutSettings();
        return res.json(initializedSettings);
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching payout rates:", error);
      res.status(500).json({ error: "Failed to fetch payout rates" });
    }
  });

  app.patch("/api/payout-rates/:betType", requireAdmin, async (req, res) => {
    try {
      const { betType } = req.params;
      const { rate } = req.body;
      
      const validBetTypes = [
        "TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD",
        "FOUR_TOP", "FIVE_TOP", "RUN_TOP", "RUN_BOTTOM", "REVERSE"
      ];
      
      if (!validBetTypes.includes(betType)) {
        return res.status(400).json({ error: "Invalid bet type" });
      }
      
      if (typeof rate !== "number" || isNaN(rate)) {
        return res.status(400).json({ error: "Rate must be a valid number" });
      }
      
      if (rate <= 0) {
        return res.status(400).json({ error: "Rate must be greater than 0" });
      }
      
      if (rate > 10000) {
        return res.status(400).json({ error: "Rate must not exceed 10000" });
      }
      
      const updated = await storage.updatePayoutRate(betType, rate);
      res.json(updated);
    } catch (error) {
      console.error("Error updating payout rate:", error);
      res.status(500).json({ error: "Failed to update payout rate" });
    }
  });

  app.get("/api/bet-type-settings", async (req, res) => {
    try {
      const settings = await storage.getBetTypeSettings();
      if (settings.length === 0) {
        await storage.initializeBetTypeSettings();
        const initializedSettings = await storage.getBetTypeSettings();
        return res.json(initializedSettings);
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching bet type settings:", error);
      res.status(500).json({ error: "Failed to fetch bet type settings" });
    }
  });

  app.patch("/api/bet-type-settings/:betType", requireAdmin, async (req, res) => {
    try {
      const { betType } = req.params;
      const { isEnabled } = req.body;
      
      const validBetTypes = [
        "TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD",
        "FOUR_TOP", "FIVE_TOP", "RUN_TOP", "RUN_BOTTOM", "REVERSE"
      ];
      
      if (!validBetTypes.includes(betType)) {
        return res.status(400).json({ error: "Invalid bet type" });
      }
      
      if (typeof isEnabled !== "boolean") {
        return res.status(400).json({ error: "isEnabled must be a boolean" });
      }
      
      const updated = await storage.updateBetTypeSetting(betType, isEnabled);
      res.json(updated);
    } catch (error) {
      console.error("Error updating bet type setting:", error);
      res.status(500).json({ error: "Failed to update bet type setting" });
    }
  });

  await storage.initializePayoutRates();
  await storage.initializeBetTypeSettings();

  return httpServer;
}
