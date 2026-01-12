import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CartItem,
  User,
  LotteryType,
  BetType,
} from '@shared/schema';

/* =========================
   CART
========================= */

/**
 * Frontend cart items include `potentialWin`,
 * even though backend CartItem type does not.
 * This is a TYPE EXTENSION ONLY — no behavior change.
 */
type CartItemWithWin = CartItem & {
  potentialWin: number;
};

interface CartState {
  items: CartItemWithWin[];
  addItem: (item: Omit<CartItemWithWin, 'id'>) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalPotentialWin: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const id = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        set((state) => ({
          items: [...state.items, { ...item, id }],
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.amount, 0);
      },

      getTotalPotentialWin: () => {
        return get().items.reduce(
          (sum, item) => sum + item.potentialWin,
          0
        );
      },
    }),
    {
      name: 'qnq-cart',
    }
  )
);

/* =========================
   USER
========================= */

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  updateBalance: (newBalance: number) => void;
  logout: () => void;
}

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      updateBalance: (newBalance) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, balance: newBalance }
            : null,
        })),

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'qnq-user',
    }
  )
);

/* =========================
   ADMIN
========================= */

interface AdminState {
  isAdminAuthenticated: boolean;
  setAdminAuthenticated: (value: boolean) => void;
  checkAdminStatus: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAdmin = create<AdminState>()(
  persist(
    (set) => ({
      isAdminAuthenticated: false,

      setAdminAuthenticated: (value) =>
        set({ isAdminAuthenticated: value }),

      checkAdminStatus: async () => {
        try {
          const res = await fetch('/api/admin/check', {
            credentials: 'include',
          });
          const data = await res.json();
          set({ isAdminAuthenticated: data.isAdmin === true });
          return data.isAdmin === true;
        } catch {
          set({ isAdminAuthenticated: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await fetch('/api/admin/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch {}
        set({ isAdminAuthenticated: false });
      },
    }),
    {
      name: 'qnq-admin',
    }
  )
);

/* =========================
   BLOCKED NUMBERS
========================= */

/**
 * DTO shape returned by API
 * (not a Drizzle table type)
 */
interface BlockedNumberDTO {
  lotteryType: LotteryType;
  number: string;
  betType: BetType | null;
  isActive: boolean;
}

interface BlockedNumbersState {
  blockedNumbers: BlockedNumberDTO[];
  setBlockedNumbers: (numbers: BlockedNumberDTO[]) => void;
  isBlocked: (
    lotteryType: LotteryType,
    number: string,
    betType?: BetType
  ) => boolean;
}

export const useBlockedNumbers = create<BlockedNumbersState>((set, get) => ({
  blockedNumbers: [],

  setBlockedNumbers: (numbers) => set({ blockedNumbers: numbers }),

  isBlocked: (lotteryType, number, betType) => {
    const { blockedNumbers } = get();
    return blockedNumbers.some(
      (bn) =>
        bn.isActive &&
        bn.lotteryType === lotteryType &&
        bn.number === number &&
        (bn.betType === null || bn.betType === betType)
    );
  },
}));
