import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import {
  users,
  bets,
  blockedNumbers,
  transactions,
  affiliates,
  lotteryResults,
  payoutSettings,
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
  type InsertPayoutSetting
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
      .values({ referrerId, referredId, totalBetAmount: 0, commission: 0 })
      .returning();
    return affiliate;
  }

  async updateAffiliateStats(referredId: number, betAmount: number): Promise<void> {
    const commission = betAmount * 0.20;
    await db
      .update(affiliates)
      .set({
        totalBetAmount: sql`${affiliates.totalBetAmount} + ${betAmount}`,
        commission: sql`${affiliates.commission} + ${commission}`
      })
      .where(eq(affiliates.referredId, referredId));
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
    const [setting] = await db.select().from(payoutSettings).where(eq(payoutSettings.betType, betType));
    if (setting) {
      return setting.rate;
    }
    const defaultRates: Record<string, number> = {
      THREE_TOP: 900,
      THREE_TOOD: 150,
      THREE_FRONT: 450,
      THREE_BOTTOM: 450,
      THREE_REVERSE: 4500,
      TWO_TOP: 90,
      TWO_BOTTOM: 90,
      RUN_TOP: 3.2,
      RUN_BOTTOM: 4.2
    };
    return defaultRates[betType] || 1;
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
    const defaultRates: Record<string, number> = {
      THREE_TOP: 900,
      THREE_TOOD: 150,
      THREE_FRONT: 450,
      THREE_BOTTOM: 450,
      THREE_REVERSE: 4500,
      TWO_TOP: 90,
      TWO_BOTTOM: 90,
      RUN_TOP: 3.2,
      RUN_BOTTOM: 4.2
    };

    for (const [betType, rate] of Object.entries(defaultRates)) {
      const existing = await db.select().from(payoutSettings).where(eq(payoutSettings.betType, betType));
      if (existing.length === 0) {
        await db.insert(payoutSettings).values({ betType, rate });
      }
    }
  }
}

export const storage = new DatabaseStorage();
