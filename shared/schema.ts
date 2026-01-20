import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* =========================
   CONSTANTS & TYPES
========================= */

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
  "KENO",
] as const;

export type LotteryType = (typeof lotteryTypes)[number];

/* =========================
   LOTTERY TYPE NAMES (i18n SUPPORT)
========================= */

export const lotteryTypeNames: Record<LotteryType, { th: string; en: string }> = {
  THAI_GOV: { th: "รัฐบาลไทย", en: "Thai Government" },
  THAI_STOCK: { th: "หุ้นไทย", en: "Thai Stock" },
  STOCK_NIKKEI: { th: "Nikkei", en: "Nikkei" },
  STOCK_DOW: { th: "Dow Jones", en: "Dow Jones" },
  STOCK_FTSE: { th: "FTSE", en: "FTSE" },
  STOCK_DAX: { th: "DAX", en: "DAX" },
  LAO: { th: "ลาว", en: "Laos" },
  HANOI: { th: "ฮานอย", en: "Hanoi" },
  MALAYSIA: { th: "มาเลเซีย", en: "Malaysia" },
  SINGAPORE: { th: "สิงคโปร์", en: "Singapore" },
  KENO: { th: "คีโน", en: "Keno" },
};

export const betTypes = [
  "TWO_TOP",
  "TWO_BOTTOM",
  "THREE_TOP",
  "THREE_TOD",
  "FOUR_TOP",
  "FIVE_TOP",
  "RUN_TOP",
  "RUN_BOTTOM",
  "REVERSE",
  // Stock lottery specific types
  "THREE_STRAIGHT",  // 3 ตัวตรง (= 3 ตัวท้าย)
  "TWO_STRAIGHT",    // 2 ตัวตรง (= 2 ตัวท้าย)
  "THREE_REVERSE",   // 3 ตัวกลับ
  "TWO_REVERSE",     // 2 ตัวกลับ
] as const;

export type BetType = (typeof betTypes)[number];

/* =========================
   BET TYPE NAMES (i18n SUPPORT)
========================= */

export const betTypeNames: Record<BetType, { th: string; en: string }> = {
  TWO_TOP: { th: "2 ตัวบน", en: "2D Top" },
  TWO_BOTTOM: { th: "2 ตัวล่าง", en: "2D Bottom" },
  THREE_TOP: { th: "3 ตัวบน", en: "3D Top" },
  THREE_TOD: { th: "3 ตัวโต๊ด", en: "3D Tod" },
  FOUR_TOP: { th: "4 ตัว", en: "4D" },
  FIVE_TOP: { th: "5 ตัว", en: "5D" },
  RUN_TOP: { th: "วิ่งบน", en: "Run Top" },
  RUN_BOTTOM: { th: "วิ่งล่าง", en: "Run Bottom" },
  REVERSE: { th: "กลับ", en: "Reverse" },
  // Stock lottery specific
  THREE_STRAIGHT: { th: "3 ตัวตรง", en: "3D Straight" },
  TWO_STRAIGHT: { th: "2 ตัวตรง", en: "2D Straight" },
  THREE_REVERSE: { th: "3 ตัวกลับ", en: "3D Reverse" },
  TWO_REVERSE: { th: "2 ตัวกลับ", en: "2D Reverse" },
};

/* =========================
   PAYOUT RATES (FRONTEND SAFE)
========================= */

export const payoutRates: Record<BetType, number> = {
  TWO_TOP: 90,
  TWO_BOTTOM: 90,
  THREE_TOP: 900,
  THREE_TOD: 150,
  FOUR_TOP: 3000,
  FIVE_TOP: 10000,
  RUN_TOP: 3,
  RUN_BOTTOM: 3,
  REVERSE: 50,
  // Stock lottery specific - Admin can adjust these
  THREE_STRAIGHT: 900,
  TWO_STRAIGHT: 90,
  THREE_REVERSE: 450,
  TWO_REVERSE: 45,
};

/* =========================
   ALLOWED BET TYPES PER LOTTERY
========================= */

export const allowedBetTypes: Record<LotteryType, BetType[]> = {
  // หวยรัฐบาลไทย - ครบทุกประเภท
  THAI_GOV: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD", "FOUR_TOP", "FIVE_TOP", "RUN_TOP", "RUN_BOTTOM", "REVERSE"],
  
  // หุ้นไทย (SET) - เฉพาะ 5 ประเภท
  THAI_STOCK: ["THREE_STRAIGHT", "TWO_STRAIGHT", "THREE_TOD", "THREE_REVERSE", "TWO_REVERSE"],
  
  // หุ้นต่างประเทศ - เหมือนหุ้นไทย
  STOCK_NIKKEI: ["THREE_STRAIGHT", "TWO_STRAIGHT", "THREE_TOD", "THREE_REVERSE", "TWO_REVERSE"],
  STOCK_DOW: ["THREE_STRAIGHT", "TWO_STRAIGHT", "THREE_TOD", "THREE_REVERSE", "TWO_REVERSE"],
  STOCK_FTSE: ["THREE_STRAIGHT", "TWO_STRAIGHT", "THREE_TOD", "THREE_REVERSE", "TWO_REVERSE"],
  STOCK_DAX: ["THREE_STRAIGHT", "TWO_STRAIGHT", "THREE_TOD", "THREE_REVERSE", "TWO_REVERSE"],
  
  // หวยต่างประเทศ
  LAO: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD", "RUN_TOP", "RUN_BOTTOM", "REVERSE"],
  HANOI: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD", "RUN_TOP", "RUN_BOTTOM", "REVERSE"],
  MALAYSIA: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD", "FOUR_TOP", "REVERSE"],
  SINGAPORE: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD", "FOUR_TOP", "REVERSE"],
  
  // Keno
  KENO: ["TWO_TOP", "THREE_TOP", "FOUR_TOP", "FIVE_TOP"],
};

/* =========================
   WIN CONDITION RULES
   กฎการตรวจสอบการถูกรางวัล
========================= */

export interface WinCondition {
  description: { th: string; en: string };
  checkWin: (betNumber: string, resultNumber: string) => boolean;
  digitCount: number;
}

// Helper function: สลับเลขทุกตำแหน่ง (permutations)
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
  return [...new Set(result)];
}

export const winConditions: Record<BetType, WinCondition> = {
  // 2 ตัวบน - ตรงกับ 2 ตัวบน
  TWO_TOP: {
    description: { th: "2 ตัวบน ตรงกับผลรางวัล 2 ตัวบน", en: "Match top 2 digits" },
    checkWin: (bet, result) => bet === result.slice(0, 2),
    digitCount: 2,
  },
  
  // 2 ตัวล่าง - ตรงกับ 2 ตัวล่าง
  TWO_BOTTOM: {
    description: { th: "2 ตัวล่าง ตรงกับผลรางวัล 2 ตัวล่าง", en: "Match bottom 2 digits" },
    checkWin: (bet, result) => bet === result.slice(-2),
    digitCount: 2,
  },
  
  // 3 ตัวบน - ตรงกับ 3 ตัวบน
  THREE_TOP: {
    description: { th: "3 ตัวบน ตรงกับผลรางวัล 3 ตัวบน", en: "Match top 3 digits" },
    checkWin: (bet, result) => bet === result.slice(0, 3),
    digitCount: 3,
  },
  
  // 3 ตัวโต๊ด - สลับตำแหน่งได้
  THREE_TOD: {
    description: { th: "3 ตัวโต๊ด ตรงกับผลรางวัลโดยสลับตำแหน่งได้", en: "Match 3 digits in any order" },
    checkWin: (bet, result) => {
      const resultDigits = result.slice(-3);
      return getPermutations(bet).includes(resultDigits);
    },
    digitCount: 3,
  },
  
  // 4 ตัว
  FOUR_TOP: {
    description: { th: "4 ตัว ตรงกับผลรางวัล 4 ตัว", en: "Match 4 digits exactly" },
    checkWin: (bet, result) => bet === result.slice(-4),
    digitCount: 4,
  },
  
  // 5 ตัว
  FIVE_TOP: {
    description: { th: "5 ตัว ตรงกับผลรางวัล 5 ตัว", en: "Match 5 digits exactly" },
    checkWin: (bet, result) => bet === result.slice(-5),
    digitCount: 5,
  },
  
  // วิ่งบน - เลขเดียวอยู่ในผล 3 ตัวบน
  RUN_TOP: {
    description: { th: "วิ่งบน เลขอยู่ในผล 3 ตัวบน", en: "Single digit in top 3" },
    checkWin: (bet, result) => result.slice(0, 3).includes(bet),
    digitCount: 1,
  },
  
  // วิ่งล่าง - เลขเดียวอยู่ในผล 2 ตัวล่าง
  RUN_BOTTOM: {
    description: { th: "วิ่งล่าง เลขอยู่ในผล 2 ตัวล่าง", en: "Single digit in bottom 2" },
    checkWin: (bet, result) => result.slice(-2).includes(bet),
    digitCount: 1,
  },
  
  // กลับ (2 ตัว) - เลขกลับกัน
  REVERSE: {
    description: { th: "กลับ 2 ตัว", en: "Reverse 2 digits" },
    checkWin: (bet, result) => {
      const reversed = bet.split("").reverse().join("");
      return reversed === result.slice(-2);
    },
    digitCount: 2,
  },
  
  // === STOCK LOTTERY TYPES ===
  
  // 3 ตัวตรง (หุ้น) - ตรงกับ 3 ตัวท้ายของดัชนี
  THREE_STRAIGHT: {
    description: { th: "3 ตัวตรง ตรงกับ 3 ตัวท้ายของดัชนีหุ้น", en: "Match last 3 digits of stock index" },
    checkWin: (bet, result) => bet === result.slice(-3),
    digitCount: 3,
  },
  
  // 2 ตัวตรง (หุ้น) - ตรงกับ 2 ตัวท้ายของดัชนี
  TWO_STRAIGHT: {
    description: { th: "2 ตัวตรง ตรงกับ 2 ตัวท้ายของดัชนีหุ้น", en: "Match last 2 digits of stock index" },
    checkWin: (bet, result) => bet === result.slice(-2),
    digitCount: 2,
  },
  
  // 3 ตัวกลับ (หุ้น) - กลับเลข 3 ตัว
  THREE_REVERSE: {
    description: { th: "3 ตัวกลับ เลขกลับกัน 3 ตัว", en: "Reverse 3 digits" },
    checkWin: (bet, result) => {
      const reversed = bet.split("").reverse().join("");
      return reversed === result.slice(-3);
    },
    digitCount: 3,
  },
  
  // 2 ตัวกลับ (หุ้น) - กลับเลข 2 ตัว
  TWO_REVERSE: {
    description: { th: "2 ตัวกลับ เลขกลับกัน 2 ตัว", en: "Reverse 2 digits" },
    checkWin: (bet, result) => {
      const reversed = bet.split("").reverse().join("");
      return reversed === result.slice(-2);
    },
    digitCount: 2,
  },
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

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

export const insertBetSchema = createInsertSchema(bets).omit({
  id: true,
  createdAt: true,
});

export type Bet = typeof bets.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;

/* =========================
   BLOCKED NUMBERS
========================= */

export const blockedNumbers = sqliteTable("blocked_numbers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lotteryType: text("lottery_type").notNull(),
  number: text("number").notNull(),
  betType: text("bet_type"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: integer("created_at").notNull().default(sql`(strftime('%s','now'))`),
});

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
   RELATIONS
========================= */

export const usersRelations = relations(users, ({ many }) => ({
  bets: many(bets),
  transactions: many(transactions),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  user: one(users, {
    fields: [bets.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const affiliatesRelations = relations(affiliates, ({ one }) => ({
  referrer: one(users, {
    fields: [affiliates.referrerId],
    references: [users.id],
  }),
  referred: one(users, {
    fields: [affiliates.referredId],
    references: [users.id],
  }),
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

/* =========================
   INFERRED TYPES (FOR FRONTEND)
========================= */

export type Transaction = typeof transactions.$inferSelect;
export type BlockedNumber = typeof blockedNumbers.$inferSelect;
export type LotteryResult = typeof lotteryResults.$inferSelect;
export type PayoutSetting = typeof payoutSettings.$inferSelect;
export type BetTypeSetting = typeof betTypeSettings.$inferSelect;
export type Affiliate = typeof affiliates.$inferSelect;

// Custom type for bet limits with lottery types array
export type BetLimitWithLotteryTypes = {
  id: number;
  number: string;
  maxAmount: number;
  lotteryTypes: string[];
  isActive: boolean;
  createdAt: number;
};