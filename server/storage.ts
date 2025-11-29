import { randomUUID } from "crypto";

export interface User {
  id: string;
  username: string;
  password: string;
  balance: number;
  referralCode: string;
  referredBy: string | null;
  affiliateEarnings: number;
  createdAt: string;
}

export interface Bet {
  id: string;
  userId: string;
  lotteryType: string;
  betType: string;
  numbers: string;
  amount: number;
  potentialWin: number;
  status: "pending" | "confirmed" | "won" | "lost";
  drawDate: string;
  createdAt: string;
}

export interface BlockedNumber {
  id: string;
  lotteryType: string;
  number: string;
  betType: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "deposit" | "withdraw" | "bet" | "win" | "affiliate";
  amount: number;
  status: "pending" | "approved" | "rejected";
  slipUrl: string | null;
  reference: string;
  createdAt: string;
}

export interface Affiliate {
  id: string;
  referrerId: string;
  referredId: string;
  totalBetAmount: number;
  commission: number;
  createdAt: string;
}

export type InsertUser = Omit<User, "id" | "createdAt">;
export type InsertBet = Omit<Bet, "id" | "createdAt">;
export type InsertBlockedNumber = Omit<BlockedNumber, "id" | "createdAt">;
export type InsertTransaction = Omit<Transaction, "id" | "createdAt">;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, amount: number): Promise<User | undefined>;

  getBets(userId?: string): Promise<Bet[]>;
  getBet(id: string): Promise<Bet | undefined>;
  createBet(bet: InsertBet): Promise<Bet>;
  updateBetStatus(id: string, status: Bet["status"]): Promise<Bet | undefined>;

  getBlockedNumbers(lotteryType?: string): Promise<BlockedNumber[]>;
  createBlockedNumber(blocked: InsertBlockedNumber): Promise<BlockedNumber>;
  updateBlockedNumber(id: string, isActive: boolean): Promise<BlockedNumber | undefined>;
  deleteBlockedNumber(id: string): Promise<boolean>;

  getTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: Transaction["status"]): Promise<Transaction | undefined>;

  getAffiliates(referrerId: string): Promise<Affiliate[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private bets: Map<string, Bet>;
  private blockedNumbers: Map<string, BlockedNumber>;
  private transactions: Map<string, Transaction>;
  private affiliates: Map<string, Affiliate>;

  constructor() {
    this.users = new Map();
    this.bets = new Map();
    this.blockedNumbers = new Map();
    this.transactions = new Map();
    this.affiliates = new Map();

    this.seedBlockedNumbers();
  }

  private seedBlockedNumbers() {
    const seedData: InsertBlockedNumber[] = [
      { lotteryType: "THAI_GOV", number: "123", betType: null, isActive: true },
      { lotteryType: "THAI_GOV", number: "456", betType: "THREE_TOP", isActive: true },
      { lotteryType: "THAI_STOCK", number: "78", betType: "TWO_TOP", isActive: true },
      { lotteryType: "HANOI", number: "999", betType: null, isActive: true },
    ];

    seedData.forEach((data) => {
      const id = randomUUID();
      this.blockedNumbers.set(id, {
        ...data,
        id,
        createdAt: new Date().toISOString(),
      });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: string, amount: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    user.balance += amount;
    this.users.set(userId, user);
    return user;
  }

  async getBets(userId?: string): Promise<Bet[]> {
    const allBets = Array.from(this.bets.values());
    if (userId) {
      return allBets.filter((bet) => bet.userId === userId);
    }
    return allBets;
  }

  async getBet(id: string): Promise<Bet | undefined> {
    return this.bets.get(id);
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const id = randomUUID();
    const bet: Bet = {
      ...insertBet,
      id,
      createdAt: new Date().toISOString(),
    };
    this.bets.set(id, bet);
    return bet;
  }

  async updateBetStatus(id: string, status: Bet["status"]): Promise<Bet | undefined> {
    const bet = this.bets.get(id);
    if (!bet) return undefined;
    bet.status = status;
    this.bets.set(id, bet);
    return bet;
  }

  async getBlockedNumbers(lotteryType?: string): Promise<BlockedNumber[]> {
    const allBlocked = Array.from(this.blockedNumbers.values());
    if (lotteryType) {
      return allBlocked.filter((bn) => bn.lotteryType === lotteryType);
    }
    return allBlocked;
  }

  async createBlockedNumber(insertBlocked: InsertBlockedNumber): Promise<BlockedNumber> {
    const id = randomUUID();
    const blocked: BlockedNumber = {
      ...insertBlocked,
      id,
      createdAt: new Date().toISOString(),
    };
    this.blockedNumbers.set(id, blocked);
    return blocked;
  }

  async updateBlockedNumber(id: string, isActive: boolean): Promise<BlockedNumber | undefined> {
    const blocked = this.blockedNumbers.get(id);
    if (!blocked) return undefined;
    blocked.isActive = isActive;
    this.blockedNumbers.set(id, blocked);
    return blocked;
  }

  async deleteBlockedNumber(id: string): Promise<boolean> {
    return this.blockedNumbers.delete(id);
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (tx) => tx.userId === userId
    );
  }

  async createTransaction(insertTx: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const tx: Transaction = {
      ...insertTx,
      id,
      createdAt: new Date().toISOString(),
    };
    this.transactions.set(id, tx);
    return tx;
  }

  async updateTransactionStatus(
    id: string,
    status: Transaction["status"]
  ): Promise<Transaction | undefined> {
    const tx = this.transactions.get(id);
    if (!tx) return undefined;
    tx.status = status;
    this.transactions.set(id, tx);
    return tx;
  }

  async getAffiliates(referrerId: string): Promise<Affiliate[]> {
    return Array.from(this.affiliates.values()).filter(
      (aff) => aff.referrerId === referrerId
    );
  }
}

export const storage = new MemStorage();
