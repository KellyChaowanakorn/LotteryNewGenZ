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
  betLimits,
  betLimitLotteryTypes,
  betTypes,
  payoutRates as defaultPayoutRates,
} from "../shared/schema";
import type { BetLimitWithLotteryTypes } from "../shared/schema";
import { eq, and, desc, sql, ne } from "drizzle-orm";

/* =========================
   USERS
========================= */

export async function getUserByUsername(username: string) {
  const result = await db.select().from(users).where(eq(users.username, username));
  return result[0] ?? null;
}

export async function getUserById(id: number) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] ?? null;
}

export async function updateUserBalance(userId: number, newBalance: number) {
  await db.update(users).set({ balance: newBalance }).where(eq(users.id, userId));
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

export async function getAllUsers() {
  return db.select({
    id: users.id,
    username: users.username,
    balance: users.balance,
    referralCode: users.referralCode,
    referredBy: users.referredBy,
    affiliateEarnings: users.affiliateEarnings,
    isBlocked: users.isBlocked,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt));
}

export async function updateUserBlocked(userId: number, isBlocked: boolean) {
  await db.update(users).set({ isBlocked: isBlocked ? 1 : 0 }).where(eq(users.id, userId));
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
  return db.select().from(bets).where(eq(bets.userId, userId)).orderBy(desc(bets.createdAt));
}

export async function getAllBets() {
  return db.select().from(bets).orderBy(desc(bets.createdAt));
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
  return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
}

export async function getAllTransactions() {
  return db.select().from(transactions).orderBy(desc(transactions.createdAt));
}

export async function updateTransactionStatus(id: number, status: string) {
  await db.update(transactions).set({ status }).where(eq(transactions.id, id));
  return db.select().from(transactions).where(eq(transactions.id, id)).then(r => r[0] ?? null);
}

/* =========================
   BLOCKED NUMBERS
========================= */

export async function isNumberBlocked(lotteryType: string, number: string, betType?: string) {
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
  // Return ALL blocked numbers (including inactive) for admin listing
  return db.select().from(blockedNumbers).orderBy(desc(blockedNumbers.createdAt));
}

export async function addBlockedNumber(data: {
  lotteryType: string;
  number: string;
  betType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  await db.insert(blockedNumbers).values({
    lotteryType: data.lotteryType,
    number: data.number,
    betType: data.betType ?? null,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    isActive: 1,
  });
}

export async function updateBlockedNumber(id: number, isActive: number) {
  await db.update(blockedNumbers).set({ isActive }).where(eq(blockedNumbers.id, id));
}

export async function removeBlockedNumber(id: number) {
  await db.delete(blockedNumbers).where(eq(blockedNumbers.id, id));
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

export async function getResultsByDate(lotteryType: string, drawDate: string) {
  const result = await db
    .select()
    .from(lotteryResults)
    .where(and(eq(lotteryResults.lotteryType, lotteryType), eq(lotteryResults.drawDate, drawDate)));
  return result[0] ?? null;
}

export async function getAllLotteryResults() {
  return db.select().from(lotteryResults).orderBy(desc(lotteryResults.createdAt));
}

export async function createLotteryResult(data: {
  lotteryType: string;
  drawDate: string;
  firstPrize?: string;
  threeDigitTop?: string;
  threeDigitBottom?: string;
  twoDigitTop?: string;
  twoDigitBottom?: string;
}) {
  await db.insert(lotteryResults).values({
    lotteryType: data.lotteryType,
    drawDate: data.drawDate,
    firstPrize: data.firstPrize || null,
    threeDigitTop: data.threeDigitTop || null,
    threeDigitBottom: data.threeDigitBottom || null,
    twoDigitTop: data.twoDigitTop || null,
    twoDigitBottom: data.twoDigitBottom || null,
    isProcessed: 0,
  });
}

export async function getLotteryResultById(id: number) {
  const result = await db.select().from(lotteryResults).where(eq(lotteryResults.id, id));
  return result[0] ?? null;
}

/* =========================
   PROCESS LOTTERY RESULT
========================= */

function getPermutations(str: string): string[] {
  if (str.length <= 1) return [str];
  const perms: Set<string> = new Set();
  for (let i = 0; i < str.length; i++) {
    const rest = str.slice(0, i) + str.slice(i + 1);
    for (const p of getPermutations(rest)) {
      perms.add(str[i] + p);
    }
  }
  return Array.from(perms);
}

function checkBetWin(
  bet: { betType: string; numbers: string },
  result: {
    firstPrize: string | null;
    threeDigitTop: string | null;
    threeDigitBottom: string | null;
    twoDigitTop: string | null;
    twoDigitBottom: string | null;
  }
): { won: boolean; matchedNumber: string | null } {
  const fp = result.firstPrize || "";
  const threeTop = result.threeDigitTop || fp.slice(-3);
  const threeBottom = result.threeDigitBottom || "";
  const twoTop = result.twoDigitTop || fp.slice(-2);
  const twoBottom = result.twoDigitBottom || "";

  switch (bet.betType) {
    case "TWO_TOP":
      return { won: bet.numbers === twoTop, matchedNumber: twoTop };
    case "TWO_BOTTOM":
      return { won: bet.numbers === twoBottom, matchedNumber: twoBottom };
    case "THREE_TOP": {
      const topNums = threeTop.split(",").map(n => n.trim());
      const matched = topNums.includes(bet.numbers);
      return { won: matched, matchedNumber: matched ? bet.numbers : null };
    }
    case "THREE_TOD": {
      const perms = getPermutations(bet.numbers);
      const topNums = threeTop.split(",").map(n => n.trim());
      const match = perms.find(p => topNums.includes(p));
      return { won: !!match, matchedNumber: match || null };
    }
    case "THREE_FRONT":
      return { won: bet.numbers === fp.slice(0, 3), matchedNumber: fp.slice(0, 3) };
    case "THREE_BACK":
      return { won: bet.numbers === fp.slice(-3), matchedNumber: fp.slice(-3) };
    case "FOUR_TOP":
      return { won: bet.numbers === fp.slice(-4), matchedNumber: fp.slice(-4) };
    case "FIVE_TOP":
      return { won: bet.numbers === fp.slice(-5), matchedNumber: fp.slice(-5) };
    case "RUN_TOP": {
      const topDigits = threeTop.replace(/,/g, "").replace(/ /g, "");
      return { won: topDigits.includes(bet.numbers), matchedNumber: topDigits.includes(bet.numbers) ? bet.numbers : null };
    }
    case "RUN_BOTTOM": {
      return { won: twoBottom.includes(bet.numbers), matchedNumber: twoBottom.includes(bet.numbers) ? bet.numbers : null };
    }
    default:
      return { won: false, matchedNumber: null };
  }
}

export async function processLotteryResult(resultId: number) {
  const result = await getLotteryResultById(resultId);
  if (!result || result.isProcessed) {
    throw new Error("Result not found or already processed");
  }

  // Get payout rates from database
  const rates = await getPayoutSettings();
  const rateMap: Record<string, number> = {};
  for (const r of rates) {
    rateMap[r.betType] = r.rate;
  }

  // Find all pending bets for this lottery type and draw date
  const pendingBets = await db
    .select()
    .from(bets)
    .where(
      and(
        eq(bets.lotteryType, result.lotteryType),
        eq(bets.drawDate, result.drawDate),
        eq(bets.status, "pending")
      )
    );

  let wonCount = 0;
  let lostCount = 0;
  let totalPayout = 0;
  const now = Math.floor(Date.now() / 1000);

  for (const bet of pendingBets) {
    const { won, matchedNumber } = checkBetWin(bet, result);

    if (won) {
      const rate = rateMap[bet.betType] || (defaultPayoutRates as Record<string, number>)[bet.betType] || 0;
      const winAmount = bet.amount * rate;
      totalPayout += winAmount;
      wonCount++;

      await db.update(bets).set({
        status: "won",
        winAmount,
        matchedNumber,
        processedAt: now,
      }).where(eq(bets.id, bet.id));

      // Credit user balance
      const user = await getUserById(bet.userId);
      if (user) {
        await updateUserBalance(bet.userId, user.balance + winAmount);
      }
    } else {
      lostCount++;
      await db.update(bets).set({
        status: "lost",
        processedAt: now,
      }).where(eq(bets.id, bet.id));
    }
  }

  // Mark result as processed
  await db.update(lotteryResults).set({
    isProcessed: 1,
    processedAt: now,
    totalWinners: wonCount,
    totalPayout,
  }).where(eq(lotteryResults.id, resultId));

  return { won: wonCount, lost: lostCount, totalPayout };
}

/* =========================
   WINNERS & PROCESSED DRAWS
========================= */

export async function getWinners(lotteryType: string, drawDate: string) {
  const result = await getResultsByDate(lotteryType, drawDate);

  const wonBets = await db
    .select({
      betId: bets.id,
      userId: bets.userId,
      betType: bets.betType,
      numbers: bets.numbers,
      amount: bets.amount,
      winAmount: bets.winAmount,
      matchedNumber: bets.matchedNumber,
      processedAt: bets.processedAt,
    })
    .from(bets)
    .where(
      and(
        eq(bets.lotteryType, lotteryType),
        eq(bets.drawDate, drawDate),
        eq(bets.status, "won")
      )
    );

  const winners = await Promise.all(
    wonBets.map(async (bet) => {
      const user = await getUserById(bet.userId);
      return {
        ...bet,
        username: user?.username || `User #${bet.userId}`,
        winAmount: bet.winAmount || 0,
      };
    })
  );

  const totalPayout = winners.reduce((sum, w) => sum + w.winAmount, 0);

  return {
    lotteryType,
    drawDate,
    lotteryResult: result,
    winners,
    totalWinners: winners.length,
    totalPayout,
  };
}

export async function getProcessedDraws() {
  return db
    .select()
    .from(lotteryResults)
    .where(eq(lotteryResults.isProcessed, 1))
    .orderBy(desc(lotteryResults.processedAt));
}

/* =========================
   ADMIN STATS
========================= */

export async function getAdminStats() {
  const allUsers = await db.select().from(users);
  const allBetsData = await db.select().from(bets);
  const allTx = await db.select().from(transactions);
  const allAff = await db.select().from(affiliates);

  return {
    users: {
      total: allUsers.length,
      blocked: allUsers.filter(u => u.isBlocked).length,
      active: allUsers.filter(u => !u.isBlocked).length,
    },
    bets: {
      total: allBetsData.length,
      pending: allBetsData.filter(b => b.status === "pending").length,
      won: allBetsData.filter(b => b.status === "won").length,
      lost: allBetsData.filter(b => b.status === "lost").length,
      totalAmount: allBetsData.reduce((sum, b) => sum + b.amount, 0),
    },
    transactions: {
      pendingDeposits: allTx.filter(t => t.type === "deposit" && t.status === "pending").length,
      totalDeposits: allTx.filter(t => t.type === "deposit").reduce((sum, t) => sum + t.amount, 0),
    },
    affiliates: {
      total: allAff.length,
      totalCommission: allAff.reduce((sum, a) => sum + a.commission, 0),
    },
  };
}

/* =========================
   PAYOUT SETTINGS
========================= */

export async function getPayoutSettings() {
  return db.select().from(payoutSettings);
}

export async function updatePayoutRate(betType: string, rate: number) {
  const existing = await db.select().from(payoutSettings).where(eq(payoutSettings.betType, betType));
  if (existing.length === 0) {
    await db.insert(payoutSettings).values({ betType, rate });
  } else {
    await db.update(payoutSettings).set({ rate, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(payoutSettings.betType, betType));
  }
}

export async function initializePayoutRates(): Promise<void> {
  try {
    // ★ FIX: Use correct bet type names from schema
    for (const bt of betTypes) {
      const rate = (defaultPayoutRates as Record<string, number>)[bt];
      if (rate === undefined) continue;

      const existing = await db
        .select()
        .from(payoutSettings)
        .where(eq(payoutSettings.betType, bt))
        .catch(() => []);

      if (existing.length === 0) {
        await db.insert(payoutSettings).values({ betType: bt, rate }).catch(() => {});
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
  const existing = await db.select().from(betTypeSettings).where(eq(betTypeSettings.betType, betType));
  if (existing.length === 0) {
    await db.insert(betTypeSettings).values({ betType, isEnabled: isEnabled ? 1 : 0 });
  } else {
    await db.update(betTypeSettings).set({ isEnabled: isEnabled ? 1 : 0, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(betTypeSettings.betType, betType));
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
        await db.insert(betTypeSettings).values({ betType, isEnabled: 1 }).catch(() => {});
      }
    }
  } catch (error) {
    console.error("Bet type settings initialization error:", error);
  }
}

/* =========================
   BET LIMITS ★ NEW
========================= */

export async function getBetLimits(): Promise<BetLimitWithLotteryTypes[]> {
  const limits = await db.select().from(betLimits).orderBy(desc(betLimits.createdAt));
  const result: BetLimitWithLotteryTypes[] = [];

  for (const limit of limits) {
    const types = await db
      .select()
      .from(betLimitLotteryTypes)
      .where(eq(betLimitLotteryTypes.betLimitId, limit.id));

    result.push({
      id: limit.id,
      number: limit.number,
      maxAmount: limit.maxAmount,
      isActive: limit.isActive,
      startDate: limit.startDate,
      endDate: limit.endDate,
      createdAt: limit.createdAt,
      lotteryTypes: types.map(t => t.lotteryType),
    });
  }

  return result;
}

export async function addBetLimit(data: {
  number: string;
  maxAmount: number;
  lotteryTypes: string[];
  startDate?: string | null;
  endDate?: string | null;
}) {
  const [inserted] = await db.insert(betLimits).values({
    number: data.number,
    maxAmount: data.maxAmount,
    isActive: 1,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
  }).returning();

  if (data.lotteryTypes.length > 0) {
    for (const lt of data.lotteryTypes) {
      await db.insert(betLimitLotteryTypes).values({
        betLimitId: inserted.id,
        lotteryType: lt,
      });
    }
  }

  return inserted;
}

export async function updateBetLimitStatus(id: number, isActive: number) {
  await db.update(betLimits).set({ isActive }).where(eq(betLimits.id, id));
}

export async function deleteBetLimit(id: number) {
  // Delete associated lottery types first
  await db.delete(betLimitLotteryTypes).where(eq(betLimitLotteryTypes.betLimitId, id));
  await db.delete(betLimits).where(eq(betLimits.id, id));
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
  getAllUsers,
  updateUserBlocked,

  // bets
  createBet,
  getUserBets,
  getAllBets,

  // transactions
  createTransaction,
  getUserTransactions,
  getAllTransactions,
  updateTransactionStatus,

  // blocked numbers
  isNumberBlocked,
  getBlockedNumbers,
  addBlockedNumber,
  updateBlockedNumber,
  removeBlockedNumber,

  // lottery results
  getLatestResults,
  getResultsByDate,
  getAllLotteryResults,
  createLotteryResult,
  getLotteryResultById,
  processLotteryResult,

  // winners
  getWinners,
  getProcessedDraws,

  // admin stats
  getAdminStats,

  // payout settings
  getPayoutSettings,
  updatePayoutRate,
  initializePayoutRates,

  // bet type settings
  getBetTypeSettings,
  updateBetTypeSetting,
  initializeBetTypeSettings,

  // bet limits
  getBetLimits,
  addBetLimit,
  updateBetLimitStatus,
  deleteBetLimit,
};
