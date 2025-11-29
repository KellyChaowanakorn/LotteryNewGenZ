import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, User, BlockedNumber, LotteryType, BetType } from '@shared/schema';
import { payoutRates } from '@shared/schema';

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
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
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          items: [...state.items, { ...item, id }]
        }));
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.amount, 0);
      },
      getTotalPotentialWin: () => {
        return get().items.reduce((sum, item) => {
          const rate = payoutRates[item.betType];
          return sum + (item.amount * rate);
        }, 0);
      }
    }),
    {
      name: 'qnq-cart'
    }
  )
);

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false })
    }),
    {
      name: 'qnq-user'
    }
  )
);

interface AdminState {
  isAdminAuthenticated: boolean;
  setAdminAuthenticated: (value: boolean) => void;
}

export const useAdmin = create<AdminState>()(
  persist(
    (set) => ({
      isAdminAuthenticated: false,
      setAdminAuthenticated: (value) => set({ isAdminAuthenticated: value })
    }),
    {
      name: 'qnq-admin'
    }
  )
);

interface BlockedNumbersState {
  blockedNumbers: BlockedNumber[];
  setBlockedNumbers: (numbers: BlockedNumber[]) => void;
  isBlocked: (lotteryType: LotteryType, number: string, betType?: BetType) => boolean;
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
  }
}));
