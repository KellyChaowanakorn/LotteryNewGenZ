import { z } from "zod";

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
  "YEEKEE",
  "KENO"
] as const;

export type LotteryType = typeof lotteryTypes[number];

export const betTypes = [
  "THREE_TOP",
  "THREE_TOOD",
  "THREE_FRONT",
  "THREE_BOTTOM",
  "THREE_REVERSE",
  "TWO_TOP",
  "TWO_BOTTOM",
  "RUN_TOP",
  "RUN_BOTTOM"
] as const;

export type BetType = typeof betTypes[number];

export const payoutRates: Record<BetType, number> = {
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
  YEEKEE: { th: "หวยยี่กี", en: "Yeekee Lottery" },
  KENO: { th: "หวย Keno", en: "Keno Lottery" }
};

export const betTypeNames: Record<BetType, { th: string; en: string }> = {
  THREE_TOP: { th: "3 ตัวบน", en: "3 Digits Top" },
  THREE_TOOD: { th: "3 ตัวโต๊ด", en: "3 Digits Tood" },
  THREE_FRONT: { th: "3 ตัวหน้า", en: "3 Digits Front" },
  THREE_BOTTOM: { th: "3 ตัวล่าง", en: "3 Digits Bottom" },
  THREE_REVERSE: { th: "3 ตัวกลับ", en: "3 Digits Reverse" },
  TWO_TOP: { th: "2 ตัวบน", en: "2 Digits Top" },
  TWO_BOTTOM: { th: "2 ตัวล่าง", en: "2 Digits Bottom" },
  RUN_TOP: { th: "วิ่งบน", en: "Run Top" },
  RUN_BOTTOM: { th: "วิ่งล่าง", en: "Run Bottom" }
};

export const userSchema = z.object({
  id: z.string(),
  username: z.string().min(3),
  password: z.string().min(6),
  balance: z.number().default(0),
  referralCode: z.string(),
  referredBy: z.string().nullable(),
  affiliateEarnings: z.number().default(0),
  createdAt: z.string()
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = Omit<User, "id" | "createdAt">;

export const betSchema = z.object({
  id: z.string(),
  userId: z.string(),
  lotteryType: z.enum(lotteryTypes),
  betType: z.enum(betTypes),
  numbers: z.string(),
  amount: z.number().min(1),
  potentialWin: z.number(),
  status: z.enum(["pending", "confirmed", "won", "lost"]),
  drawDate: z.string(),
  createdAt: z.string()
});

export type Bet = z.infer<typeof betSchema>;
export type InsertBet = Omit<Bet, "id" | "createdAt">;

export const blockedNumberSchema = z.object({
  id: z.string(),
  lotteryType: z.enum(lotteryTypes),
  number: z.string(),
  betType: z.enum(betTypes).nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.string()
});

export type BlockedNumber = z.infer<typeof blockedNumberSchema>;
export type InsertBlockedNumber = Omit<BlockedNumber, "id" | "createdAt">;

export const transactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["deposit", "withdraw", "bet", "win", "affiliate"]),
  amount: z.number(),
  status: z.enum(["pending", "approved", "rejected"]),
  slipUrl: z.string().nullable(),
  reference: z.string(),
  createdAt: z.string()
});

export type Transaction = z.infer<typeof transactionSchema>;
export type InsertTransaction = Omit<Transaction, "id" | "createdAt">;

export const affiliateSchema = z.object({
  id: z.string(),
  referrerId: z.string(),
  referredId: z.string(),
  totalBetAmount: z.number().default(0),
  commission: z.number().default(0),
  createdAt: z.string()
});

export type Affiliate = z.infer<typeof affiliateSchema>;

export const cartItemSchema = z.object({
  id: z.string(),
  lotteryType: z.enum(lotteryTypes),
  betType: z.enum(betTypes),
  numbers: z.string(),
  amount: z.number()
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
