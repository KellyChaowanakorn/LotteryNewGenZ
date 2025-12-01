import { pgTable, text, integer, boolean, timestamp, real, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const lotteryTypes = [
  "THAI_GOV",
  "THAI_STOCK",
  "STOCK_NIKKEI",
  "STOCK_DOW",
  "STOCK_FTSE",
  "STOCK_DAX",
  "LAO",
  "HANOI",
  "MALAYSIA",
  "SINGAPORE",
  "KENO"
] as const;

export type LotteryType = typeof lotteryTypes[number];

// 9 ประเภทสำหรับหวยไทย
export const betTypes = [
  "TWO_TOP",       // 2 ตัวบน
  "TWO_BOTTOM",    // 2 ตัวล่าง
  "THREE_TOP",     // 3 ตัวตรง (3 ตัวบน)
  "THREE_TOD",     // 3 ตัวโต๊ด
  "FOUR_TOP",      // 4 ตัวบน
  "FIVE_TOP",      // 5 ตัวบน
  "RUN_TOP",       // วิ่งบน (เลขลอยบน)
  "RUN_BOTTOM",    // วิ่งล่าง (เลขลอยล่าง)
  "REVERSE"        // เลขกลับ 2 ตัวบน
] as const;

export type BetType = typeof betTypes[number];

// อัตราจ่ายเริ่มต้น (Admin สามารถเปลี่ยนได้ในหน้า Admin)
export const payoutRates: Record<BetType, number> = {
  TWO_TOP: 60,      // 2 ตัวบน x60
  TWO_BOTTOM: 60,   // 2 ตัวล่าง x60
  THREE_TOP: 500,   // 3 ตัวตรง x500
  THREE_TOD: 90,    // 3 ตัวโต๊ด x90
  FOUR_TOP: 900,    // 4 ตัวบน x900
  FIVE_TOP: 2000,   // 5 ตัวบน x2000
  RUN_TOP: 3,       // วิ่งบน x3 (100 บาท ได้ 300)
  RUN_BOTTOM: 4,    // วิ่งล่าง x4 (100 บาท ได้ 400)
  REVERSE: 94       // เลขกลับ x94
};

export const lotteryTypeNames: Record<LotteryType, { th: string; en: string }> = {
  THAI_GOV: { th: "หวยรัฐบาลไทย", en: "Thai Government" },
  THAI_STOCK: { th: "หวยหุ้นไทย", en: "Thai Stock" },
  STOCK_NIKKEI: { th: "หวยหุ้นนิเคอิ", en: "Nikkei Stock" },
  STOCK_DOW: { th: "หวยหุ้นดาวโจนส์", en: "Dow Jones Stock" },
  STOCK_FTSE: { th: "หวยหุ้นอังกฤษ", en: "FTSE Stock" },
  STOCK_DAX: { th: "หวยหุ้นเยอรมัน", en: "DAX Stock" },
  LAO: { th: "หวยลาว", en: "Lao Lottery" },
  HANOI: { th: "หวยฮานอย", en: "Hanoi Lottery" },
  MALAYSIA: { th: "หวยมาเลย์", en: "Malaysia Lottery" },
  SINGAPORE: { th: "หวยสิงคโปร์", en: "Singapore Lottery" },
  KENO: { th: "หวย Keno", en: "Keno Lottery" }
};

export const betTypeNames: Record<BetType, { th: string; en: string }> = {
  TWO_TOP: { th: "2 ตัวบน", en: "2 Digits Top" },
  TWO_BOTTOM: { th: "2 ตัวล่าง", en: "2 Digits Bottom" },
  THREE_TOP: { th: "3 ตัวตรง", en: "3 Digits Straight" },
  THREE_TOD: { th: "3 ตัวโต๊ด", en: "3 Digits Tod" },
  FOUR_TOP: { th: "4 ตัวบน", en: "4 Digits Top" },
  FIVE_TOP: { th: "5 ตัวบน", en: "5 Digits Top" },
  RUN_TOP: { th: "วิ่งบน", en: "Run Top" },
  RUN_BOTTOM: { th: "วิ่งล่าง", en: "Run Bottom" },
  REVERSE: { th: "เลขกลับ", en: "Reverse" }
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: real("balance").notNull().default(0),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  affiliateEarnings: real("affiliate_earnings").notNull().default(0),
  isBlocked: boolean("is_blocked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  lotteryType: text("lottery_type").notNull(),
  betType: text("bet_type").notNull(),
  numbers: text("numbers").notNull(),
  amount: real("amount").notNull(),
  potentialWin: real("potential_win").notNull(),
  status: text("status").notNull().default("pending"),
  drawDate: text("draw_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertBetSchema = createInsertSchema(bets).omit({
  id: true,
  createdAt: true
});

export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof bets.$inferSelect;

export const blockedNumbers = pgTable("blocked_numbers", {
  id: serial("id").primaryKey(),
  lotteryType: text("lottery_type").notNull(),
  number: text("number").notNull(),
  betType: text("bet_type"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertBlockedNumberSchema = createInsertSchema(blockedNumbers).omit({
  id: true,
  createdAt: true
});

export type InsertBlockedNumber = z.infer<typeof insertBlockedNumberSchema>;
export type BlockedNumber = typeof blockedNumbers.$inferSelect;

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"),
  slipUrl: text("slip_url"),
  reference: text("reference").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export const affiliates = pgTable("affiliates", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredId: integer("referred_id").notNull().references(() => users.id),
  totalBetAmount: real("total_bet_amount").notNull().default(0),
  totalDepositAmount: real("total_deposit_amount").notNull().default(0),
  commission: real("commission").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export type Affiliate = typeof affiliates.$inferSelect;

export const lotteryResults = pgTable("lottery_results", {
  id: serial("id").primaryKey(),
  lotteryType: text("lottery_type").notNull(),
  drawDate: text("draw_date").notNull(),
  firstPrize: text("first_prize"),
  threeDigitTop: text("three_digit_top"),
  threeDigitBottom: text("three_digit_bottom"),
  twoDigitTop: text("two_digit_top"),
  twoDigitBottom: text("two_digit_bottom"),
  runTop: text("run_top"),
  runBottom: text("run_bottom"),
  isProcessed: boolean("is_processed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertLotteryResultSchema = createInsertSchema(lotteryResults).omit({
  id: true,
  createdAt: true
});

export type InsertLotteryResult = z.infer<typeof insertLotteryResultSchema>;
export type StoredLotteryResult = typeof lotteryResults.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  bets: many(bets),
  transactions: many(transactions)
}));

export const betsRelations = relations(bets, ({ one }) => ({
  user: one(users, {
    fields: [bets.userId],
    references: [users.id]
  })
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id]
  })
}));

export const affiliatesRelations = relations(affiliates, ({ one }) => ({
  referrer: one(users, {
    fields: [affiliates.referrerId],
    references: [users.id]
  }),
  referred: one(users, {
    fields: [affiliates.referredId],
    references: [users.id]
  })
}));

export const cartItemSchema = z.object({
  id: z.string(),
  lotteryType: z.enum(lotteryTypes),
  betType: z.enum(betTypes),
  numbers: z.string(),
  amount: z.number(),
  isSet: z.boolean().optional(),
  setIndex: z.number().optional()
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const lotteryResultSchema = z.object({
  lotteryType: z.enum(lotteryTypes),
  date: z.string(),
  results: z.object({
    firstPrize: z.string().optional(),
    threeDigitTop: z.array(z.string()).optional(),
    threeDigitBottom: z.array(z.string()).optional(),
    twoDigit: z.string().optional(),
    runTop: z.string().optional(),
    runBottom: z.string().optional()
  }),
  isExternal: z.boolean().default(false),
  externalUrl: z.string().optional()
});

export type LotteryResult = z.infer<typeof lotteryResultSchema>;

export const adminSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type Admin = z.infer<typeof adminSchema>;

export const bankAccountSchema = z.object({
  bankName: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
  promptPayId: z.string()
});

export type BankAccount = z.infer<typeof bankAccountSchema>;

export const payoutSettings = pgTable("payout_settings", {
  id: serial("id").primaryKey(),
  betType: text("bet_type").notNull().unique(),
  rate: real("rate").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertPayoutSettingSchema = createInsertSchema(payoutSettings).omit({
  id: true,
  updatedAt: true
});

export type InsertPayoutSetting = z.infer<typeof insertPayoutSettingSchema>;
export type PayoutSetting = typeof payoutSettings.$inferSelect;

export const betLimits = pgTable("bet_limits", {
  id: serial("id").primaryKey(),
  number: text("number").notNull(),
  maxAmount: real("max_amount").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const betLimitLotteryTypes = pgTable("bet_limit_lottery_types", {
  id: serial("id").primaryKey(),
  betLimitId: integer("bet_limit_id").notNull().references(() => betLimits.id, { onDelete: "cascade" }),
  lotteryType: text("lottery_type").notNull()
});

export const betLimitsRelations = relations(betLimits, ({ many }) => ({
  lotteryTypes: many(betLimitLotteryTypes)
}));

export const betLimitLotteryTypesRelations = relations(betLimitLotteryTypes, ({ one }) => ({
  betLimit: one(betLimits, {
    fields: [betLimitLotteryTypes.betLimitId],
    references: [betLimits.id]
  })
}));

export const insertBetLimitSchema = createInsertSchema(betLimits).omit({
  id: true,
  createdAt: true
});

export type InsertBetLimit = z.infer<typeof insertBetLimitSchema>;
export type BetLimit = typeof betLimits.$inferSelect;
export type BetLimitLotteryType = typeof betLimitLotteryTypes.$inferSelect;

export type BetLimitWithLotteryTypes = BetLimit & {
  lotteryTypes: string[];
};

export const betTypeSettings = pgTable("bet_type_settings", {
  id: serial("id").primaryKey(),
  betType: text("bet_type").notNull().unique(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertBetTypeSettingSchema = createInsertSchema(betTypeSettings).omit({
  id: true,
  updatedAt: true
});

export type InsertBetTypeSetting = z.infer<typeof insertBetTypeSettingSchema>;
export type BetTypeSetting = typeof betTypeSettings.$inferSelect;
