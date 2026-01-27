import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* =========================
   CONSTANTS & TYPES
   หวย 6 ประเภทเท่านั้น
========================= */

export const lotteryTypes = [
  "THAI_GOV",      // หวยรัฐบาลไทย
  "THAI_STOCK",    // หุ้นไทย (SET)
  "STOCK_NIKKEI",  // หุ้นนิเคอิ
  "STOCK_HSI",     // หุ้นฮั่งเส็ง
  "STOCK_DOW",     // หุ้นดาวโจนส์
  "MALAYSIA",      // หวยมาเลย์
] as const;

export type LotteryType = (typeof lotteryTypes)[number];

/* =========================
   LOTTERY TYPE NAMES
========================= */

export const lotteryTypeNames: Record<LotteryType, { th: string; en: string }> = {
  THAI_GOV: { th: "หวยรัฐบาลไทย", en: "Thai Government" },
  THAI_STOCK: { th: "หุ้นไทย (SET)", en: "Thai Stock (SET)" },
  STOCK_NIKKEI: { th: "หุ้นนิเคอิ", en: "Nikkei 225" },
  STOCK_HSI: { th: "หุ้นฮั่งเส็ง", en: "Hang Seng" },
  STOCK_DOW: { th: "หุ้นดาวโจนส์", en: "Dow Jones" },
  MALAYSIA: { th: "หวยมาเลย์", en: "Malaysia 4D" },
};

/* =========================
   LOTTERY DRAW TIMES
========================= */

export const lotteryDrawTimes: Record<LotteryType, { th: string; en: string }> = {
  THAI_GOV: { th: "1, 16 ทุกเดือน 15:00", en: "1st, 16th monthly 15:00" },
  THAI_STOCK: { th: "จ-ศ 12:00, 16:30", en: "Mon-Fri 12:00, 16:30" },
  STOCK_NIKKEI: { th: "จ-ศ 09:30, 13:20", en: "Mon-Fri 09:30, 13:20" },
  STOCK_HSI: { th: "จ-ศ 11:00, 15:30", en: "Mon-Fri 11:00, 15:30" },
  STOCK_DOW: { th: "จ-ศ 04:00", en: "Mon-Fri 04:00" },
  MALAYSIA: { th: "พ, ส, อา 19:00", en: "Wed, Sat, Sun 19:00" },
};

/* =========================
   BET TYPES (รวม PermutationCalculator)
========================= */

export const betTypes = [
  // หวยรัฐบาลไทย
  "TWO_TOP",
  "TWO_BOTTOM",
  "THREE_TOP",
  "THREE_TOD",
  "RUN_TOP",
  "RUN_BOTTOM",
  // หุ้น
  "THREE_STRAIGHT",
  "TWO_STRAIGHT",
  "THREE_REVERSE",
  "TWO_REVERSE",
  // มาเลย์
  "FOUR_STRAIGHT",
  "FOUR_TOD",
  // Permutation Calculator (เพิ่มเติม)
  "FOUR_TOP",
  "FIVE_TOP",
  "REVERSE",
] as const;

export type BetType = (typeof betTypes)[number];

/* =========================
   BET TYPE NAMES
========================= */

export const betTypeNames: Record<BetType, { th: string; en: string }> = {
  TWO_TOP: { th: "2 ตัวบน", en: "2D Top" },
  TWO_BOTTOM: { th: "2 ตัวล่าง", en: "2D Bottom" },
  THREE_TOP: { th: "3 ตัวบน", en: "3D Top" },
  THREE_TOD: { th: "3 ตัวโต๊ด", en: "3D Tod" },
  RUN_TOP: { th: "วิ่งบน", en: "Run Top" },
  RUN_BOTTOM: { th: "วิ่งล่าง", en: "Run Bottom" },
  THREE_STRAIGHT: { th: "3 ตัวตรง", en: "3D Straight" },
  TWO_STRAIGHT: { th: "2 ตัวตรง", en: "2D Straight" },
  THREE_REVERSE: { th: "3 ตัวกลับ", en: "3D Reverse" },
  TWO_REVERSE: { th: "2 ตัวกลับ", en: "2D Reverse" },
  FOUR_STRAIGHT: { th: "4 ตัวตรง", en: "4D Straight" },
  FOUR_TOD: { th: "4 ตัวโต๊ด", en: "4D Tod" },
  // Permutation Calculator
  FOUR_TOP: { th: "4 ตัวบน", en: "4D Top" },
  FIVE_TOP: { th: "5 ตัวบน", en: "5D Top" },
  REVERSE: { th: "กลับ", en: "Reverse" },
};

/* =========================
   PAYOUT RATES
========================= */

export const payoutRates: Record<BetType, number> = {
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
  // Permutation Calculator
  FOUR_TOP: 6000,
  FIVE_TOP: 60000,
  REVERSE: 90,
};

/* =========================
   ALLOWED BET TYPES PER LOTTERY
========================= */

export const allowedBetTypes: Record<LotteryType, BetType[]> = {
  THAI_GOV: ["THREE_TOP", "THREE_TOD", "TWO_TOP", "TWO_BOTTOM", "RUN_TOP", "RUN_BOTTOM", "FOUR_TOP", "FIVE_TOP", "REVERSE"],
  THAI_STOCK: ["THREE_STRAIGHT", "TWO_STRAIGHT", "THREE_TOD", "THREE_REVERSE", "TWO_REVERSE"],
  STOCK_NIKKEI: ["THREE_STRAIGHT", "TWO_STRAIGHT", "THREE_TOD"],
  STOCK_HSI: ["THREE_STRAIGHT", "TWO_STRAIGHT", "THREE_TOD"],
  STOCK_DOW: ["THREE_STRAIGHT", "TWO_STRAIGHT", "THREE_TOD"],
  MALAYSIA: ["FOUR_STRAIGHT", "FOUR_TOD", "THREE_STRAIGHT", "THREE_TOD"],
};

/* =========================
   WIN CONDITIONS
========================= */

export interface WinCondition {
  description: { th: string; en: string };
  checkWin: (betNumber: string, resultNumber: string) => boolean;
  digitCount: number;
}

// FIX: Use Array.from() instead of spread operator for Set iteration
function getPermutations(str: string): string[] {
  if (str.length <= 1) return [str];
  const result: string[] = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const remaining = str.slice(0, i) + str.slice(i + 1);
    for (const perm of getPermutations(remaining)) {
      result.push(char + perm);
    }
  }
  return Array.from(new Set(result));
}

export const winConditions: Record<BetType, WinCondition> = {
  TWO_TOP: {
    description: { th: "2 ตัวบน ตรงกับ 2 ตัวบน", en: "Match top 2 digits" },
    checkWin: (bet, result) => bet === result.slice(0, 2),
    digitCount: 2,
  },
  TWO_BOTTOM: {
    description: { th: "2 ตัวล่าง ตรงกับ 2 ตัวล่าง", en: "Match bottom 2 digits" },
    checkWin: (bet, result) => bet === result.slice(-2),
    digitCount: 2,
  },
  THREE_TOP: {
    description: { th: "3 ตัวบน ตรงกับ 3 ตัวบน", en: "Match top 3 digits" },
    checkWin: (bet, result) => bet === result.slice(0, 3),
    digitCount: 3,
  },
  THREE_TOD: {
    description: { th: "3 ตัวโต๊ด สลับตำแหน่งได้", en: "Match 3 digits any order" },
    checkWin: (bet, result) => getPermutations(bet).includes(result.slice(-3)),
    digitCount: 3,
  },
  RUN_TOP: {
    description: { th: "วิ่งบน เลขอยู่ใน 3 ตัวบน", en: "Single digit in top 3" },
    checkWin: (bet, result) => result.slice(0, 3).includes(bet),
    digitCount: 1,
  },
  RUN_BOTTOM: {
    description: { th: "วิ่งล่าง เลขอยู่ใน 2 ตัวล่าง", en: "Single digit in bottom 2" },
    checkWin: (bet, result) => result.slice(-2).includes(bet),
    digitCount: 1,
  },
  THREE_STRAIGHT: {
    description: { th: "3 ตัวตรง ตรงกับ 3 ตัวท้าย", en: "Match last 3 digits" },
    checkWin: (bet, result) => bet === result.slice(-3),
    digitCount: 3,
  },
  TWO_STRAIGHT: {
    description: { th: "2 ตัวตรง ตรงกับ 2 ตัวท้าย", en: "Match last 2 digits" },
    checkWin: (bet, result) => bet === result.slice(-2),
    digitCount: 2,
  },
  THREE_REVERSE: {
    description: { th: "3 ตัวกลับ เลขกลับ 3 ตัว", en: "Reverse 3 digits" },
    checkWin: (bet, result) => bet.split("").reverse().join("") === result.slice(-3),
    digitCount: 3,
  },
  TWO_REVERSE: {
    description: { th: "2 ตัวกลับ เลขกลับ 2 ตัว", en: "Reverse 2 digits" },
    checkWin: (bet, result) => bet.split("").reverse().join("") === result.slice(-2),
    digitCount: 2,
  },
  FOUR_STRAIGHT: {
    description: { th: "4 ตัวตรง ตรงทั้ง 4 ตัว", en: "Match all 4 digits" },
    checkWin: (bet, result) => bet === result.slice(-4),
    digitCount: 4,
  },
  FOUR_TOD: {
    description: { th: "4 ตัวโต๊ด สลับตำแหน่งได้", en: "Match 4 digits any order" },
    checkWin: (bet, result) => getPermutations(bet).includes(result.slice(-4)),
    digitCount: 4,
  },
  // Permutation Calculator
  FOUR_TOP: {
    description: { th: "4 ตัวบน ตรงกับ 4 ตัวบน", en: "Match top 4 digits" },
    checkWin: (bet, result) => bet === result.slice(0, 4),
    digitCount: 4,
  },
  FIVE_TOP: {
    description: { th: "5 ตัวบน ตรงกับ 5 ตัวบน", en: "Match top 5 digits" },
    checkWin: (bet, result) => bet === result.slice(0, 5),
    digitCount: 5,
  },
  REVERSE: {
    description: { th: "กลับ 2 ตัว", en: "Reverse 2 digits" },
    checkWin: (bet, result) => bet.split("").reverse().join("") === result.slice(-2),
    digitCount: 2,
  },
};

/* =========================
   DATABASE TABLES
========================= */

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: real("balance").notNull().default(0),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  affiliateEarnings: real("affiliate_earnings").notNull().default(0),
  isBlocked: integer("is_blocked").notNull().default(0),
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s','now'))`),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const bets = sqliteTable("bets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  lotteryType: text("lottery_type").notNull(),
  betType: text("bet_type").notNull(),
  numbers: text("numbers").notNull(),
  amount: real("amount").notNull(),
  potentialWin: real("potential_win").notNull(),
  status: text("status").notNull().default("pending"),
  drawDate: text("draw_date").notNull(),
  winAmount: real("win_amount"),
  matchedNumber: text("matched_number"),
  processedAt: integer("processed_at"),
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s','now'))`),
});

export const insertBetSchema = createInsertSchema(bets).omit({ id: true, createdAt: true });
export type Bet = typeof bets.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;

export const blockedNumbers = sqliteTable("blocked_numbers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lotteryType: text("lottery_type").notNull(),
  number: text("number").notNull(),
  betType: text("bet_type"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s','now'))`),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"),
  slipUrl: text("slip_url"),
  reference: text("reference").notNull(),
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s','now'))`),
});

export const affiliates = sqliteTable("affiliates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredId: integer("referred_id").notNull().references(() => users.id),
  totalBetAmount: real("total_bet_amount").notNull().default(0),
  totalDepositAmount: real("total_deposit_amount").notNull().default(0),
  commission: real("commission").notNull().default(0),
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s','now'))`),
});

export const lotteryResults = sqliteTable("lottery_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lotteryType: text("lottery_type").notNull(),
  drawDate: text("draw_date").notNull(),
  firstPrize: text("first_prize"),
  secondPrize: text("second_prize"),
  thirdPrize: text("third_prize"),
  specialPrizes: text("special_prizes"),
  consolationPrizes: text("consolation_prizes"),
  threeDigitTop: text("three_digit_top"),
  threeDigitBottom: text("three_digit_bottom"),
  twoDigitTop: text("two_digit_top"),
  twoDigitBottom: text("two_digit_bottom"),
  runTop: text("run_top"),
  runBottom: text("run_bottom"),
  isProcessed: integer("is_processed").notNull().default(0),
  processedAt: integer("processed_at"),
  totalWinners: integer("total_winners"),
  totalPayout: real("total_payout"),
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s','now'))`),
});

export const payoutSettings = sqliteTable("payout_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  betType: text("bet_type").notNull().unique(),
  rate: real("rate").notNull(),
  updatedAt: integer("updated_at").notNull().default(sql`(strftime('%s','now'))`),
});

export const betTypeSettings = sqliteTable("bet_type_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  betType: text("bet_type").notNull().unique(),
  isEnabled: integer("is_enabled").notNull().default(1),
  updatedAt: integer("updated_at").notNull().default(sql`(strftime('%s','now'))`),
});

/* =========================
   RELATIONS
========================= */

export const usersRelations = relations(users, ({ many }) => ({
  bets: many(bets),
  transactions: many(transactions),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  user: one(users, { fields: [bets.userId], references: [users.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
}));

export const affiliatesRelations = relations(affiliates, ({ one }) => ({
  referrer: one(users, { fields: [affiliates.referrerId], references: [users.id] }),
  referred: one(users, { fields: [affiliates.referredId], references: [users.id] }),
}));

/* =========================
   ZOD SCHEMAS
========================= */

export const cartItemSchema = z.object({
  id: z.string(),
  lotteryType: z.enum(lotteryTypes),
  betType: z.enum(betTypes),
  numbers: z.string(),
  amount: z.number(),
  potentialWin: z.number(),
  isSet: z.boolean().optional(),
  setIndex: z.number().optional(),
});

export type CartItem = z.infer<typeof cartItemSchema>;

/* =========================
   INFERRED TYPES
========================= */

export type Transaction = typeof transactions.$inferSelect;
export type BlockedNumber = typeof blockedNumbers.$inferSelect;
export type LotteryResult = typeof lotteryResults.$inferSelect;
export type PayoutSetting = typeof payoutSettings.$inferSelect;
export type BetTypeSetting = typeof betTypeSettings.$inferSelect;
export type Affiliate = typeof affiliates.$inferSelect;

export type BetLimitWithLotteryTypes = {
  id: number;
  number: string;
  maxAmount: number;
  lotteryTypes: string[];
  isActive: boolean;
  createdAt: number;
};
