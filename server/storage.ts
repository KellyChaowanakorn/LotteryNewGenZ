import { db } from "./db";
import {
  users,
  bets,
  transactions,
  affiliates,
  blockedNumbers,
  lotteryResults,
  payoutSettings,
  betTypeSettings,
} from "../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { betTypes } from "../shared/schema";

/* =========================
   USERS
========================= */

export async function getUserByUsername(username: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
  return result[0] ?? null;
}

export async function getUserById(id: number) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] ?? null;
}

export async function updateUserBalance(userId: number, newBalance: number) {
  await db
    .update(users)
    .set({ balance: newBalance })
    .where(eq(users.id, userId));
}

export async function createUser(data: {
  username: string;
  password: string;
  referralCode: string;
  referredBy?: string | null;
}) {
  await db.insert(users).values({
    username: data.username,
    password: data.password,
    referralCode: data.referralCode,
    referredBy: data.referredBy ?? null,
  });
}

/* =========================
   BETS
========================= */

export async function createBet(data: {
  userId: number;
  lotteryType: string;
  betType: string;
  numbers: string;
  amount: number;
  potentialWin: number;
  drawDate: string;
}) {
  await db.insert(bets).values({
    userId: data.userId,
    lotteryType: data.lotteryType,
    betType: data.betType,
    numbers: data.numbers,
    amount: data.amount,
    potentialWin: data.potentialWin,
    drawDate: data.drawDate,
  });
}

export async function getUserBets(userId: number) {
  return db
    .select()
    .from(bets)
    .where(eq(bets.userId, userId))
    .orderBy(desc(bets.createdAt));
}

/* =========================
   TRANSACTIONS
========================= */

export async function createTransaction(data: {
  userId: number;
  type: string;
  amount: number;
  reference: string;
  slipUrl?: string | null;
}) {
  await db.insert(transactions).values({
    userId: data.userId,
    type: data.type,
    amount: data.amount,
    reference: data.reference,
    slipUrl: data.slipUrl ?? null,
  });
}

export async function getUserTransactions(userId: number) {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt));
}

/* =========================
   BLOCKED NUMBERS
========================= */

export async function isNumberBlocked(
  lotteryType: string,
  number: string,
  betType?: string
) {
  const result = await db
    .select()
    .from(blockedNumbers)
    .where(
      and(
        eq(blockedNumbers.lotteryType, lotteryType),
        eq(blockedNumbers.number, number),
        eq(blockedNumbers.isActive, 1),
        betType ? eq(blockedNumbers.betType, betType) : undefined
      )
    );

  return result.length > 0;
}

export async function getBlockedNumbers() {
  return db
    .select()
    .from(blockedNumbers)
    .where(eq(blockedNumbers.isActive, 1))
    .orderBy(desc(blockedNumbers.createdAt));
}

export async function addBlockedNumber(data: {
  lotteryType: string;
  number: string;
  betType?: string | null;
}) {
  await db.insert(blockedNumbers).values({
    lotteryType: data.lotteryType,
    number: data.number,
    betType: data.betType ?? null,
    isActive: 1,
  });
}

export async function removeBlockedNumber(id: number) {
  await db
    .update(blockedNumbers)
    .set({ isActive: 0 })
    .where(eq(blockedNumbers.id, id));
}

/* =========================
   LOTTERY RESULTS
========================= */

export async function getLatestResults(lotteryType: string) {
  const result = await db
    .select()
    .from(lotteryResults)
    .where(eq(lotteryResults.lotteryType, lotteryType))
    .orderBy(desc(lotteryResults.drawDate))
    .limit(1);

  return result[0] ?? null;
}

export async function getResultsByDate(
  lotteryType: string,
  drawDate: string
) {
  const result = await db
    .select()
    .from(lotteryResults)
    .where(
      and(
        eq(lotteryResults.lotteryType, lotteryType),
        eq(lotteryResults.drawDate, drawDate)
      )
    );

  return result[0] ?? null;
}

/* =========================
   PAYOUT SETTINGS
========================= */

export async function getPayoutSettings() {
  return db.select().from(payoutSettings);
}

export async function updatePayoutRate(betType: string, rate: number) {
  const existing = await db
    .select()
    .from(payoutSettings)
    .where(eq(payoutSettings.betType, betType));

  if (existing.length === 0) {
    await db.insert(payoutSettings).values({ betType, rate });
  } else {
    await db
      .update(payoutSettings)
      .set({ rate, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(payoutSettings.betType, betType));
  }
}

export async function initializePayoutRates(): Promise<void> {
  try {
    const defaultRates: Record<string, number> = {
      TWO_TOP: 90,
      TWO_BOTTOM: 90,
      THREE_TOP: 900,
      THREE_TOD: 150,
      RUN_TOP: 3,
      RUN_BOTTOM: 3,
      THREE_STRAIGHT: 900,
      TWO_STRAIGHT: 90,
      THREE_REVERSE: 450,
      TWO_REVERSE: 45,
      FOUR_STRAIGHT: 6000,
      FOUR_TOD: 250,
      FOUR_TOP: 6000,
      FIVE_TOP: 60000,
      REVERSE: 90,
    };

    for (const [betType, rate] of Object.entries(defaultRates)) {
      const existing = await db
        .select()
        .from(payoutSettings)
        .where(eq(payoutSettings.betType, betType))
        .catch(() => []);

      if (existing.length === 0) {
        await db
          .insert(payoutSettings)
          .values({ betType, rate })
          .catch(() => {});
      }
    }
  } catch (error) {
    console.error("Payout rates initialization error:", error);
  }
}

/* =========================
   BET TYPE SETTINGS
========================= */

export async function getBetTypeSettings() {
  return db.select().from(betTypeSettings);
}

export async function updateBetTypeSetting(betType: string, isEnabled: boolean) {
  const existing = await db
    .select()
    .from(betTypeSettings)
    .where(eq(betTypeSettings.betType, betType));

  if (existing.length === 0) {
    await db.insert(betTypeSettings).values({ 
      betType, 
      isEnabled: isEnabled ? 1 : 0 
    });
  } else {
    await db
      .update(betTypeSettings)
      .set({ 
        isEnabled: isEnabled ? 1 : 0, 
        updatedAt: Math.floor(Date.now() / 1000) 
      })
      .where(eq(betTypeSettings.betType, betType));
  }
}

export async function initializeBetTypeSettings(): Promise<void> {
  try {
    for (const betType of betTypes) {
      const existing = await db
        .select()
        .from(betTypeSettings)
        .where(eq(betTypeSettings.betType, betType))
        .catch(() => []);

      if (existing.length === 0) {
        await db
          .insert(betTypeSettings)
          .values({ betType, isEnabled: 1 })
          .catch(() => {});
      }
    }
  } catch (error) {
    console.error("Bet type settings initialization error:", error);
  }
}

/* =========================
   EXPORT STORAGE OBJECT
========================= */

export const storage = {
  // users
  getUserByUsername,
  getUserById,
  createUser,
  updateUserBalance,

  // bets
  createBet,
  getUserBets,

  // transactions
  createTransaction,
  getUserTransactions,

  // blocked numbers
  isNumberBlocked,
  getBlockedNumbers,
  addBlockedNumber,
  removeBlockedNumber,

  // lottery results
  getLatestResults,
  getResultsByDate,

  // payout settings
  getPayoutSettings,
  updatePayoutRate,
  initializePayoutRates,

  // bet type settings
  getBetTypeSettings,
  updateBetTypeSetting,
  initializeBetTypeSettings,
};
