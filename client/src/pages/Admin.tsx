import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useAdmin } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  lotteryTypes, 
  lotteryTypeNames, 
  betTypes, 
  betTypeNames,
  type LotteryType, 
  type BetType,
  type BlockedNumber,
  type User,
  type Transaction,
  type Bet,
  type PayoutSetting,
  type BetLimitWithLotteryTypes
} from "@shared/schema";
import {
  Settings,
  Ban,
  Plus,
  Trash2,
  DollarSign,
  Shield,
  Users,
  Loader2,
  CreditCard,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  UserX,
  UserCheck,
  LineChart,
  PieChart,
  Trophy,
  Play,
  LogOut,
  ImageIcon,
  Calendar,
  CalendarCheck,
  CalendarX,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

type UserWithoutPassword = Omit<User, "password">;

interface AdminStats {
  users: { total: number; blocked: number; active: number };
  bets: { total: number; pending: number; won: number; lost: number; totalAmount: number };
  transactions: { pendingDeposits: number; totalDeposits: number };
  affiliates: { total: number; totalCommission: number };
}

interface LotteryResult {
  id: number;
  lotteryType: string;
  drawDate: string;
  firstPrize: string | null;
  threeDigitTop: string | null;
  threeDigitBottom: string | null;
  twoDigitTop: string | null;
  twoDigitBottom: string | null;
  runTop: string | null;
  runBottom: string | null;
  isProcessed: boolean;
  createdAt: string;
}

export default function Admin() {
  const { language, t } = useI18n();
  const { isAdminAuthenticated, checkAdminStatus, logout } = useAdmin();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      setIsCheckingAuth(true);
      await checkAdminStatus();
      setIsCheckingAuth(false);
    };
    verifyAdmin();
  }, [checkAdminStatus]);

  const [newLotteryType, setNewLotteryType] = useState<LotteryType | "">("");
  const [newNumber, setNewNumber] = useState("");
  const [newBetType, setNewBetType] = useState<BetType | "all">("all");
  const [betFilter, setBetFilter] = useState<"all" | "pending" | "won" | "lost">("all");

  const [resultLotteryType, setResultLotteryType] = useState<LotteryType | "">("");
  const [resultDrawDate, setResultDrawDate] = useState(new Date().toISOString().split('T')[0]);
  const [resultFirstPrize, setResultFirstPrize] = useState("");
  const [resultThreeTop, setResultThreeTop] = useState("");
  const [resultThreeBottom, setResultThreeBottom] = useState("");
  const [resultTwoTop, setResultTwoTop] = useState("");
  const [resultTwoBottom, setResultTwoBottom] = useState("");
  const [editingPayoutRate, setEditingPayoutRate] = useState<string | null>(null);
  const [editedRate, setEditedRate] = useState<string>("");

  const [limitNumber, setLimitNumber] = useState("");
  const [limitMaxAmount, setLimitMaxAmount] = useState("");
  const [limitLotteryTypes, setLimitLotteryTypes] = useState<string[]>([]);
  const [isAllLotteryTypes, setIsAllLotteryTypes] = useState(true);

  const [winnersLotteryType, setWinnersLotteryType] = useState<LotteryType | "">("");
  const [winnersDrawDate, setWinnersDrawDate] = useState(new Date().toISOString().split('T')[0]);

  // Scheduling states for blocked numbers
  const [blockedUseSchedule, setBlockedUseSchedule] = useState(false);
  const [blockedStartDate, setBlockedStartDate] = useState("");
  const [blockedEndDate, setBlockedEndDate] = useState("");

  // Scheduling states for limits
  const [limitUseSchedule, setLimitUseSchedule] = useState(false);
  const [limitStartDate, setLimitStartDate] = useState("");
  const [limitEndDate, setLimitEndDate] = useState("");

  const handleLogout = async () => {
    await logout();
    toast({
      title: language === "th" ? "ออกจากระบบแล้ว" : "Logged out successfully"
    });
    setLocation("/admin/login");
  };

  const { data: blockedNumbers = [], isLoading } = useQuery<BlockedNumber[]>({
    queryKey: ["/api/blocked-numbers"],
    enabled: isAdminAuthenticated,
  });

  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery<UserWithoutPassword[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdminAuthenticated,
  });

  const { data: allTransactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: isAdminAuthenticated,
  });

  const { data: allBets = [], isLoading: isLoadingBets } = useQuery<Bet[]>({
    queryKey: ["/api/bets"],
    enabled: isAdminAuthenticated,
  });

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000,
    enabled: isAdminAuthenticated,
  });

  const { data: lotteryResults = [], isLoading: isLoadingResults } = useQuery<LotteryResult[]>({
    queryKey: ["/api/lottery-results"],
    enabled: isAdminAuthenticated,
  });

  const { data: payoutSettings = [], isLoading: isLoadingPayoutRates, isError: isPayoutRatesError } = useQuery<PayoutSetting[]>({
    queryKey: ["/api/payout-rates"],
    enabled: isAdminAuthenticated,
  });

  const { data: betLimits = [], isLoading: isLoadingBetLimits } = useQuery<BetLimitWithLotteryTypes[]>({
    queryKey: ["/api/bet-limits"],
    enabled: isAdminAuthenticated,
  });

  interface BetTypeSetting {
    id: number;
    betType: string;
    isEnabled: boolean;
    updatedAt: string;
  }

  const { data: betTypeSettings = [], isLoading: isLoadingBetTypeSettings } = useQuery<BetTypeSetting[]>({
    queryKey: ["/api/bet-type-settings"],
    enabled: isAdminAuthenticated,
  });

  const updateBetTypeSettingMutation = useMutation({
    mutationFn: async ({ betType, isEnabled }: { betType: string; isEnabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/bet-type-settings/${betType}`, { isEnabled });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bet-type-settings"] });
      toast({
        title: variables.isEnabled
          ? (language === "th" ? "เปิดรับแทงประเภทนี้แล้ว" : "Bet type enabled")
          : (language === "th" ? "ปิดรับแทงประเภทนี้แล้ว" : "Bet type disabled")
      });
    },
    onError: () => {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error occurred",
        variant: "destructive"
      });
    }
  });

  interface WinnerInfo {
    betId: number;
    userId: number;
    username: string;
    betType: string;
    numbers: string;
    amount: number;
    winAmount: number;
    matchedNumber: string | null;
    processedAt: string | null;
  }

  interface WinnersResponse {
    lotteryType: string;
    drawDate: string;
    lotteryResult: LotteryResult | null;
    winners: WinnerInfo[];
    totalWinners: number;
    totalPayout: number;
  }

  interface ProcessedDraw {
    id: number;
    lotteryType: string;
    drawDate: string;
    firstPrize: string | null;
    twoDigitBottom: string | null;
    totalWinners: number | null;
    totalPayout: number | null;
    processedAt: string | null;
  }

  const { data: processedDraws = [], isLoading: isLoadingProcessedDraws } = useQuery<ProcessedDraw[]>({
    queryKey: ["/api/admin/processed-draws"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/processed-draws");
      return res.json();
    },
    enabled: isAdminAuthenticated,
  });

  const { data: winnersData, isLoading: isLoadingWinners, refetch: refetchWinners } = useQuery<WinnersResponse>({
    queryKey: ["/api/admin/winners", winnersLotteryType, winnersDrawDate],
    queryFn: async () => {
      const lotteryTypeParam = encodeURIComponent(winnersLotteryType);
      const drawDateParam = encodeURIComponent(winnersDrawDate);
      const res = await apiRequest("GET", `/api/admin/winners?lotteryType=${lotteryTypeParam}&drawDate=${drawDateParam}`);
      return res.json();
    },
    enabled: isAdminAuthenticated && winnersLotteryType !== "" && winnersDrawDate !== "",
  });

  const addBlockedMutation = useMutation({
    mutationFn: async (data: { 
      lotteryType: string; 
      number: string; 
      betType: string | null;
      startDate?: string | null;
      endDate?: string | null;
    }) => {
      const res = await apiRequest("POST", "/api/blocked-numbers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-numbers"] });
      setNewNumber("");
      setBlockedUseSchedule(false);
      setBlockedStartDate("");
      setBlockedEndDate("");
      toast({
        title: language === "th" ? "เพิ่มเลขอั้นสำเร็จ" : "Blocked number added"
      });
    },
    onError: () => {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error occurred",
        variant: "destructive"
      });
    }
  });

  const updateBlockedMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean | number }) => {
      const res = await apiRequest("PATCH", `/api/blocked-numbers/${id}`, { isActive: isActive ? 1 : 0 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-numbers"] });
    }
  });

  const deleteBlockedMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/blocked-numbers/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-numbers"] });
      toast({
        title: language === "th" ? "ลบเลขอั้นแล้ว" : "Blocked number removed"
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, isBlocked }: { id: number; isBlocked: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, { isBlocked });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: variables.isBlocked 
          ? (language === "th" ? "ระงับผู้ใช้แล้ว" : "User blocked")
          : (language === "th" ? "ปลดระงับผู้ใช้แล้ว" : "User unblocked")
      });
    }
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/transactions/${id}`, { status });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: variables.status === "approved"
          ? (language === "th" ? "อนุมัติธุรกรรมแล้ว" : "Transaction approved")
          : (language === "th" ? "ปฏิเสธธุรกรรมแล้ว" : "Transaction rejected")
      });
    }
  });

  const createResultMutation = useMutation({
    mutationFn: async (data: {
      lotteryType: string;
      drawDate: string;
      firstPrize?: string;
      threeDigitTop?: string;
      threeDigitBottom?: string;
      twoDigitTop?: string;
      twoDigitBottom?: string;
    }) => {
      const res = await apiRequest("POST", "/api/lottery-results", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lottery-results"] });
      setResultFirstPrize("");
      setResultThreeTop("");
      setResultThreeBottom("");
      setResultTwoTop("");
      setResultTwoBottom("");
      toast({
        title: language === "th" ? "บันทึกผลหวยสำเร็จ" : "Lottery result saved"
      });
    },
    onError: () => {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error occurred",
        variant: "destructive"
      });
    }
  });

  const processResultMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/lottery-results/${id}/process`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/lottery-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: language === "th" 
          ? `ประมวลผลแล้ว: ถูก ${data.won} รายการ, ไม่ถูก ${data.lost} รายการ`
          : `Processed: ${data.won} won, ${data.lost} lost`
      });
    },
    onError: () => {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error occurred",
        variant: "destructive"
      });
    }
  });

  const updatePayoutRateMutation = useMutation({
    mutationFn: async ({ betType, rate }: { betType: string; rate: number }) => {
      const res = await apiRequest("PATCH", `/api/payout-rates/${betType}`, { rate });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payout-rates"] });
      setEditingPayoutRate(null);
      setEditedRate("");
      toast({
        title: language === "th" ? "อัปเดตอัตราจ่ายแล้ว" : "Payout rate updated"
      });
    },
    onError: () => {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error occurred",
        variant: "destructive"
      });
    }
  });

  const addBetLimitMutation = useMutation({
    mutationFn: async (data: { 
      number: string; 
      maxAmount: number; 
      lotteryTypes: string[];
      startDate?: string | null;
      endDate?: string | null;
    }) => {
      const res = await apiRequest("POST", "/api/bet-limits", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bet-limits"] });
      setLimitNumber("");
      setLimitMaxAmount("");
      setLimitLotteryTypes([]);
      setIsAllLotteryTypes(true);
      setLimitUseSchedule(false);
      setLimitStartDate("");
      setLimitEndDate("");
      toast({
        title: language === "th" ? "เพิ่มลิมิตสำเร็จ" : "Bet limit added"
      });
    },
    onError: () => {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error occurred",
        variant: "destructive"
      });
    }
  });

  const updateBetLimitMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean | number }) => {
      const res = await apiRequest("PATCH", `/api/bet-limits/${id}`, { isActive: isActive ? 1 : 0 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bet-limits"] });
    }
  });

  const deleteBetLimitMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/bet-limits/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bet-limits"] });
      toast({
        title: language === "th" ? "ลบลิมิตแล้ว" : "Bet limit removed"
      });
    }
  });

  const chartColors = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316"
  ];

  const bettingByLotteryData = useMemo(() => {
    const grouped: Record<string, { amount: number; count: number }> = {};
    allBets.forEach(bet => {
      if (!grouped[bet.lotteryType]) {
        grouped[bet.lotteryType] = { amount: 0, count: 0 };
      }
      grouped[bet.lotteryType].amount += bet.amount;
      grouped[bet.lotteryType].count += 1;
    });
    return Object.entries(grouped).map(([type, data]) => ({
      name: lotteryTypeNames[type as LotteryType]?.[language] || type,
      value: data.amount,
      count: data.count
    }));
  }, [allBets, language]);

  const betTypeDistribution = useMemo(() => {
    const grouped: Record<string, number> = {};
    allBets.forEach(bet => {
      grouped[bet.betType] = (grouped[bet.betType] || 0) + bet.amount;
    });
    return Object.entries(grouped).map(([type, amount]) => ({
      name: betTypeNames[type as BetType]?.[language] || type,
      value: amount
    }));
  }, [allBets, language]);

  const hotNumbers = useMemo(() => {
    const numberCounts: Record<string, number> = {};
    allBets.forEach(bet => {
      if (!numberCounts[bet.numbers]) {
        numberCounts[bet.numbers] = 0;
      }
      numberCounts[bet.numbers]++;
    });
    return Object.entries(numberCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([number, count]) => ({
        number,
        count
      }));
  }, [allBets]);

  const dailyBettingData = useMemo(() => {
    const dailyData: Record<string, { date: string; amount: number; count: number }> = {};
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      last7Days.push(dateStr);
      dailyData[dateStr] = { date: dateStr, amount: 0, count: 0 };
    }
    allBets.forEach(bet => {
      const betDate = new Date(bet.createdAt).toISOString().split('T')[0];
      if (dailyData[betDate]) {
        dailyData[betDate].amount += bet.amount;
        dailyData[betDate].count += 1;
      }
    });
    return last7Days.map(date => ({
      ...dailyData[date],
      displayDate: new Date(date).toLocaleDateString(language === "th" ? "th-TH" : "en-US", { weekday: 'short', day: 'numeric' })
    }));
  }, [allBets, language]);

  const affiliatePerformance = useMemo(() => {
    return allUsers
      .filter(u => u.affiliateEarnings > 0)
      .sort((a, b) => b.affiliateEarnings - a.affiliateEarnings)
      .slice(0, 10)
      .map(user => ({
        username: user.username,
        earnings: user.affiliateEarnings
      }));
  }, [allUsers]);

  const pendingDeposits = allTransactions.filter(t => t.type === "deposit" && t.status === "pending");
  const filteredBets = betFilter === "all" 
    ? allBets 
    : allBets.filter(b => b.status === betFilter);

  const getPayoutRate = (betType: string): number | null => {
    const setting = payoutSettings.find(s => s.betType === betType);
    return setting ? setting.rate : null;
  };

  const handleSavePayoutRate = (betType: string) => {
    const rate = parseFloat(editedRate);
    if (isNaN(rate)) {
      toast({
        title: language === "th" ? "กรุณากรอกตัวเลขที่ถูกต้อง" : "Please enter a valid number",
        variant: "destructive"
      });
      return;
    }
    if (rate <= 0) {
      toast({
        title: language === "th" ? "อัตราจ่ายต้องมากกว่า 0" : "Rate must be greater than 0",
        variant: "destructive"
      });
      return;
    }
    if (rate > 10000) {
      toast({
        title: language === "th" ? "อัตราจ่ายต้องไม่เกิน 10,000" : "Rate must not exceed 10,000",
        variant: "destructive"
      });
      return;
    }
    updatePayoutRateMutation.mutate({ betType, rate });
  };

  const handleStartEditPayoutRate = (betType: string) => {
    const rate = getPayoutRate(betType);
    setEditingPayoutRate(betType);
    setEditedRate(rate !== null ? rate.toString() : "");
  };

  const handleCancelEditPayoutRate = () => {
    setEditingPayoutRate(null);
    setEditedRate("");
  };

  const getUsernameById = (userId: number) => {
    const user = allUsers.find(u => u.id === userId);
    return user?.username || `User #${userId}`;
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">
              {language === "th" ? "กำลังตรวจสอบสิทธิ์..." : "Verifying access..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{t("admin.title")}</CardTitle>
            <CardDescription>
              {language === "th" 
                ? "เข้าสู่ระบบ Admin เพื่อจัดการระบบ" 
                : "Login as Admin to manage the system"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <a href="/admin/login">{t("admin.login")}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddBlocked = () => {
    if (!newLotteryType || !newNumber) {
      toast({
        title: language === "th" ? "ข้อมูลไม่ครบ" : "Missing information",
        variant: "destructive"
      });
      return;
    }

    addBlockedMutation.mutate({
      lotteryType: newLotteryType,
      number: newNumber,
      betType: newBetType === "all" ? null : newBetType,
      startDate: blockedUseSchedule && blockedStartDate ? blockedStartDate : null,
      endDate: blockedUseSchedule && blockedEndDate ? blockedEndDate : null
    });
  };

  const handleToggleBlocked = (id: number, isActive: boolean | number) => {
    updateBlockedMutation.mutate({ id, isActive: !isActive });
  };

  const handleDeleteBlocked = (id: number) => {
    deleteBlockedMutation.mutate(id);
  };

 const handleToggleUserBlock = (userId: number, isBlocked: number | boolean) => {
    updateUserMutation.mutate({ id: userId, isBlocked: !isBlocked });
  };

  const handleApproveTransaction = (tx: Transaction) => {
    updateTransactionMutation.mutate({ id: tx.id, status: "approved" });
  };

  const handleRejectTransaction = (tx: Transaction) => {
    updateTransactionMutation.mutate({ id: tx.id, status: "rejected" });
  };

  const handleCreateResult = () => {
    if (!resultLotteryType || !resultDrawDate || !resultFirstPrize) {
      toast({
        title: language === "th" ? "กรุณากรอกข้อมูลให้ครบ" : "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createResultMutation.mutate({
      lotteryType: resultLotteryType,
      drawDate: resultDrawDate,
      firstPrize: resultFirstPrize,
      threeDigitTop: resultThreeTop || undefined,
      threeDigitBottom: resultThreeBottom || undefined,
      twoDigitTop: resultTwoTop || resultFirstPrize.slice(-2),
      twoDigitBottom: resultTwoBottom || undefined
    });
  };

  const handleProcessResult = (id: number) => {
    processResultMutation.mutate(id);
  };

  return (
    <div className="min-h-full">
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 md:p-6 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{t("admin.title")}</h1>
              <p className="text-sm text-muted-foreground">
                {language === "th" ? "จัดการระบบ ผู้ใช้ และธุรกรรม" : "Manage system, users, and transactions"}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="gap-2"
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
            {language === "th" ? "ออกจากระบบ" : "Logout"}
          </Button>
        </div>
      </div>

      {stats && (
        <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{language === "th" ? "ผู้ใช้ทั้งหมด" : "Total Users"}</p>
                  <p className="text-2xl font-bold">{stats.users.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{language === "th" ? "ยอดแทงทั้งหมด" : "Total Bets"}</p>
                  <p className="text-2xl font-bold">{stats.bets.totalAmount.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{language === "th" ? "รอดำเนินการ" : "Pending"}</p>
                  <p className="text-2xl font-bold">{stats.transactions.pendingDeposits}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{language === "th" ? "คอมมิชชั่น" : "Commission"}</p>
                  <p className="text-2xl font-bold">{stats.affiliates.totalCommission.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="p-4 md:p-6 pt-0">
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="transactions" className="gap-1 text-xs sm:text-sm">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "ธุรกรรม" : "Trans"}</span>
              {pendingDeposits.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingDeposits.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-1 text-xs sm:text-sm">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "ผลหวย" : "Results"}</span>
            </TabsTrigger>
            <TabsTrigger value="winners" className="gap-1 text-xs sm:text-sm" data-testid="tab-winners">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "ผู้ถูกรางวัล" : "Winners"}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "ผู้ใช้" : "Users"}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1 text-xs sm:text-sm">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "วิเคราะห์" : "Charts"}</span>
            </TabsTrigger>
            <TabsTrigger value="bets" className="gap-1 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "รายงาน" : "Bets"}</span>
            </TabsTrigger>
            <TabsTrigger value="blocked" className="gap-1 text-xs sm:text-sm">
              <Ban className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "อั้น" : "Block"}</span>
            </TabsTrigger>
            <TabsTrigger value="limits" className="gap-1 text-xs sm:text-sm">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "ลิมิต" : "Limits"}</span>
            </TabsTrigger>
            <TabsTrigger value="bet-types" className="gap-1 text-xs sm:text-sm">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "ประเภท" : "Types"}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {language === "th" ? "รายการฝากรอดำเนินการ" : "Pending Deposits"}
                  {pendingDeposits.length > 0 && (
                    <Badge variant="destructive">{pendingDeposits.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingTransactions ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : pendingDeposits.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "th" ? "ไม่มีรายการรอดำเนินการ" : "No pending transactions"}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "th" ? "ผู้ใช้" : "User"}</TableHead>
                        <TableHead>{language === "th" ? "จำนวน" : "Amount"}</TableHead>
                        <TableHead>{language === "th" ? "สลิป" : "Slip"}</TableHead>
                        <TableHead>{language === "th" ? "อ้างอิง" : "Reference"}</TableHead>
                        <TableHead>{language === "th" ? "วันที่" : "Date"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDeposits.map((tx) => (
                        <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                          <TableCell className="font-medium">{getUsernameById(tx.userId)}</TableCell>
                          <TableCell className="font-bold text-green-600">
                            +{tx.amount.toLocaleString()} ฿
                          </TableCell>
                          <TableCell>
                            {tx.slipUrl ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" data-testid={`button-view-slip-${tx.id}`}>
                                    <ImageIcon className="h-4 w-4 mr-1" />
                                    {language === "th" ? "ดูสลิป" : "View"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {language === "th" ? "สลิปการโอนเงิน" : "Payment Slip"}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="flex flex-col gap-4">
                                    <div className="text-sm space-y-1">
                                      <p><strong>{language === "th" ? "ผู้ใช้:" : "User:"}</strong> {getUsernameById(tx.userId)}</p>
                                      <p><strong>{language === "th" ? "จำนวน:" : "Amount:"}</strong> {tx.amount.toLocaleString()} ฿</p>
                                      <p><strong>{language === "th" ? "อ้างอิง:" : "Reference:"}</strong> {tx.reference}</p>
                                    </div>
                                    <img 
                                      src={tx.slipUrl} 
                                      alt="Payment slip" 
                                      className="w-full rounded-lg border"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                {language === "th" ? "ไม่มีสลิป" : "No slip"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApproveTransaction(tx)}
                                disabled={updateTransactionMutation.isPending}
                                data-testid={`button-approve-${tx.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {language === "th" ? "อนุมัติ" : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectTransaction(tx)}
                                disabled={updateTransactionMutation.isPending}
                                data-testid={`button-reject-${tx.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {language === "th" ? "ปฏิเสธ" : "Reject"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {language === "th" ? "บันทึกผลหวย" : "Add Lottery Result"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                  <div className="space-y-2">
                    <Label>{language === "th" ? "ประเภทหวย" : "Lottery Type"}</Label>
                    <Select value={resultLotteryType} onValueChange={(v) => setResultLotteryType(v as LotteryType)}>
                      <SelectTrigger data-testid="select-result-lottery">
                        <SelectValue placeholder={language === "th" ? "เลือกหวย" : "Select lottery"} />
                      </SelectTrigger>
                      <SelectContent>
                        {lotteryTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {lotteryTypeNames[type][language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "th" ? "วันที่ออก" : "Draw Date"}</Label>
                    <Input
                      type="date"
                      value={resultDrawDate}
                      onChange={(e) => setResultDrawDate(e.target.value)}
                      data-testid="input-result-date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "th" ? "รางวัลที่ 1 (6 หลัก)" : "First Prize (6 digits)"}</Label>
                    <Input
                      value={resultFirstPrize}
                      onChange={(e) => setResultFirstPrize(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="123456"
                      className="font-mono"
                      maxLength={6}
                      data-testid="input-first-prize"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "th" ? "3 ตัวหน้า" : "3 Digits Front"}</Label>
                    <Input
                      value={resultThreeTop}
                      onChange={(e) => setResultThreeTop(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="123"
                      className="font-mono"
                      maxLength={3}
                      data-testid="input-three-front"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "th" ? "3 ตัวล่าง" : "3 Digits Bottom"}</Label>
                    <Input
                      value={resultThreeBottom}
                      onChange={(e) => setResultThreeBottom(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="456"
                      className="font-mono"
                      maxLength={3}
                      data-testid="input-three-bottom"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "th" ? "2 ตัวล่าง" : "2 Digits Bottom"}</Label>
                    <Input
                      value={resultTwoBottom}
                      onChange={(e) => setResultTwoBottom(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="00"
                      className="font-mono"
                      maxLength={2}
                      data-testid="input-two-bottom"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCreateResult} 
                  className="w-full gap-2"
                  disabled={createResultMutation.isPending}
                  data-testid="button-save-result"
                >
                  {createResultMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {language === "th" ? "บันทึกผลหวย" : "Save Result"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  {language === "th" ? "รายการผลหวย" : "Lottery Results"}
                  <Badge variant="secondary">{lotteryResults.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingResults ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : lotteryResults.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "th" ? "ยังไม่มีผลหวย" : "No lottery results yet"}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "th" ? "หวย" : "Lottery"}</TableHead>
                        <TableHead>{language === "th" ? "วันที่" : "Date"}</TableHead>
                        <TableHead>{language === "th" ? "รางวัลที่ 1" : "First Prize"}</TableHead>
                        <TableHead>{language === "th" ? "2 ตัวล่าง" : "2D Bottom"}</TableHead>
                        <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotteryResults.map((result) => (
                        <TableRow key={result.id} data-testid={`row-result-${result.id}`}>
                          <TableCell>
                            <Badge variant="secondary">
                              {lotteryTypeNames[result.lotteryType as LotteryType]?.[language] || result.lotteryType}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            {new Date(result.drawDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-lg text-primary">
                            {result.firstPrize || "-"}
                          </TableCell>
                          <TableCell className="font-mono font-bold">
                            {result.twoDigitBottom || "-"}
                          </TableCell>
                          <TableCell>
                            {result.isProcessed ? (
                              <Badge className="bg-green-500 gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {language === "th" ? "ประมวลผลแล้ว" : "Processed"}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {language === "th" ? "รอประมวลผล" : "Pending"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!result.isProcessed && (
                              <Button
                                size="sm"
                                onClick={() => handleProcessResult(result.id)}
                                disabled={processResultMutation.isPending}
                                data-testid={`button-process-${result.id}`}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                {language === "th" ? "ประมวลผล" : "Process"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="winners" className="space-y-4" data-testid="tabcontent-winners">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  {language === "th" ? "ค้นหาผู้ถูกรางวัล" : "Search Winners"}
                </CardTitle>
                <CardDescription>
                  {language === "th" ? "เลือกประเภทหวยและวันที่เพื่อดูรายชื่อผู้ถูกรางวัล" : "Select lottery type and date to view winners"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "th" ? "ประเภทหวย" : "Lottery Type"}</Label>
                    <Select
                      value={winnersLotteryType}
                      onValueChange={(value: LotteryType) => setWinnersLotteryType(value)}
                    >
                      <SelectTrigger data-testid="select-winners-lottery-type">
                        <SelectValue placeholder={language === "th" ? "เลือกประเภท" : "Select type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {lotteryTypes.map((type) => (
                          <SelectItem key={type} value={type} data-testid={`select-item-winners-lottery-${type}`}>
                            {lotteryTypeNames[type][language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "th" ? "วันที่ออกผล" : "Draw Date"}</Label>
                    <Input
                      type="date"
                      value={winnersDrawDate}
                      onChange={(e) => setWinnersDrawDate(e.target.value)}
                      data-testid="input-winners-draw-date"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => refetchWinners()}
                      disabled={!winnersLotteryType || !winnersDrawDate || isLoadingWinners}
                      data-testid="button-search-winners"
                    >
                      {isLoadingWinners ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trophy className="h-4 w-4 mr-2" />
                      )}
                      {language === "th" ? "ค้นหา" : "Search"}
                    </Button>
                  </div>
                </div>

                {winnersData && (
                  <div className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">{language === "th" ? "จำนวนผู้ถูกรางวัล" : "Total Winners"}</p>
                              <p className="text-2xl font-bold">{winnersData.totalWinners}</p>
                            </div>
                            <Trophy className="h-8 w-8 text-green-500 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">{language === "th" ? "เงินรางวัลรวม" : "Total Payout"}</p>
                              <p className="text-2xl font-bold">{winnersData.totalPayout.toLocaleString()} ฿</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-yellow-500 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">{language === "th" ? "รางวัลที่ 1" : "First Prize"}</p>
                              <p className="text-2xl font-bold font-mono">{winnersData.lotteryResult?.firstPrize || "-"}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-blue-500 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {winnersData.winners.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground" data-testid="no-winners-message">
                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{language === "th" ? "ไม่มีผู้ถูกรางวัลในงวดนี้" : "No winners in this draw"}</p>
                      </div>
                    ) : (
                      <Table data-testid="table-winners">
                        <TableHeader>
                          <TableRow>
                            <TableHead>{language === "th" ? "ผู้ใช้" : "User"}</TableHead>
                            <TableHead>{language === "th" ? "ประเภท" : "Bet Type"}</TableHead>
                            <TableHead>{language === "th" ? "เลขที่ซื้อ" : "Numbers"}</TableHead>
                            <TableHead>{language === "th" ? "เลขที่ถูก" : "Matched"}</TableHead>
                            <TableHead>{language === "th" ? "เดิมพัน" : "Bet"}</TableHead>
                            <TableHead>{language === "th" ? "เงินรางวัล" : "Win Amount"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {winnersData.winners.map((winner) => (
                            <TableRow key={winner.betId} data-testid={`row-winner-${winner.betId}`}>
                              <TableCell className="font-medium">
                                <div>
                                  <p>{winner.username}</p>
                                  <p className="text-xs text-muted-foreground">ID: {winner.userId}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {betTypeNames[winner.betType as BetType]?.[language] || winner.betType}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono">{winner.numbers}</TableCell>
                              <TableCell className="font-mono font-bold text-green-600">
                                {winner.matchedNumber || "-"}
                              </TableCell>
                              <TableCell>{winner.amount.toLocaleString()} ฿</TableCell>
                              <TableCell className="font-bold text-green-600">
                                {winner.winAmount.toLocaleString()} ฿
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {language === "th" ? "งวดที่ประมวลผลแล้ว" : "Processed Draws"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingProcessedDraws ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : processedDraws.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "th" ? "ยังไม่มีการประมวลผล" : "No processed draws yet"}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "th" ? "ประเภท" : "Type"}</TableHead>
                        <TableHead>{language === "th" ? "วันที่" : "Date"}</TableHead>
                        <TableHead>{language === "th" ? "รางวัลที่ 1" : "First Prize"}</TableHead>
                        <TableHead>{language === "th" ? "2 ตัวล่าง" : "2 Bottom"}</TableHead>
                        <TableHead>{language === "th" ? "ผู้ถูกรางวัล" : "Winners"}</TableHead>
                        <TableHead>{language === "th" ? "เงินรางวัล" : "Payout"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "ดู" : "View"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedDraws.map((draw) => (
                        <TableRow key={draw.id} data-testid={`row-processed-draw-${draw.id}`}>
                          <TableCell>
                            <Badge variant="secondary">
                              {lotteryTypeNames[draw.lotteryType as LotteryType]?.[language] || draw.lotteryType}
                            </Badge>
                          </TableCell>
                          <TableCell>{draw.drawDate}</TableCell>
                          <TableCell className="font-mono font-bold">{draw.firstPrize || "-"}</TableCell>
                          <TableCell className="font-mono">{draw.twoDigitBottom || "-"}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">{draw.totalWinners || 0}</Badge>
                          </TableCell>
                          <TableCell className="font-bold">{(draw.totalPayout || 0).toLocaleString()} ฿</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setWinnersLotteryType(draw.lotteryType as LotteryType);
                                setWinnersDrawDate(draw.drawDate);
                              }}
                              data-testid={`button-view-winners-${draw.id}`}
                            >
                              <Trophy className="h-4 w-4 mr-1" />
                              {language === "th" ? "ดู" : "View"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {language === "th" ? "รายชื่อผู้ใช้" : "User List"}
                  <Badge variant="secondary">{allUsers.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingUsers ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>{language === "th" ? "ชื่อผู้ใช้" : "Username"}</TableHead>
                        <TableHead>{language === "th" ? "ยอดเงิน" : "Balance"}</TableHead>
                        <TableHead>{language === "th" ? "รหัสแนะนำ" : "Referral"}</TableHead>
                        <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((user) => (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell className="font-mono text-muted-foreground">#{user.id}</TableCell>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell className="font-bold">{user.balance.toLocaleString()} ฿</TableCell>
                          <TableCell className="font-mono text-xs">{user.referralCode}</TableCell>
                          <TableCell>
                            {user.isBlocked ? (
                              <Badge variant="destructive" className="gap-1">
                                <UserX className="h-3 w-3" />
                                {language === "th" ? "ระงับ" : "Blocked"}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <UserCheck className="h-3 w-3" />
                                {language === "th" ? "ใช้งาน" : "Active"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={user.isBlocked ? "default" : "destructive"}
                              onClick={() => handleToggleUserBlock(user.id, user.isBlocked)}
                              disabled={updateUserMutation.isPending}
                              data-testid={`button-toggle-block-${user.id}`}
                            >
                              {user.isBlocked ? (
                                <>
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  {language === "th" ? "ปลดระงับ" : "Unblock"}
                                </>
                              ) : (
                                <>
                                  <UserX className="h-4 w-4 mr-1" />
                                  {language === "th" ? "ระงับ" : "Block"}
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {language === "th" ? "ยอดแทงรายวัน (7 วัน)" : "Daily Betting (7 Days)"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyBettingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={dailyBettingData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="displayDate" className="text-xs" tick={{fill: 'hsl(var(--muted-foreground))'}} />
                        <YAxis className="text-xs" tick={{fill: 'hsl(var(--muted-foreground))'}} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`${value.toLocaleString()} ฿`, language === "th" ? "ยอดแทง" : "Amount"]}
                        />
                        <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorAmount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      {language === "th" ? "ไม่มีข้อมูล" : "No data available"}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    {language === "th" ? "ยอดแทงตามหวย" : "Betting by Lottery"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bettingByLotteryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPie>
                        <Pie
                          data={bettingByLotteryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {bettingByLotteryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`${value.toLocaleString()} ฿`, language === "th" ? "ยอดแทง" : "Amount"]}
                        />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      {language === "th" ? "ไม่มีข้อมูล" : "No data available"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {language === "th" ? "เลขฮอต Top 10" : "Hot Numbers Top 10"}
                  </CardTitle>
                  <CardDescription>
                    {language === "th" ? "เลขที่มีคนแทงมากที่สุด" : "Most frequently bet numbers"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hotNumbers.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={hotNumbers} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tick={{fill: 'hsl(var(--muted-foreground))'}} />
                        <YAxis 
                          type="category" 
                          dataKey="number" 
                          tick={{fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace', fontWeight: 'bold'}} 
                          width={60}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [value, language === "th" ? "จำนวนครั้ง" : "Count"]}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      {language === "th" ? "ไม่มีข้อมูล" : "No data available"}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {language === "th" ? "ยอดแทงตามประเภท" : "Betting by Type"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {betTypeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={betTypeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="name" 
                          tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10}} 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{fill: 'hsl(var(--muted-foreground))'}} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`${value.toLocaleString()} ฿`, language === "th" ? "ยอดแทง" : "Amount"]}
                        />
                        <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      {language === "th" ? "ไม่มีข้อมูล" : "No data available"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {language === "th" ? "Affiliate ยอดสูงสุด" : "Top Affiliates"}
                </CardTitle>
                <CardDescription>
                  {language === "th" ? "รายได้คอมมิชชั่นสูงสุด 10 อันดับ" : "Top 10 commission earners"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {affiliatePerformance.length > 0 ? (
                  <div className="space-y-3">
                    {affiliatePerformance.map((affiliate, index) => (
                      <div key={affiliate.username} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                            #{index + 1}
                          </div>
                          <span className="font-medium">{affiliate.username}</span>
                        </div>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          +{affiliate.earnings.toLocaleString()} ฿
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "th" ? "ยังไม่มี Affiliate ที่ได้รับคอมมิชชั่น" : "No affiliates with commissions yet"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bets" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {language === "th" ? "รายงานการแทง" : "Betting Reports"}
                    <Badge variant="secondary">{filteredBets.length}</Badge>
                  </CardTitle>
                  <Select value={betFilter} onValueChange={(v) => setBetFilter(v as typeof betFilter)}>
                    <SelectTrigger className="w-[140px]" data-testid="select-bet-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "th" ? "ทั้งหมด" : "All"}</SelectItem>
                      <SelectItem value="pending">{language === "th" ? "รอผล" : "Pending"}</SelectItem>
                      <SelectItem value="won">{language === "th" ? "ถูกรางวัล" : "Won"}</SelectItem>
                      <SelectItem value="lost">{language === "th" ? "ไม่ถูก" : "Lost"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingBets ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredBets.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "th" ? "ไม่มีรายการแทง" : "No bets found"}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "th" ? "ผู้ใช้" : "User"}</TableHead>
                        <TableHead>{language === "th" ? "หวย" : "Lottery"}</TableHead>
                        <TableHead>{language === "th" ? "ประเภท" : "Type"}</TableHead>
                        <TableHead>{language === "th" ? "เลข" : "Number"}</TableHead>
                        <TableHead>{language === "th" ? "ยอดแทง" : "Amount"}</TableHead>
                        <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBets.slice(0, 50).map((bet) => (
                        <TableRow key={bet.id} data-testid={`row-bet-${bet.id}`}>
                          <TableCell className="font-medium">{getUsernameById(bet.userId)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {lotteryTypeNames[bet.lotteryType as LotteryType]?.[language] || bet.lotteryType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {betTypeNames[bet.betType as BetType]?.[language] || bet.betType}
                          </TableCell>
                          <TableCell className="font-mono font-bold">{bet.numbers}</TableCell>
                          <TableCell>{bet.amount.toLocaleString()} ฿</TableCell>
                          <TableCell>
                            {bet.status === "pending" && (
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {language === "th" ? "รอผล" : "Pending"}
                              </Badge>
                            )}
                            {bet.status === "won" && (
                              <Badge className="bg-green-500 gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {language === "th" ? "ถูกรางวัล" : "Won"}
                              </Badge>
                            )}
                            {bet.status === "lost" && (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                {language === "th" ? "ไม่ถูก" : "Lost"}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocked" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {t("admin.addBlocked")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label>{language === "th" ? "ประเภทหวย" : "Lottery Type"}</Label>
                    <Select value={newLotteryType} onValueChange={(v) => setNewLotteryType(v as LotteryType)}>
                      <SelectTrigger data-testid="select-lottery-type">
                        <SelectValue placeholder={language === "th" ? "เลือกหวย" : "Select lottery"} />
                      </SelectTrigger>
                      <SelectContent>
                        {lotteryTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {lotteryTypeNames[type][language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "th" ? "เลขที่อั้น" : "Number"}</Label>
                    <Input
                      value={newNumber}
                      onChange={(e) => setNewNumber(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="123"
                      className="font-mono"
                      data-testid="input-blocked-number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "th" ? "ประเภทแทง" : "Bet Type"}</Label>
                    <Select value={newBetType} onValueChange={(v) => setNewBetType(v as BetType | "all")}>
                      <SelectTrigger data-testid="select-bet-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === "th" ? "ทุกประเภท" : "All types"}</SelectItem>
                        {betTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {betTypeNames[type][language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={handleAddBlocked} 
                      className="w-full gap-2" 
                      disabled={addBlockedMutation.isPending}
                      data-testid="button-add-blocked"
                    >
                      {addBlockedMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {language === "th" ? "เพิ่ม" : "Add"}
                    </Button>
                  </div>
                </div>

                {/* Scheduling Section for Blocked Numbers */}
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {language === "th" ? "ตั้งเวลาล่วงหน้า (GMT+7)" : "Schedule (GMT+7)"}
                      </span>
                    </div>
                    <Switch
                      checked={blockedUseSchedule}
                      onCheckedChange={setBlockedUseSchedule}
                      data-testid="switch-blocked-schedule"
                    />
                  </div>

                  {blockedUseSchedule && (
                    <div className="grid gap-4 sm:grid-cols-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-green-600">
                          <CalendarCheck className="h-4 w-4" />
                          {language === "th" ? "เริ่มต้น" : "Start"}
                        </Label>
                        <Input
                          type="datetime-local"
                          value={blockedStartDate}
                          onChange={(e) => setBlockedStartDate(e.target.value)}
                          className="border-green-500/30"
                          data-testid="input-blocked-start-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-red-600">
                          <CalendarX className="h-4 w-4" />
                          {language === "th" ? "สิ้นสุด" : "End"}
                        </Label>
                        <Input
                          type="datetime-local"
                          value={blockedEndDate}
                          onChange={(e) => setBlockedEndDate(e.target.value)}
                          min={blockedStartDate}
                          className="border-red-500/30"
                          data-testid="input-blocked-end-date"
                        />
                      </div>
                      <div className="sm:col-span-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const now = new Date();
                            const end = new Date(now);
                            end.setHours(23, 59, 59, 999);
                            setBlockedStartDate(now.toISOString().slice(0, 16));
                            setBlockedEndDate(end.toISOString().slice(0, 16));
                          }}
                        >
                          {language === "th" ? "วันนี้" : "Today"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const start = new Date();
                            start.setDate(start.getDate() + 1);
                            start.setHours(0, 0, 0, 0);
                            const end = new Date(start);
                            end.setHours(23, 59, 59, 999);
                            setBlockedStartDate(start.toISOString().slice(0, 16));
                            setBlockedEndDate(end.toISOString().slice(0, 16));
                          }}
                        >
                          {language === "th" ? "พรุ่งนี้" : "Tomorrow"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const now = new Date();
                            const end = new Date(now);
                            end.setDate(end.getDate() + 7);
                            setBlockedStartDate(now.toISOString().slice(0, 16));
                            setBlockedEndDate(end.toISOString().slice(0, 16));
                          }}
                        >
                          {language === "th" ? "7 วัน" : "7 Days"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {!blockedUseSchedule && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      {language === "th" 
                        ? "จะมีผลบังคับใช้ทันทีและตลอดไป" 
                        : "Will be active immediately and forever"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ban className="h-5 w-5" />
                  {language === "th" ? "รายการเลขอั้น" : "Blocked Numbers List"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "th" ? "หวย" : "Lottery"}</TableHead>
                        <TableHead>{language === "th" ? "เลข" : "Number"}</TableHead>
                        <TableHead>{language === "th" ? "ประเภทแทง" : "Bet Type"}</TableHead>
                        <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blockedNumbers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {language === "th" ? "ยังไม่มีเลขอั้น" : "No blocked numbers yet"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        blockedNumbers.map((bn) => (
                          <TableRow key={bn.id}>
                            <TableCell>
                              <Badge variant="secondary">
                                {lotteryTypeNames[bn.lotteryType as LotteryType][language]}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono font-bold text-lg">
                              {bn.number}
                            </TableCell>
                            <TableCell>
                              {bn.betType 
                                ? betTypeNames[bn.betType as BetType][language]
                                : (language === "th" ? "ทุกประเภท" : "All")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={!!bn.isActive}
                                  onCheckedChange={() => handleToggleBlocked(bn.id, bn.isActive)}
                                  data-testid={`switch-blocked-${bn.id}`}
                                />
                                <span className={bn.isActive ? "text-green-500" : "text-muted-foreground"}>
                                  {bn.isActive 
                                    ? (language === "th" ? "เปิด" : "Active")
                                    : (language === "th" ? "ปิด" : "Inactive")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteBlocked(bn.id)}
                                disabled={deleteBlockedMutation.isPending}
                                data-testid={`button-delete-blocked-${bn.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t("admin.payoutRates")}
                </CardTitle>
                <CardDescription>
                  {language === "th" 
                    ? "คลิกที่อัตราจ่ายเพื่อแก้ไข" 
                    : "Click on a payout rate to edit"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPayoutRates ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : isPayoutRatesError || payoutSettings.length < betTypes.length ? (
                  <div className="p-8 text-center text-destructive">
                    <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">
                      {language === "th" 
                        ? "อัตราจ่ายไม่ครบถ้วน กรุณาตรวจสอบการตั้งค่าระบบหรือรีสตาร์ทเซิร์ฟเวอร์" 
                        : "Payout rates are incomplete. Please check system configuration or restart the server."}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {language === "th" 
                        ? `พบ ${payoutSettings.length}/${betTypes.length} รายการ` 
                        : `Found ${payoutSettings.length}/${betTypes.length} rates`}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {betTypes.map((type) => (
                      <Card key={type} className="bg-card/50 hover-elevate">
                        <CardContent className="p-4">
                          {editingPayoutRate === type ? (
                            <div className="flex flex-col gap-2">
                              <span className="font-medium text-sm">
                                {betTypeNames[type][language]}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">x</span>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0.1"
                                  max="10000"
                                  value={editedRate}
                                  onChange={(e) => setEditedRate(e.target.value)}
                                  className="h-8 w-24 font-mono"
                                  autoFocus
                                  disabled={updatePayoutRateMutation.isPending}
                                  data-testid={`input-payout-rate-${type}`}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSavePayoutRate(type)}
                                  disabled={updatePayoutRateMutation.isPending}
                                  data-testid={`button-save-payout-rate-${type}`}
                                >
                                  {updatePayoutRateMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEditPayoutRate}
                                  disabled={updatePayoutRateMutation.isPending}
                                  data-testid={`button-cancel-payout-rate-${type}`}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center justify-between gap-2 cursor-pointer"
                              onClick={() => handleStartEditPayoutRate(type)}
                              data-testid={`payout-rate-row-${type}`}
                            >
                              <span className="font-medium">
                                {betTypeNames[type][language]}
                              </span>
                              {getPayoutRate(type) !== null ? (
                                <Badge variant="secondary" className="text-lg font-bold">
                                  x{getPayoutRate(type)}
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-sm font-medium">
                                  {language === "th" ? "ไม่พบอัตรา" : "Rate missing"}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {language === "th" ? "เพิ่มลิมิตยอดแทง" : "Add Betting Limit"}
                </CardTitle>
                <CardDescription>
                  {language === "th" 
                    ? "กำหนดยอดแทงสูงสุดต่อเลขในแต่ละหวย" 
                    : "Set maximum bet amount per number for each lottery"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="limit-number">{language === "th" ? "เลข" : "Number"}</Label>
                    <Input
                      id="limit-number"
                      placeholder={language === "th" ? "เช่น 00, 123" : "e.g. 00, 123"}
                      value={limitNumber}
                      onChange={(e) => setLimitNumber(e.target.value)}
                      data-testid="input-limit-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="limit-max-amount">{language === "th" ? "ยอดสูงสุด (บาท)" : "Max Amount (฿)"}</Label>
                    <Input
                      id="limit-max-amount"
                      type="number"
                      placeholder={language === "th" ? "เช่น 1000" : "e.g. 1000"}
                      value={limitMaxAmount}
                      onChange={(e) => setLimitMaxAmount(e.target.value)}
                      data-testid="input-limit-max-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "th" ? "ใช้กับหวย" : "Apply to Lottery"}</Label>
                    <Select
                      value={isAllLotteryTypes ? "all" : "specific"}
                      onValueChange={(v) => {
                        setIsAllLotteryTypes(v === "all");
                        if (v === "all") setLimitLotteryTypes([]);
                      }}
                    >
                      <SelectTrigger data-testid="select-limit-lottery-scope">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === "th" ? "ทุกหวย" : "All Lotteries"}</SelectItem>
                        <SelectItem value="specific">{language === "th" ? "เลือกหวย" : "Specific"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        if (!limitNumber || !limitMaxAmount) return;
                        addBetLimitMutation.mutate({
                          number: limitNumber,
                          maxAmount: parseFloat(limitMaxAmount),
                          lotteryTypes: isAllLotteryTypes ? [] : limitLotteryTypes,
                          startDate: limitUseSchedule && limitStartDate ? limitStartDate : null,
                          endDate: limitUseSchedule && limitEndDate ? limitEndDate : null
                        });
                      }}
                      disabled={!limitNumber || !limitMaxAmount || addBetLimitMutation.isPending}
                      className="w-full"
                      data-testid="button-add-limit"
                    >
                      {addBetLimitMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      {language === "th" ? "เพิ่มลิมิต" : "Add Limit"}
                    </Button>
                  </div>
                </div>

                {!isAllLotteryTypes && (
                  <div className="space-y-2">
                    <Label>{language === "th" ? "เลือกประเภทหวย" : "Select Lottery Types"}</Label>
                    <div className="flex flex-wrap gap-2">
                      {lotteryTypes.map((type) => (
                        <Badge
                          key={type}
                          variant={limitLotteryTypes.includes(type) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (limitLotteryTypes.includes(type)) {
                              setLimitLotteryTypes(limitLotteryTypes.filter(t => t !== type));
                            } else {
                              setLimitLotteryTypes([...limitLotteryTypes, type]);
                            }
                          }}
                          data-testid={`badge-lottery-type-${type}`}
                        >
                          {lotteryTypeNames[type][language]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scheduling Section for Limits */}
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {language === "th" ? "ตั้งเวลาล่วงหน้า (GMT+7)" : "Schedule (GMT+7)"}
                      </span>
                    </div>
                    <Switch
                      checked={limitUseSchedule}
                      onCheckedChange={setLimitUseSchedule}
                      data-testid="switch-limit-schedule"
                    />
                  </div>

                  {limitUseSchedule && (
                    <div className="grid gap-4 sm:grid-cols-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-green-600">
                          <CalendarCheck className="h-4 w-4" />
                          {language === "th" ? "เริ่มต้น" : "Start"}
                        </Label>
                        <Input
                          type="datetime-local"
                          value={limitStartDate}
                          onChange={(e) => setLimitStartDate(e.target.value)}
                          className="border-green-500/30"
                          data-testid="input-limit-start-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-red-600">
                          <CalendarX className="h-4 w-4" />
                          {language === "th" ? "สิ้นสุด" : "End"}
                        </Label>
                        <Input
                          type="datetime-local"
                          value={limitEndDate}
                          onChange={(e) => setLimitEndDate(e.target.value)}
                          min={limitStartDate}
                          className="border-red-500/30"
                          data-testid="input-limit-end-date"
                        />
                      </div>
                      <div className="sm:col-span-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const now = new Date();
                            const end = new Date(now);
                            end.setHours(23, 59, 59, 999);
                            setLimitStartDate(now.toISOString().slice(0, 16));
                            setLimitEndDate(end.toISOString().slice(0, 16));
                          }}
                        >
                          {language === "th" ? "วันนี้" : "Today"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const start = new Date();
                            start.setDate(start.getDate() + 1);
                            start.setHours(0, 0, 0, 0);
                            const end = new Date(start);
                            end.setHours(23, 59, 59, 999);
                            setLimitStartDate(start.toISOString().slice(0, 16));
                            setLimitEndDate(end.toISOString().slice(0, 16));
                          }}
                        >
                          {language === "th" ? "พรุ่งนี้" : "Tomorrow"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const now = new Date();
                            const end = new Date(now);
                            end.setDate(end.getDate() + 7);
                            setLimitStartDate(now.toISOString().slice(0, 16));
                            setLimitEndDate(end.toISOString().slice(0, 16));
                          }}
                        >
                          {language === "th" ? "7 วัน" : "7 Days"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {!limitUseSchedule && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      {language === "th" 
                        ? "จะมีผลบังคับใช้ทันทีและตลอดไป" 
                        : "Will be active immediately and forever"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {language === "th" ? "รายการลิมิต" : "Betting Limits"}
                  <Badge variant="secondary">{betLimits.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingBetLimits ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : betLimits.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "th" ? "ยังไม่มีลิมิตยอดแทง" : "No betting limits set"}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "th" ? "เลข" : "Number"}</TableHead>
                        <TableHead>{language === "th" ? "ยอดสูงสุด" : "Max Amount"}</TableHead>
                        <TableHead>{language === "th" ? "ใช้กับหวย" : "Lottery Types"}</TableHead>
                        <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {betLimits.map((limit) => (
                        <TableRow key={limit.id} data-testid={`row-limit-${limit.id}`}>
                          <TableCell className="font-mono font-bold text-lg">{limit.number}</TableCell>
                          <TableCell className="font-bold text-amber-600">
                            {limit.maxAmount.toLocaleString()} ฿
                          </TableCell>
                          <TableCell>
                            {limit.lotteryTypes.length === 0 ? (
                              <Badge variant="secondary">
                                {language === "th" ? "ทุกหวย" : "All"}
                              </Badge>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {limit.lotteryTypes.slice(0, 3).map((type) => (
                                  <Badge key={type} variant="outline" className="text-xs">
                                    {lotteryTypeNames[type as LotteryType]?.[language] || type}
                                  </Badge>
                                ))}
                                {limit.lotteryTypes.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{limit.lotteryTypes.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={!!limit.isActive}
                              onCheckedChange={(checked) => 
                                updateBetLimitMutation.mutate({ id: limit.id, isActive: checked })
                              }
                              disabled={updateBetLimitMutation.isPending}
                              data-testid={`switch-limit-status-${limit.id}`}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteBetLimitMutation.mutate(limit.id)}
                              disabled={deleteBetLimitMutation.isPending}
                              data-testid={`button-delete-limit-${limit.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bet-types" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  {language === "th" ? "เปิด-ปิด ประเภทการแทง" : "Enable/Disable Bet Types"}
                </CardTitle>
                <CardDescription>
                  {language === "th" 
                    ? "เปิดหรือปิดรับแทงแต่ละประเภททั่วทั้งระบบ ทุกหวย" 
                    : "Enable or disable betting for each bet type globally across all lotteries"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBetTypeSettings ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {betTypes.map((type) => {
                      const setting = betTypeSettings.find(s => s.betType === type);
                      const isEnabled = setting?.isEnabled ?? true;
                      
                      return (
                        <Card 
                          key={type} 
                          className={`transition-all ${isEnabled ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5 opacity-70'}`}
                          data-testid={`card-bet-type-${type}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium">{betTypeNames[type][language]}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {isEnabled 
                                    ? (language === "th" ? "กำลังรับแทง" : "Accepting bets")
                                    : (language === "th" ? "ปิดรับแทง" : "Not accepting bets")
                                  }
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={(checked) => 
                                    updateBetTypeSettingMutation.mutate({ betType: type, isEnabled: checked })
                                  }
                                  disabled={updateBetTypeSettingMutation.isPending}
                                  data-testid={`switch-bet-type-${type}`}
                                />
                                {isEnabled ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {language === "th" ? "สถานะปัจจุบัน" : "Current Status"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {betTypes.map((type) => {
                    const setting = betTypeSettings.find(s => s.betType === type);
                    const isEnabled = setting?.isEnabled ?? true;
                    
                    return (
                      <Badge 
                        key={type}
                        variant={isEnabled ? "default" : "destructive"}
                        className="text-sm"
                      >
                        {betTypeNames[type][language]}: {isEnabled ? (language === "th" ? "เปิด" : "ON") : (language === "th" ? "ปิด" : "OFF")}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
