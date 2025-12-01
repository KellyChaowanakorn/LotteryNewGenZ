import { db } from "./db";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  users,
  bets,
  blockedNumbers,
  transactions,
  affiliates,
  lotteryResults,
  payoutSettings,
  betLimits,
  betLimitLotteryTypes,
  betTypeSettings,
  type User,
  type InsertUser,
  type Bet,
  type InsertBet,
  type BlockedNumber,
  type InsertBlockedNumber,
  type Transaction,
  type InsertTransaction,
  type Affiliate,
  type InsertLotteryResult,
  type StoredLotteryResult,
  type PayoutSetting,
  type InsertPayoutSetting,
  type BetLimit,
  type InsertBetLimit,
  type BetLimitWithLotteryTypes,
  type BetTypeSetting,
  betTypes
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User | undefined>;
  updateUserAffiliateEarnings(userId: number, amount: number): Promise<User | undefined>;
  updateUserBlockStatus(userId: number, isBlocked: boolean): Promise<User | undefined>;

  getBets(userId?: number): Promise<Bet[]>;
  getBet(id: number): Promise<Bet | undefined>;
  createBet(bet: InsertBet): Promise<Bet>;
  createBetsWithBalanceDeduction(userId: number, betItems: InsertBet[], totalAmount: number): Promise<{ bets: Bet[], transaction: Transaction }>;
  updateBetStatus(id: number, status: string): Promise<Bet | undefined>;

  getBlockedNumbers(lotteryType?: string): Promise<BlockedNumber[]>;
  createBlockedNumber(blocked: InsertBlockedNumber): Promise<BlockedNumber>;
  updateBlockedNumber(id: number, isActive: boolean): Promise<BlockedNumber | undefined>;
  deleteBlockedNumber(id: number): Promise<boolean>;

  getTransactions(userId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined>;

  getAffiliates(referrerId: number): Promise<Affiliate[]>;
  getAllAffiliates(): Promise<Affiliate[]>;
  createAffiliate(referrerId: number, referredId: number): Promise<Affiliate>;
  updateAffiliateStats(referredId: number, betAmount: number): Promise<void>;

  getLotteryResult(lotteryType: string, drawDate: string): Promise<StoredLotteryResult | undefined>;
  getAllLotteryResults(): Promise<StoredLotteryResult[]>;
  createLotteryResult(result: InsertLotteryResult): Promise<StoredLotteryResult>;
  updateLotteryResultProcessed(id: number): Promise<StoredLotteryResult | undefined>;
  getBetsByLotteryAndDate(lotteryType: string, drawDate: string): Promise<Bet[]>;

  getPayoutSettings(): Promise<PayoutSetting[]>;
  getPayoutRate(betType: string): Promise<number>;
  updatePayoutRate(betType: string, rate: number): Promise<PayoutSetting>;
  initializePayoutRates(): Promise<void>;

  getBetLimits(): Promise<BetLimitWithLotteryTypes[]>;
  getBetLimit(id: number): Promise<BetLimitWithLotteryTypes | undefined>;
  createBetLimit(limit: InsertBetLimit, lotteryTypes: string[]): Promise<BetLimitWithLotteryTypes>;
  updateBetLimit(id: number, limit: Partial<InsertBetLimit>, lotteryTypes?: string[]): Promise<BetLimitWithLotteryTypes | undefined>;
  deleteBetLimit(id: number): Promise<boolean>;
  getActiveBetLimitForNumber(number: string, lotteryType: string): Promise<BetLimitWithLotteryTypes | undefined>;
  getTotalBetAmountForNumber(number: string, lotteryType: string, drawDate: string): Promise<number>;

  getBetTypeSettings(): Promise<BetTypeSetting[]>;
  getBetTypeSetting(betType: string): Promise<BetTypeSetting | undefined>;
  updateBetTypeSetting(betType: string, isEnabled: boolean): Promise<BetTypeSetting>;
  initializeBetTypeSettings(): Promise<void>;
  isBetTypeEnabled(betType: string): Promise<boolean>;
  
  getPendingBetsByDrawDate(lotteryType: string, drawDate: string): Promise<Bet[]>;
  updateBetWinResult(betId: number, status: 'won' | 'lost', winAmount: number | null, matchedNumber: string | null): Promise<Bet | undefined>;
  getWinnersByDrawDate(lotteryType: string, drawDate: string): Promise<(Bet & { user: User })[]>;
  getUserWinningBets(userId: number, drawDate?: string): Promise<Bet[]>;
  getUserBetsByDrawDate(userId: number, lotteryType: string, drawDate: string): Promise<Bet[]>;
  markLotteryResultProcessed(lotteryType: string, drawDate: string, totalWinners: number, totalPayout: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(userId: number, amount: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserAffiliateEarnings(userId: number, amount: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ affiliateEarnings: sql`${users.affiliateEarnings} + ${amount}` })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserBlockStatus(userId: number, isBlocked: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isBlocked })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getBets(userId?: number): Promise<Bet[]> {
    if (userId) {
      return db.select().from(bets).where(eq(bets.userId, userId));
    }
    return db.select().from(bets);
  }

  async getBet(id: number): Promise<Bet | undefined> {
    const [bet] = await db.select().from(bets).where(eq(bets.id, id));
    return bet || undefined;
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const [bet] = await db.insert(bets).values(insertBet).returning();
    return bet;
  }

  async createBetsWithBalanceDeduction(
    userId: number, 
    betItems: InsertBet[], 
    totalAmount: number
  ): Promise<{ bets: Bet[], transaction: Transaction }> {
    return db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId));
      if (!user) {
        throw new Error("User not found");
      }
      if (user.balance < totalAmount) {
        throw new Error("Insufficient balance");
      }

      const createdBets: Bet[] = [];
      for (const betItem of betItems) {
        const [bet] = await tx.insert(bets).values(betItem).returning();
        createdBets.push(bet);
      }

      await tx.update(users)
        .set({ balance: sql`${users.balance} - ${totalAmount}` })
        .where(eq(users.id, userId));

      const [transaction] = await tx.insert(transactions).values({
        userId,
        type: "bet",
        amount: -totalAmount,
        status: "approved",
        slipUrl: null,
        reference: `BET${Date.now().toString(36).toUpperCase()}`,
      }).returning();

      return { bets: createdBets, transaction };
    });
  }

  async updateBetStatus(id: number, status: string): Promise<Bet | undefined> {
    const [bet] = await db
      .update(bets)
      .set({ status })
      .where(eq(bets.id, id))
      .returning();
    return bet || undefined;
  }

  async getBlockedNumbers(lotteryType?: string): Promise<BlockedNumber[]> {
    if (lotteryType) {
      return db.select().from(blockedNumbers).where(eq(blockedNumbers.lotteryType, lotteryType));
    }
    return db.select().from(blockedNumbers);
  }

  async createBlockedNumber(insertBlocked: InsertBlockedNumber): Promise<BlockedNumber> {
    const [blocked] = await db.insert(blockedNumbers).values(insertBlocked).returning();
    return blocked;
  }

  async updateBlockedNumber(id: number, isActive: boolean): Promise<BlockedNumber | undefined> {
    const [blocked] = await db
      .update(blockedNumbers)
      .set({ isActive })
      .where(eq(blockedNumbers.id, id))
      .returning();
    return blocked || undefined;
  }

  async deleteBlockedNumber(id: number): Promise<boolean> {
    const result = await db.delete(blockedNumbers).where(eq(blockedNumbers.id, id)).returning();
    return result.length > 0;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions);
  }

  async createTransaction(insertTx: InsertTransaction): Promise<Transaction> {
    const [tx] = await db.insert(transactions).values(insertTx).returning();
    return tx;
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined> {
    const [tx] = await db
      .update(transactions)
      .set({ status })
      .where(eq(transactions.id, id))
      .returning();
    return tx || undefined;
  }

  async getAffiliates(referrerId: number): Promise<Affiliate[]> {
    return db.select().from(affiliates).where(eq(affiliates.referrerId, referrerId));
  }

  async getAllAffiliates(): Promise<Affiliate[]> {
    return db.select().from(affiliates);
  }

  async createAffiliate(referrerId: number, referredId: number): Promise<Affiliate> {
    const [affiliate] = await db
      .insert(affiliates)
      .values({ referrerId, referredId, totalBetAmount: 0, totalDepositAmount: 0, commission: 0 })
      .returning();
    return affiliate;
  }

  async updateAffiliateStats(referredId: number, betAmount: number): Promise<void> {
    await db
      .update(affiliates)
      .set({
        totalBetAmount: sql`${affiliates.totalBetAmount} + ${betAmount}`
      })
      .where(eq(affiliates.referredId, referredId));
  }
  
  async updateAffiliateDepositStats(referredId: number, depositAmount: number): Promise<{referrerId: number; commission: number} | null> {
    const affiliate = await db.select().from(affiliates).where(eq(affiliates.referredId, referredId)).limit(1);
    if (affiliate.length === 0) return null;
    
    const commission = Math.floor(depositAmount * 0.05);
    await db
      .update(affiliates)
      .set({
        totalDepositAmount: sql`${affiliates.totalDepositAmount} + ${depositAmount}`,
        commission: sql`${affiliates.commission} + ${commission}`
      })
      .where(eq(affiliates.referredId, referredId));
    
    return { referrerId: affiliate[0].referrerId, commission };
  }

  async getLotteryResult(lotteryType: string, drawDate: string): Promise<StoredLotteryResult | undefined> {
    const [result] = await db
      .select()
      .from(lotteryResults)
      .where(and(eq(lotteryResults.lotteryType, lotteryType), eq(lotteryResults.drawDate, drawDate)));
    return result || undefined;
  }

  async getAllLotteryResults(): Promise<StoredLotteryResult[]> {
    return db.select().from(lotteryResults);
  }

  async createLotteryResult(result: InsertLotteryResult): Promise<StoredLotteryResult> {
    const [lotteryResult] = await db.insert(lotteryResults).values(result).returning();
    return lotteryResult;
  }

  async updateLotteryResultProcessed(id: number): Promise<StoredLotteryResult | undefined> {
    const [result] = await db
      .update(lotteryResults)
      .set({ isProcessed: true })
      .where(eq(lotteryResults.id, id))
      .returning();
    return result || undefined;
  }

  async getBetsByLotteryAndDate(lotteryType: string, drawDate: string): Promise<Bet[]> {
    return db
      .select()
      .from(bets)
      .where(and(eq(bets.lotteryType, lotteryType), eq(bets.drawDate, drawDate), eq(bets.status, "pending")));
  }

  async getPayoutSettings(): Promise<PayoutSetting[]> {
    return db.select().from(payoutSettings);
  }

  async getPayoutRate(betType: string): Promise<number> {
    const validBetTypes = [
      "TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD", 
      "FOUR_TOP", "FIVE_TOP", "RUN_TOP", "RUN_BOTTOM", "REVERSE"
    ];
    
    if (!validBetTypes.includes(betType)) {
      throw new Error(`Invalid bet type: ${betType}`);
    }
    
    const [setting] = await db.select().from(payoutSettings).where(eq(payoutSettings.betType, betType));
    if (setting) {
      return setting.rate;
    }
    
    throw new Error(`Payout rate not found for bet type: ${betType}. Please ensure payout rates are initialized.`);
  }

  async updatePayoutRate(betType: string, rate: number): Promise<PayoutSetting> {
    const existing = await db.select().from(payoutSettings).where(eq(payoutSettings.betType, betType));
    if (existing.length > 0) {
      const [updated] = await db
        .update(payoutSettings)
        .set({ rate, updatedAt: new Date() })
        .where(eq(payoutSettings.betType, betType))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(payoutSettings)
      .values({ betType, rate })
      .returning();
    return created;
  }

  async initializePayoutRates(): Promise<void> {
    // อัตราจ่าย 9 ประเภทสำหรับหวยไทย
    const defaultRates: Record<string, number> = {
      TWO_TOP: 60,      // 2 ตัวบน x60
      TWO_BOTTOM: 60,   // 2 ตัวล่าง x60
      THREE_TOP: 500,   // 3 ตัวตรง x500
      THREE_TOD: 90,    // 3 ตัวโต๊ด x90
      FOUR_TOP: 900,    // 4 ตัวบน x900
      FIVE_TOP: 2000,   // 5 ตัวบน x2000
      RUN_TOP: 3,       // วิ่งบน x3
      RUN_BOTTOM: 4,    // วิ่งล่าง x4
      REVERSE: 94       // เลขกลับ x94
    };

    // ลบอัตราจ่ายเก่าที่ไม่ใช้แล้ว
    const oldBetTypes = ["THREE_TOOD", "THREE_FRONT", "THREE_BOTTOM", "THREE_REVERSE"];
    for (const oldType of oldBetTypes) {
      await db.delete(payoutSettings).where(eq(payoutSettings.betType, oldType));
    }

    // เพิ่ม/อัปเดตอัตราจ่ายใหม่
    for (const [betType, rate] of Object.entries(defaultRates)) {
      const existing = await db.select().from(payoutSettings).where(eq(payoutSettings.betType, betType));
      if (existing.length === 0) {
        await db.insert(payoutSettings).values({ betType, rate });
      }
    }
  }

  async getBetLimits(): Promise<BetLimitWithLotteryTypes[]> {
    const limits = await db.select().from(betLimits);
    const result: BetLimitWithLotteryTypes[] = [];
    
    for (const limit of limits) {
      const lotteryTypesRows = await db
        .select()
        .from(betLimitLotteryTypes)
        .where(eq(betLimitLotteryTypes.betLimitId, limit.id));
      
      result.push({
        ...limit,
        lotteryTypes: lotteryTypesRows.map(lt => lt.lotteryType)
      });
    }
    
    return result;
  }

  async getBetLimit(id: number): Promise<BetLimitWithLotteryTypes | undefined> {
    const [limit] = await db.select().from(betLimits).where(eq(betLimits.id, id));
    if (!limit) return undefined;
    
    const lotteryTypesRows = await db
      .select()
      .from(betLimitLotteryTypes)
      .where(eq(betLimitLotteryTypes.betLimitId, id));
    
    return {
      ...limit,
      lotteryTypes: lotteryTypesRows.map(lt => lt.lotteryType)
    };
  }

  async createBetLimit(limit: InsertBetLimit, lotteryTypes: string[]): Promise<BetLimitWithLotteryTypes> {
    return db.transaction(async (tx) => {
      const [created] = await tx.insert(betLimits).values(limit).returning();
      
      if (lotteryTypes.length > 0) {
        await tx.insert(betLimitLotteryTypes).values(
          lotteryTypes.map(lt => ({
            betLimitId: created.id,
            lotteryType: lt
          }))
        );
      }
      
      return {
        ...created,
        lotteryTypes
      };
    });
  }

  async updateBetLimit(
    id: number, 
    limitUpdate: Partial<InsertBetLimit>, 
    lotteryTypes?: string[]
  ): Promise<BetLimitWithLotteryTypes | undefined> {
    return db.transaction(async (tx) => {
      if (Object.keys(limitUpdate).length > 0) {
        await tx.update(betLimits).set(limitUpdate).where(eq(betLimits.id, id));
      }
      
      if (lotteryTypes !== undefined) {
        await tx.delete(betLimitLotteryTypes).where(eq(betLimitLotteryTypes.betLimitId, id));
        
        if (lotteryTypes.length > 0) {
          await tx.insert(betLimitLotteryTypes).values(
            lotteryTypes.map(lt => ({
              betLimitId: id,
              lotteryType: lt
            }))
          );
        }
      }
      
      const [updated] = await tx.select().from(betLimits).where(eq(betLimits.id, id));
      if (!updated) return undefined;
      
      const lotteryTypesRows = await tx
        .select()
        .from(betLimitLotteryTypes)
        .where(eq(betLimitLotteryTypes.betLimitId, id));
      
      return {
        ...updated,
        lotteryTypes: lotteryTypesRows.map(lt => lt.lotteryType)
      };
    });
  }

  async deleteBetLimit(id: number): Promise<boolean> {
    const result = await db.delete(betLimits).where(eq(betLimits.id, id)).returning();
    return result.length > 0;
  }

  async getActiveBetLimitForNumber(number: string, lotteryType: string): Promise<BetLimitWithLotteryTypes | undefined> {
    const limits = await db
      .select()
      .from(betLimits)
      .where(and(eq(betLimits.number, number), eq(betLimits.isActive, true)));
    
    for (const limit of limits) {
      const lotteryTypesRows = await db
        .select()
        .from(betLimitLotteryTypes)
        .where(eq(betLimitLotteryTypes.betLimitId, limit.id));
      
      const associatedTypes = lotteryTypesRows.map(lt => lt.lotteryType);
      
      if (associatedTypes.length === 0 || associatedTypes.includes(lotteryType)) {
        return {
          ...limit,
          lotteryTypes: associatedTypes
        };
      }
    }
    
    return undefined;
  }

  async getTotalBetAmountForNumber(number: string, lotteryType: string, drawDate: string): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${bets.amount}), 0)` })
      .from(bets)
      .where(
        and(
          eq(bets.numbers, number),
          eq(bets.lotteryType, lotteryType),
          eq(bets.drawDate, drawDate),
          inArray(bets.status, ["pending", "won", "lost"])
        )
      );
    
    return result[0]?.total || 0;
  }

  async getBetTypeSettings(): Promise<BetTypeSetting[]> {
    return db.select().from(betTypeSettings);
  }

  async getBetTypeSetting(betType: string): Promise<BetTypeSetting | undefined> {
    const [setting] = await db
      .select()
      .from(betTypeSettings)
      .where(eq(betTypeSettings.betType, betType));
    return setting || undefined;
  }

  async updateBetTypeSetting(betType: string, isEnabled: boolean): Promise<BetTypeSetting> {
    const existing = await this.getBetTypeSetting(betType);
    
    if (existing) {
      const [updated] = await db
        .update(betTypeSettings)
        .set({ isEnabled, updatedAt: new Date() })
        .where(eq(betTypeSettings.betType, betType))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(betTypeSettings)
        .values({ betType, isEnabled })
        .returning();
      return created;
    }
  }

  async initializeBetTypeSettings(): Promise<void> {
    for (const betType of betTypes) {
      const existing = await this.getBetTypeSetting(betType);
      if (!existing) {
        await db.insert(betTypeSettings).values({ betType, isEnabled: true });
      }
    }
  }

  async isBetTypeEnabled(betType: string): Promise<boolean> {
    const setting = await this.getBetTypeSetting(betType);
    return setting?.isEnabled ?? true;
  }

  async getPendingBetsByDrawDate(lotteryType: string, drawDate: string): Promise<Bet[]> {
    return db
      .select()
      .from(bets)
      .where(
        and(
          eq(bets.lotteryType, lotteryType),
          eq(bets.drawDate, drawDate),
          eq(bets.status, "pending")
        )
      );
  }

  async updateBetWinResult(
    betId: number,
    status: 'won' | 'lost',
    winAmount: number | null,
    matchedNumber: string | null
  ): Promise<Bet | undefined> {
    const [updated] = await db
      .update(bets)
      .set({
        status,
        winAmount,
        matchedNumber,
        processedAt: new Date()
      })
      .where(eq(bets.id, betId))
      .returning();
    return updated || undefined;
  }

  async getWinnersByDrawDate(lotteryType: string, drawDate: string): Promise<(Bet & { user: User })[]> {
    const winningBets = await db
      .select()
      .from(bets)
      .where(
        and(
          eq(bets.lotteryType, lotteryType),
          eq(bets.drawDate, drawDate),
          eq(bets.status, "won")
        )
      );
    
    const result: (Bet & { user: User })[] = [];
    for (const bet of winningBets) {
      const user = await this.getUser(bet.userId);
      if (user) {
        result.push({ ...bet, user });
      }
    }
    return result;
  }

  async getUserWinningBets(userId: number, drawDate?: string): Promise<Bet[]> {
    if (drawDate) {
      return db
        .select()
        .from(bets)
        .where(
          and(
            eq(bets.userId, userId),
            eq(bets.drawDate, drawDate),
            eq(bets.status, "won")
          )
        );
    }
    return db
      .select()
      .from(bets)
      .where(
        and(
          eq(bets.userId, userId),
          eq(bets.status, "won")
        )
      );
  }

  async getUserBetsByDrawDate(userId: number, lotteryType: string, drawDate: string): Promise<Bet[]> {
    return db
      .select()
      .from(bets)
      .where(
        and(
          eq(bets.userId, userId),
          eq(bets.lotteryType, lotteryType),
          eq(bets.drawDate, drawDate)
        )
      );
  }

  async markLotteryResultProcessed(
    lotteryType: string,
    drawDate: string,
    totalWinners: number,
    totalPayout: number
  ): Promise<void> {
    await db
      .update(lotteryResults)
      .set({
        isProcessed: true,
        processedAt: new Date(),
        totalWinners,
        totalPayout
      })
      .where(
        and(
          eq(lotteryResults.lotteryType, lotteryType),
          eq(lotteryResults.drawDate, drawDate)
        )
      );
  }
}

export const storage = new DatabaseStorage();
