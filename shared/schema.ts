import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* =========================
   CONSTANTS & TYPES
   ★ Only 6 lottery types
========================= */

export const lotteryTypes = [
  "THAI_GOV",
  "THAI_STOCK",
  "STOCK_NIKKEI",
  "STOCK_HSI",
  "STOCK_DOW",
  "MALAYSIA",
] as const;

export type LotteryType = (typeof lotteryTypes)[number];

export const lotteryTypeNames: Record<LotteryType, { th: string; en: string }> = {
  THAI_GOV: { th: "รัฐบาลไทย", en: "Thai Government" },
  THAI_STOCK: { th: "หุ้นไทย", en: "Thai Stock" },
  STOCK_NIKKEI: { th: "นิเคอิ", en: "Nikkei" },
  STOCK_HSI: { th: "ฮั่งเส็ง", en: "Hang Seng" },
  STOCK_DOW: { th: "ดาวโจนส์", en: "Dow Jones" },
  MALAYSIA: { th: "มาเลเซีย", en: "Malaysia" },
};

export const betTypes = [
  "TWO_TOP",
  "TWO_BOTTOM",
  "THREE_TOP",
  "THREE_TOD",
  "THREE_FRONT",
  "THREE_BACK",
  "FOUR_TOP",
  "FIVE_TOP",
  "RUN_TOP",
  "RUN_BOTTOM",
  "REVERSE",
] as const;

export type BetType = (typeof betTypes)[number];

export const betTypeNames: Record<BetType, { th: string; en: string }> = {
  TWO_TOP: { th: "2 ตัวบน", en: "2D Top" },
  TWO_BOTTOM: { th: "2 ตัวล่าง", en: "2D Bottom" },
  THREE_TOP: { th: "3 ตัวบน", en: "3D Top" },
  THREE_TOD: { th: "3 ตัวโต๊ด", en: "3D Tod" },
  THREE_FRONT: { th: "3 ตัวหน้า", en: "3D Front" },
  THREE_BACK: { th: "3 ตัวท้าย", en: "3D Back" },
  FOUR_TOP: { th: "4 ตัว", en: "4D" },
  FIVE_TOP: { th: "5 ตัว", en: "5D" },
  RUN_TOP: { th: "วิ่งบน", en: "Run Top" },
  RUN_BOTTOM: { th: "วิ่งล่าง", en: "Run Bottom" },
  REVERSE: { th: "กลับ", en: "Reverse" },
};

export const payoutRates: Record<BetType, number> = {
  TWO_TOP: 90,
  TWO_BOTTOM: 90,
  THREE_TOP: 900,
  THREE_TOD: 150,
  THREE_FRONT: 450,
  THREE_BACK: 450,
  FOUR_TOP: 3000,
  FIVE_TOP: 10000,
  RUN_TOP: 3,
  RUN_BOTTOM: 3,
  REVERSE: 50,
};

export const allowedBetTypes: Record<LotteryType, BetType[]> = {
  THAI_GOV: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD", "THREE_FRONT", "THREE_BACK", "RUN_TOP", "RUN_BOTTOM"],
  THAI_STOCK: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD"],
  STOCK_NIKKEI: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD"],
  STOCK_HSI: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD"],
  STOCK_DOW: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD"],
  MALAYSIA: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD", "FOUR_TOP"],
};

export const lotteryDrawTimes: Record<LotteryType, { th: string; en: string }> = {
  THAI_GOV: { th: "1 และ 16 ของทุกเดือน 15:00 น.", en: "1st & 16th monthly at 15:00" },
  THAI_STOCK: { th: "จันทร์-ศุกร์ 12:00/16:30 น.", en: "Mon-Fri 12:00/16:30" },
  STOCK_NIKKEI: { th: "จันทร์-ศุกร์ 14:30 น.", en: "Mon-Fri 14:30" },
  STOCK_HSI: { th: "จันทร์-ศุกร์ 16:00 น.", en: "Mon-Fri 16:00" },
  STOCK_DOW: { th: "จันทร์-ศุกร์ 04:00 น.", en: "Mon-Fri 04:00" },
  MALAYSIA: { th: "พ, ส, อา 19:00 น.", en: "Wed, Sat, Sun 19:00" },
};

/* =========================
   USERS
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

/* =========================
   BETS
========================= */

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

/* =========================
   BLOCKED NUMBERS
   ★ Added startDate / endDate
========================= */

export const blockedNumbers = sqliteTable("blocked_numbers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lotteryType: text("lottery_type").notNull(),
  number: text("number").notNull(),
  betType: text("bet_type"),
  isActive: integer("is_active").notNull().default(1),
  startDate: text("start_date"),
  endDate: text("end_date"),
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s','now'))`),
});

export type BlockedNumber = typeof blockedNumbers.$inferSelect;

/* =========================
   TRANSACTIONS
========================= */

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

export type Transaction = typeof transactions.$inferSelect;

/* =========================
   AFFILIATES
========================= */

export const affiliates = sqliteTable("affiliates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredId: integer("referred_id").notNull().references(() => users.id),
  totalBetAmount: real("total_bet_amount").notNull().default(0),
  totalDepositAmount: real("total_deposit_amount").notNull().default(0),
  commission: real("commission").notNull().default(0),
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s','now'))`),
});

/* =========================
   LOTTERY RESULTS
========================= */

export const lotteryResults = sqliteTable("lottery_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lotteryType: text("lottery_type").notNull(),
  drawDate: text("draw_date").notNull(),
  firstPrize: text("first_prize"),
  secondPrize: text("second_prize"),
  thirdPrize: text("third_prize"),
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

/* =========================
   PAYOUT SETTINGS
========================= */

export const payoutSettings = sqliteTable("payout_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  betType: text("bet_type").notNull().unique(),
  rate: real("rate").notNull(),
  updatedAt: integer("updated_at").notNull().default(sql`(strftime('%s','now'))`),
});

export type PayoutSetting = typeof payoutSettings.$inferSelect;

/* =========================
   BET TYPE SETTINGS
========================= */

export const betTypeSettings = sqliteTable("bet_type_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  betType: text("bet_type").notNull().unique(),
  isEnabled: integer("is_enabled").notNull().default(1),
  updatedAt: integer("updated_at").notNull().default(sql`(strftime('%s','now'))`),
});

/* =========================
   BET LIMITS ★ NEW
========================= */

export const betLimits = sqliteTable("bet_limits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: text("number").notNull(),
  maxAmount: real("max_amount").notNull(),
  isActive: integer("is_active").notNull().default(1),
  startDate: text("start_date"),
  endDate: text("end_date"),
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s','now'))`),
});

export const betLimitLotteryTypes = sqliteTable("bet_limit_lottery_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  betLimitId: integer("bet_limit_id").notNull().references(() => betLimits.id, { onDelete: "cascade" }),
  lotteryType: text("lottery_type").notNull(),
});

export type BetLimitWithLotteryTypes = {
  id: number;
  number: string;
  maxAmount: number;
  isActive: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: number;
  lotteryTypes: string[];
};

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

export const betLimitsRelations = relations(betLimits, ({ many }) => ({
  lotteryTypes: many(betLimitLotteryTypes),
}));

export const betLimitLotteryTypesRelations = relations(betLimitLotteryTypes, ({ one }) => ({
  betLimit: one(betLimits, { fields: [betLimitLotteryTypes.betLimitId], references: [betLimits.id] }),
}));

/* =========================
   ZOD SCHEMAS (FRONTEND)
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
