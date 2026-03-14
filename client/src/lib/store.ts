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
   ADMIN (Token-based — works on Railway/production)
========================= */

interface AdminState {
  isAdminAuthenticated: boolean;
  adminToken: string | null;
  setAdminAuthenticated: (value: boolean) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  checkAdminStatus: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAdmin = create<AdminState>()(
  persist(
    (set, get) => ({
      isAdminAuthenticated: false,
      adminToken: null,

      setAdminAuthenticated: (value) =>
        set({ isAdminAuthenticated: value }),

      login: async (username, password) => {
        try {
          const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include',
          });
          const data = await res.json();
          if (data.success && data.token) {
            set({ isAdminAuthenticated: true, adminToken: data.token });
            return { success: true };
          }
          return { success: false, error: data.error || 'Login failed' };
        } catch {
          return { success: false, error: 'Network error' };
        }
      },

      checkAdminStatus: async () => {
        const token = get().adminToken;
        if (!token) {
          set({ isAdminAuthenticated: false });
          return false;
        }
        try {
          const res = await fetch('/api/admin/check', {
            headers: { 'x-admin-token': token },
            credentials: 'include',
          });
          const data = await res.json();
          const isAdmin = data.isAdmin === true;
          set({ isAdminAuthenticated: isAdmin });
          if (!isAdmin) set({ adminToken: null });
          return isAdmin;
        } catch {
          set({ isAdminAuthenticated: false, adminToken: null });
          return false;
        }
      },

      logout: async () => {
        const token = get().adminToken;
        try {
          await fetch('/api/admin/logout', {
            method: 'POST',
            headers: token ? { 'x-admin-token': token } : {},
            credentials: 'include',
          });
        } catch {}
        set({ isAdminAuthenticated: false, adminToken: null });
      },
    }),
    {
      name: 'qnq-admin',
    }
  )
);

/* =========================
   ★ Global fetch interceptor
   Automatically adds admin token to ALL API requests
   so useQuery/useMutation work without modification
========================= */

if (typeof window !== 'undefined') {
  const _originalFetch = window.fetch;
  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    try {
      const stored = localStorage.getItem('qnq-admin');
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.adminToken;
        if (token) {
          init = init || {};
          const existingHeaders =
            init.headers instanceof Headers
              ? Object.fromEntries(init.headers.entries())
              : (init.headers as Record<string, string>) || {};
          init.headers = {
            ...existingHeaders,
            'x-admin-token': token,
          };
        }
      }
    } catch {
      // Silently fail — don't break non-admin requests
    }
    return _originalFetch.call(window, input, init);
  };
}

/* =========================
   BLOCKED NUMBERS
========================= */

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
