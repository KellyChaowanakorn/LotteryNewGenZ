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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Settings, Ban, Plus, Trash2, DollarSign, Shield, Users, Loader2,
  CreditCard, TrendingUp, TrendingDown, CheckCircle, XCircle, Clock,
  BarChart3, UserX, UserCheck, LineChart, PieChart, Trophy, Play,
  LogOut, ImageIcon, Calendar, CalendarCheck, CalendarX, Info,
  RefreshCw, Globe, Wifi, Landmark, ExternalLink, AlertCircle
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart as RechartsPie, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

/* =========================
   TYPES
========================= */

type UserWithoutPassword = Omit<User, "password">;

interface AdminStats {
  users: { total: number; blocked: number; active: number };
  bets: { total: number; pending: number; won: number; lost: number; totalAmount: number };
  transactions: { pendingDeposits: number; totalDeposits: number };
  affiliates: { total: number; totalCommission: number };
}

interface LotteryResult {
  id: number; lotteryType: string; drawDate: string;
  firstPrize: string | null; threeDigitTop: string | null; threeDigitBottom: string | null;
  twoDigitTop: string | null; twoDigitBottom: string | null;
  runTop: string | null; runBottom: string | null;
  isProcessed: boolean; createdAt: string;
}

interface StockResult {
  lotteryType: string; date: string; symbol: string; price: number;
  change: number; changePercent: number; twoDigit: string; threeDigit: string;
  marketState: string; source: string; error?: string;
}

interface MalaysiaResult {
  lotteryType: string; date: string; company: string;
  firstPrize: string; secondPrize: string; thirdPrize: string;
  source: string; error?: string;
}

interface ThaiGovResult {
  status: string;
  response: {
    date: string; endpoint?: string;
    prizes: Array<{ id: string; name: string; reward?: string; number: string[] }>;
    runningNumbers: Array<{ id: string; name: string; reward?: string; number: string[] }>;
  };
  error?: string;
}

interface ManualWinner {
  id: number; username: string; lotteryType: string; drawDate: string;
  betType: string; numbers: string; amount: number; winAmount: number;
  createdAt: string;
}

/* =========================
   LIVE RESULT COMPONENTS (from Results.tsx)
========================= */

function ThaiGovCard({ language }: { language: string }) {
  const { data, isLoading, refetch, isFetching } = useQuery<ThaiGovResult>({ queryKey: ["/api/results/live/thai-gov"], refetchInterval: 60000 });
  if (isLoading) return <Skeleton className="h-[300px] w-full" />;
  const result = data?.response;
  const firstPrize = result?.prizes?.find((p) => p.id === "prizeFirst")?.number?.[0];
  const twoDigit = result?.runningNumbers?.find((r) => r.id === "runningNumberBackTwo")?.number?.[0];
  const threeTop = result?.runningNumbers?.find((r) => r.id === "runningNumberFrontThree")?.number || [];
  const threeBottom = result?.runningNumbers?.find((r) => r.id === "runningNumberBackThree")?.number || [];
  return (
    <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" />{language === "th" ? "รัฐบาลไทย" : "Thai Government"}<Badge variant="outline" className="ml-1"><Wifi className="h-3 w-3 mr-1 text-green-500" />Live</Badge></CardTitle>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /></Button>
        </div>
        <CardDescription>📅 {result?.date}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data?.error ? (<Alert><AlertCircle className="h-4 w-4" /><AlertDescription>{data.error}</AlertDescription></Alert>) : (<>
          <div className="text-center p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">🏆 {language === "th" ? "รางวัลที่ 1" : "First Prize"}</p>
            <p className="text-4xl font-bold tracking-[0.2em] text-yellow-500 font-mono">{firstPrize || "------"}</p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-1">{language === "th" ? "เลขท้าย 2 ตัว" : "Last 2 Digits"}</p>
            <p className="text-3xl font-bold text-blue-500 font-mono">{twoDigit || "--"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted rounded-xl text-center">
              <p className="text-xs text-muted-foreground mb-1">{language === "th" ? "เลขหน้า 3 ตัว" : "Front 3"}</p>
              <div className="flex justify-center gap-1">{threeTop.map((n, i) => <span key={i} className="bg-background px-2 py-0.5 rounded font-mono font-bold text-sm">{n}</span>)}</div>
            </div>
            <div className="p-3 bg-muted rounded-xl text-center">
              <p className="text-xs text-muted-foreground mb-1">{language === "th" ? "เลขท้าย 3 ตัว" : "Back 3"}</p>
              <div className="flex justify-center gap-1">{threeBottom.map((n, i) => <span key={i} className="bg-background px-2 py-0.5 rounded font-mono font-bold text-sm">{n}</span>)}</div>
            </div>
          </div>
        </>)}
      </CardContent>
    </Card>
  );
}

function ThaiStockCard({ language }: { language: string }) {
  const { data, isLoading, refetch, isFetching } = useQuery<StockResult>({ queryKey: ["/api/results/live/thai-stock"], refetchInterval: 15000 });
  if (isLoading) return <Skeleton className="h-[250px] w-full" />;
  const isUp = (data?.change || 0) >= 0;
  return (
    <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" />{language === "th" ? "หุ้นไทย (SET)" : "Thai Stock (SET)"}<Badge variant={data?.marketState === "OPEN" ? "default" : "secondary"} className="ml-1">{data?.marketState === "OPEN" ? "OPEN" : "CLOSED"}</Badge></CardTitle>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /></Button>
        </div>
        <CardDescription>📅 {data?.date}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data?.error ? (<Alert><AlertCircle className="h-4 w-4" /><AlertDescription>{data.error}</AlertDescription></Alert>) : (<>
          <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-emerald-500">{data?.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className={`flex items-center ${isUp ? "text-green-500" : "text-red-500"}`}>{isUp ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}{isUp ? "+" : ""}{data?.changePercent?.toFixed(2)}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-center"><p className="text-xs text-muted-foreground mb-1">3 ตัว</p><p className="text-2xl font-bold text-emerald-500 font-mono">{data?.threeDigit}</p></div>
            <div className="p-3 bg-orange-500/10 rounded-xl text-center"><p className="text-xs text-muted-foreground mb-1">2 ตัว</p><p className="text-2xl font-bold text-orange-500 font-mono">{data?.twoDigit}</p></div>
          </div>
        </>)}
      </CardContent>
    </Card>
  );
}

function MalaysiaCards({ language }: { language: string }) {
  const { data, isLoading, refetch, isFetching } = useQuery<MalaysiaResult[]>({ queryKey: ["/api/results/live/malaysia"], refetchInterval: 60000 });
  if (isLoading) return <Skeleton className="h-[200px] w-full" />;
  return (<>{data?.map((result, idx) => (
    <Card key={idx} className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4 text-purple-500" />{result.company}</CardTitle><CardDescription>📅 {result.date}</CardDescription></CardHeader>
      <CardContent>{result.error ? (<Alert><AlertDescription>{result.error}</AlertDescription></Alert>) : (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-yellow-500/20 rounded-lg"><p className="text-xs text-muted-foreground">1st</p><p className="text-lg font-bold text-yellow-500 font-mono">{result.firstPrize}</p></div>
          <div className="p-2 bg-gray-500/20 rounded-lg"><p className="text-xs text-muted-foreground">2nd</p><p className="text-lg font-bold font-mono">{result.secondPrize}</p></div>
          <div className="p-2 bg-orange-500/20 rounded-lg"><p className="text-xs text-muted-foreground">3rd</p><p className="text-lg font-bold text-orange-500 font-mono">{result.thirdPrize}</p></div>
        </div>
      )}</CardContent>
    </Card>
  ))}<Button variant="outline" className="w-full" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button></>);
}

function InternationalStockCards({ language }: { language: string }) {
  const { data, isLoading, refetch, isFetching } = useQuery<StockResult[]>({ queryKey: ["/api/results/live/stocks"], refetchInterval: 30000 });
  if (isLoading) return <Skeleton className="h-[200px] w-full" />;
  const stocks = data?.filter(s => s.lotteryType !== "THAI_STOCK") || [];
  const stockNames: Record<string, string> = { STOCK_NIKKEI: "🇯🇵 นิเคอิ", STOCK_HSI: "🇭🇰 ฮั่งเส็ง", STOCK_DOW: "🇺🇸 ดาวโจนส์" };
  return (<>{stocks.map((stock) => {
    const isUp = stock.change >= 0;
    return (
      <Card key={stock.lotteryType} className="border-blue-500/30">
        <CardHeader className="pb-3"><CardTitle className="flex items-center justify-between text-base"><span>{stockNames[stock.lotteryType] || stock.symbol}</span><Badge variant={stock.marketState === "REGULAR" ? "default" : "secondary"}>{stock.marketState === "REGULAR" ? "OPEN" : "CLOSED"}</Badge></CardTitle><CardDescription>📅 {stock.date}</CardDescription></CardHeader>
        <CardContent className="space-y-3">{stock.error ? (<Alert><AlertDescription>{stock.error}</AlertDescription></Alert>) : (<>
          <div className="flex items-baseline gap-2"><span className="text-2xl font-bold">{stock.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span><span className={`flex items-center text-sm ${isUp ? "text-green-500" : "text-red-500"}`}>{isUp ? "+" : ""}{stock.changePercent?.toFixed(2)}%</span></div>
          <div className="grid grid-cols-2 gap-2"><div className="p-2 bg-primary/10 rounded-lg text-center"><p className="text-xs text-muted-foreground">3 ตัว</p><p className="text-xl font-bold font-mono text-primary">{stock.threeDigit}</p></div><div className="p-2 bg-muted rounded-lg text-center"><p className="text-xs text-muted-foreground">2 ตัว</p><p className="text-xl font-bold font-mono">{stock.twoDigit}</p></div></div>
        </>)}</CardContent>
      </Card>
    );
  })}<Button variant="outline" className="w-full" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button></>);
}

/* =========================
   MAIN ADMIN COMPONENT
========================= */

export default function Admin() {
  const { language, t } = useI18n();
  const { isAdminAuthenticated, checkAdminStatus, logout } = useAdmin();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => { const v = async () => { setIsCheckingAuth(true); await checkAdminStatus(); setIsCheckingAuth(false); }; v(); }, [checkAdminStatus]);

  // Existing states
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
  const [blockedUseSchedule, setBlockedUseSchedule] = useState(false);
  const [blockedStartDate, setBlockedStartDate] = useState("");
  const [blockedEndDate, setBlockedEndDate] = useState("");
  const [limitUseSchedule, setLimitUseSchedule] = useState(false);
  const [limitStartDate, setLimitStartDate] = useState("");
  const [limitEndDate, setLimitEndDate] = useState("");
  // ★ Live results tab state
  const [liveResultsTab, setLiveResultsTab] = useState("thai-gov");
  // ★ Manual winners state
  const [manualWinners, setManualWinners] = useState<ManualWinner[]>([]);
  const [winnerUsername, setWinnerUsername] = useState("");
  const [winnerLotteryType, setWinnerLotteryType] = useState<LotteryType | "">("");
  const [winnerDrawDate, setWinnerDrawDate] = useState(new Date().toISOString().split('T')[0]);
  const [winnerBetType, setWinnerBetType] = useState<BetType | "">("");
  const [winnerNumbers, setWinnerNumbers] = useState("");
  const [winnerAmount, setWinnerAmount] = useState("");
  const [winnerWinAmount, setWinnerWinAmount] = useState("");

  const handleLogout = async () => { await logout(); toast({ title: language === "th" ? "ออกจากระบบแล้ว" : "Logged out" }); setLocation("/admin/login"); };

  // ★ Manual winner handlers
  const handleAddManualWinner = () => {
    if (!winnerUsername || !winnerLotteryType || !winnerBetType || !winnerNumbers || !winnerAmount || !winnerWinAmount) {
      toast({ title: language === "th" ? "กรุณากรอกข้อมูลให้ครบ" : "Please fill all fields", variant: "destructive" });
      return;
    }
    const newWinner: ManualWinner = {
      id: Date.now(),
      username: winnerUsername,
      lotteryType: winnerLotteryType,
      drawDate: winnerDrawDate,
      betType: winnerBetType,
      numbers: winnerNumbers,
      amount: parseFloat(winnerAmount),
      winAmount: parseFloat(winnerWinAmount),
      createdAt: new Date().toISOString(),
    };
    setManualWinners(prev => [newWinner, ...prev]);
    setWinnerUsername(""); setWinnerNumbers(""); setWinnerAmount(""); setWinnerWinAmount("");
    toast({ title: language === "th" ? "เพิ่มผู้ถูกรางวัลแล้ว" : "Winner added" });
  };

  const handleDeleteManualWinner = (id: number) => {
    setManualWinners(prev => prev.filter(w => w.id !== id));
    toast({ title: language === "th" ? "ลบแล้ว" : "Deleted" });
  };

  // All existing queries
  const { data: blockedNumbers = [], isLoading } = useQuery<BlockedNumber[]>({ queryKey: ["/api/blocked-numbers"], enabled: isAdminAuthenticated });
  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery<UserWithoutPassword[]>({ queryKey: ["/api/admin/users"], enabled: isAdminAuthenticated });
  // ★ Online/Offline heartbeat tracking
  const { data: onlineUsers = {} } = useQuery<Record<number, boolean>>({ queryKey: ["/api/admin/online-users"], refetchInterval: 15000, enabled: isAdminAuthenticated });
  const { data: allTransactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({ queryKey: ["/api/transactions"], enabled: isAdminAuthenticated });
  const { data: allBets = [], isLoading: isLoadingBets } = useQuery<Bet[]>({ queryKey: ["/api/bets"], enabled: isAdminAuthenticated });
  const { data: stats } = useQuery<AdminStats>({ queryKey: ["/api/admin/stats"], refetchInterval: 30000, enabled: isAdminAuthenticated });
  const { data: lotteryResults = [], isLoading: isLoadingResults } = useQuery<LotteryResult[]>({ queryKey: ["/api/lottery-results"], enabled: isAdminAuthenticated });
  const { data: payoutSettings = [], isLoading: isLoadingPayoutRates, isError: isPayoutRatesError } = useQuery<PayoutSetting[]>({ queryKey: ["/api/payout-rates"], enabled: isAdminAuthenticated });
  const { data: betLimits = [], isLoading: isLoadingBetLimits } = useQuery<BetLimitWithLotteryTypes[]>({ queryKey: ["/api/bet-limits"], enabled: isAdminAuthenticated });

  interface BetTypeSetting { id: number; betType: string; isEnabled: boolean; updatedAt: string; }
  const { data: betTypeSettings = [], isLoading: isLoadingBetTypeSettings } = useQuery<BetTypeSetting[]>({ queryKey: ["/api/bet-type-settings"], enabled: isAdminAuthenticated });

  // All existing mutations
  const updateBetTypeSettingMutation = useMutation({
    mutationFn: async ({ betType, isEnabled }: { betType: string; isEnabled: boolean }) => { const res = await apiRequest("PATCH", `/api/bet-type-settings/${betType}`, { isEnabled }); return res.json(); },
    onSuccess: (_, v) => { queryClient.invalidateQueries({ queryKey: ["/api/bet-type-settings"] }); toast({ title: v.isEnabled ? (language === "th" ? "เปิดรับแทงประเภทนี้แล้ว" : "Enabled") : (language === "th" ? "ปิดรับแทงประเภทนี้แล้ว" : "Disabled") }); },
    onError: () => { toast({ title: language === "th" ? "เกิดข้อผิดพลาด" : "Error", variant: "destructive" }); }
  });

  const addBlockedMutation = useMutation({
    mutationFn: async (data: { lotteryType: string; number: string; betType: string | null; startDate?: string | null; endDate?: string | null }) => { const res = await apiRequest("POST", "/api/blocked-numbers", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/blocked-numbers"] }); setNewNumber(""); setBlockedUseSchedule(false); setBlockedStartDate(""); setBlockedEndDate(""); toast({ title: language === "th" ? "เพิ่มเลขอั้นสำเร็จ" : "Added" }); },
    onError: () => { toast({ title: language === "th" ? "เกิดข้อผิดพลาด" : "Error", variant: "destructive" }); }
  });

  const updateBlockedMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean | number }) => { const res = await apiRequest("PATCH", `/api/blocked-numbers/${id}`, { isActive: isActive ? 1 : 0 }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/blocked-numbers"] }); }
  });

  const deleteBlockedMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest("DELETE", `/api/blocked-numbers/${id}`); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/blocked-numbers"] }); toast({ title: language === "th" ? "ลบเลขอั้นแล้ว" : "Removed" }); }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, isBlocked }: { id: number; isBlocked: boolean }) => { const res = await apiRequest("PATCH", `/api/admin/users/${id}`, { isBlocked }); return res.json(); },
    onSuccess: (_, v) => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] }); toast({ title: v.isBlocked ? (language === "th" ? "ระงับผู้ใช้แล้ว" : "Blocked") : (language === "th" ? "ปลดระงับแล้ว" : "Unblocked") }); }
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => { const res = await apiRequest("PATCH", `/api/transactions/${id}`, { status }); return res.json(); },
    onSuccess: (_, v) => { queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: v.status === "approved" ? (language === "th" ? "อนุมัติแล้ว" : "Approved") : (language === "th" ? "ปฏิเสธแล้ว" : "Rejected") }); }
  });

  const createResultMutation = useMutation({
    mutationFn: async (data: { lotteryType: string; drawDate: string; firstPrize?: string; threeDigitTop?: string; threeDigitBottom?: string; twoDigitTop?: string; twoDigitBottom?: string }) => { const res = await apiRequest("POST", "/api/lottery-results", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/lottery-results"] }); setResultFirstPrize(""); setResultThreeTop(""); setResultThreeBottom(""); setResultTwoTop(""); setResultTwoBottom(""); toast({ title: language === "th" ? "บันทึกผลหวยสำเร็จ" : "Saved" }); },
    onError: () => { toast({ title: language === "th" ? "เกิดข้อผิดพลาด" : "Error", variant: "destructive" }); }
  });

  const processResultMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest("POST", `/api/lottery-results/${id}/process`); return res.json(); },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ["/api/lottery-results"] }); queryClient.invalidateQueries({ queryKey: ["/api/bets"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] }); toast({ title: language === "th" ? `ประมวลผลแล้ว: ถูก ${data.won}, ไม่ถูก ${data.lost}` : `Processed: ${data.won} won, ${data.lost} lost` }); },
    onError: () => { toast({ title: language === "th" ? "เกิดข้อผิดพลาด" : "Error", variant: "destructive" }); }
  });

  const updatePayoutRateMutation = useMutation({
    mutationFn: async ({ betType, rate }: { betType: string; rate: number }) => { const res = await apiRequest("PATCH", `/api/payout-rates/${betType}`, { rate }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/payout-rates"] }); setEditingPayoutRate(null); setEditedRate(""); toast({ title: language === "th" ? "อัปเดตอัตราจ่ายแล้ว" : "Updated" }); },
    onError: () => { toast({ title: language === "th" ? "เกิดข้อผิดพลาด" : "Error", variant: "destructive" }); }
  });

  const addBetLimitMutation = useMutation({
    mutationFn: async (data: { number: string; maxAmount: number; lotteryTypes: string[]; startDate?: string | null; endDate?: string | null }) => { const res = await apiRequest("POST", "/api/bet-limits", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/bet-limits"] }); setLimitNumber(""); setLimitMaxAmount(""); setLimitLotteryTypes([]); setIsAllLotteryTypes(true); setLimitUseSchedule(false); setLimitStartDate(""); setLimitEndDate(""); toast({ title: language === "th" ? "เพิ่มลิมิตสำเร็จ" : "Added" }); },
    onError: () => { toast({ title: language === "th" ? "เกิดข้อผิดพลาด" : "Error", variant: "destructive" }); }
  });

  const updateBetLimitMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean | number }) => { const res = await apiRequest("PATCH", `/api/bet-limits/${id}`, { isActive: isActive ? 1 : 0 }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/bet-limits"] }); }
  });

  const deleteBetLimitMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest("DELETE", `/api/bet-limits/${id}`); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/bet-limits"] }); toast({ title: language === "th" ? "ลบลิมิตแล้ว" : "Removed" }); }
  });

  // ★ Manual bet status update (admin tick won/lost)
  const updateBetStatusMutation = useMutation({
    mutationFn: async ({ betId, status }: { betId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bets/${betId}`, { status });
      return res.json();
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: v.status === "won" ? (language === "th" ? "✅ เปลี่ยนเป็นถูกรางวัลแล้ว" : "Marked as won") : (language === "th" ? "❌ เปลี่ยนเป็นไม่ถูกแล้ว" : "Marked as lost") });
    },
    onError: () => { toast({ title: language === "th" ? "เกิดข้อผิดพลาด" : "Error", variant: "destructive" }); }
  });

  // Charts data
  const chartColors = ["hsl(var(--primary))","hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))","hsl(var(--chart-5))","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#14B8A6","#F97316"];

  const bettingByLotteryData = useMemo(() => {
    const g: Record<string, { amount: number; count: number }> = {};
    allBets.forEach(b => { if (!g[b.lotteryType]) g[b.lotteryType] = { amount: 0, count: 0 }; g[b.lotteryType].amount += b.amount; g[b.lotteryType].count += 1; });
    return Object.entries(g).map(([t, d]) => ({ name: lotteryTypeNames[t as LotteryType]?.[language] || t, value: d.amount, count: d.count }));
  }, [allBets, language]);

  const betTypeDistribution = useMemo(() => {
    const g: Record<string, number> = {};
    allBets.forEach(b => { g[b.betType] = (g[b.betType] || 0) + b.amount; });
    return Object.entries(g).map(([t, a]) => ({ name: betTypeNames[t as BetType]?.[language] || t, value: a }));
  }, [allBets, language]);

  const hotNumbers = useMemo(() => {
    const c: Record<string, number> = {};
    allBets.forEach(b => { c[b.numbers] = (c[b.numbers] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, ct]) => ({ number: n, count: ct }));
  }, [allBets]);

  const dailyBettingData = useMemo(() => {
    const d: Record<string, { date: string; amount: number; count: number }> = {};
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); const s = dt.toISOString().split('T')[0]; days.push(s); d[s] = { date: s, amount: 0, count: 0 }; }
    allBets.forEach(b => { const bd = new Date(b.createdAt).toISOString().split('T')[0]; if (d[bd]) { d[bd].amount += b.amount; d[bd].count += 1; } });
    return days.map(date => ({ ...d[date], displayDate: new Date(date).toLocaleDateString(language === "th" ? "th-TH" : "en-US", { weekday: 'short', day: 'numeric' }) }));
  }, [allBets, language]);

  const affiliatePerformance = useMemo(() => allUsers.filter(u => u.affiliateEarnings > 0).sort((a, b) => b.affiliateEarnings - a.affiliateEarnings).slice(0, 10).map(u => ({ username: u.username, earnings: u.affiliateEarnings })), [allUsers]);

  const pendingDeposits = allTransactions.filter(t => t.type === "deposit" && t.status === "pending");
  const filteredBets = betFilter === "all" ? allBets : allBets.filter(b => b.status === betFilter);

  const getPayoutRate = (bt: string): number | null => { const s = payoutSettings.find(s => s.betType === bt); return s ? s.rate : null; };
  const handleSavePayoutRate = (bt: string) => { const r = parseFloat(editedRate); if (isNaN(r) || r <= 0 || r > 10000) { toast({ title: language === "th" ? "กรุณากรอกตัวเลขที่ถูกต้อง" : "Invalid", variant: "destructive" }); return; } updatePayoutRateMutation.mutate({ betType: bt, rate: r }); };
  const handleStartEditPayoutRate = (bt: string) => { const r = getPayoutRate(bt); setEditingPayoutRate(bt); setEditedRate(r !== null ? r.toString() : ""); };
  const handleCancelEditPayoutRate = () => { setEditingPayoutRate(null); setEditedRate(""); };
  const getUsernameById = (uid: number) => { const u = allUsers.find(u => u.id === uid); return u?.username || `User #${uid}`; };

  const handleAddBlocked = () => { if (!newLotteryType || !newNumber) { toast({ title: language === "th" ? "ข้อมูลไม่ครบ" : "Missing info", variant: "destructive" }); return; } addBlockedMutation.mutate({ lotteryType: newLotteryType, number: newNumber, betType: newBetType === "all" ? null : newBetType, startDate: blockedUseSchedule && blockedStartDate ? blockedStartDate : null, endDate: blockedUseSchedule && blockedEndDate ? blockedEndDate : null }); };
  const handleToggleBlocked = (id: number, isActive: boolean | number) => { updateBlockedMutation.mutate({ id, isActive: !isActive }); };
  const handleDeleteBlocked = (id: number) => { deleteBlockedMutation.mutate(id); };
  const handleToggleUserBlock = (uid: number, isBlocked: number | boolean) => { updateUserMutation.mutate({ id: uid, isBlocked: !isBlocked }); };
  const handleApproveTransaction = (tx: Transaction) => { updateTransactionMutation.mutate({ id: tx.id, status: "approved" }); };
  const handleRejectTransaction = (tx: Transaction) => { updateTransactionMutation.mutate({ id: tx.id, status: "rejected" }); };
  const handleCreateResult = () => { if (!resultLotteryType || !resultDrawDate || !resultFirstPrize) { toast({ title: language === "th" ? "กรุณากรอกข้อมูลให้ครบ" : "Fill required fields", variant: "destructive" }); return; } createResultMutation.mutate({ lotteryType: resultLotteryType, drawDate: resultDrawDate, firstPrize: resultFirstPrize, threeDigitTop: resultThreeTop || undefined, threeDigitBottom: resultThreeBottom || undefined, twoDigitTop: resultTwoTop || resultFirstPrize.slice(-2), twoDigitBottom: resultTwoBottom || undefined }); };
  const handleProcessResult = (id: number) => { processResultMutation.mutate(id); };

  // Auth checks
  if (isCheckingAuth) return (<div className="min-h-full flex items-center justify-center p-4"><Card className="w-full max-w-md text-center"><CardContent className="p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /><p className="mt-4 text-muted-foreground">{language === "th" ? "กำลังตรวจสอบสิทธิ์..." : "Verifying..."}</p></CardContent></Card></div>);
  if (!isAdminAuthenticated) return (<div className="min-h-full flex items-center justify-center p-4"><Card className="w-full max-w-md text-center"><CardHeader><div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4"><Shield className="h-8 w-8 text-primary" /></div><CardTitle>{t("admin.title")}</CardTitle></CardHeader><CardContent><Button className="w-full" asChild><a href="/admin/login">{t("admin.login")}</a></Button></CardContent></Card></div>);

  return (
    <div className="min-h-full">
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 md:p-6 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl"><Settings className="h-6 w-6 text-primary" /></div>
            <div><h1 className="text-xl md:text-2xl font-bold">{t("admin.title")}</h1><p className="text-sm text-muted-foreground">{language === "th" ? "จัดการระบบ ผู้ใช้ และธุรกรรม" : "Manage system"}</p></div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2"><LogOut className="h-4 w-4" />{language === "th" ? "ออกจากระบบ" : "Logout"}</Button>
        </div>
      </div>

      {stats && (
        <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{language === "th" ? "ผู้ใช้ทั้งหมด" : "Users"}</p><p className="text-2xl font-bold">{stats.users.total}</p></div><Users className="h-8 w-8 text-blue-500 opacity-50" /></div></CardContent></Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{language === "th" ? "ยอดแทงทั้งหมด" : "Bets"}</p><p className="text-2xl font-bold">{stats.bets.totalAmount.toLocaleString()}</p></div><TrendingUp className="h-8 w-8 text-green-500 opacity-50" /></div></CardContent></Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{language === "th" ? "รอดำเนินการ" : "Pending"}</p><p className="text-2xl font-bold">{stats.transactions.pendingDeposits}</p></div><Clock className="h-8 w-8 text-yellow-500 opacity-50" /></div></CardContent></Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{language === "th" ? "คอมมิชชั่น" : "Commission"}</p><p className="text-2xl font-bold">{stats.affiliates.totalCommission.toLocaleString()}</p></div><BarChart3 className="h-8 w-8 text-purple-500 opacity-50" /></div></CardContent></Card>
        </div>
      )}

      <div className="p-4 md:p-6 pt-0">
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="transactions" className="gap-1 text-xs sm:text-sm"><CreditCard className="h-4 w-4" /><span className="hidden sm:inline">{language === "th" ? "ธุรกรรม" : "Trans"}</span>{pendingDeposits.length > 0 && <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{pendingDeposits.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="results" className="gap-1 text-xs sm:text-sm"><Trophy className="h-4 w-4" /><span className="hidden sm:inline">{language === "th" ? "ผลหวย" : "Results"}</span></TabsTrigger>
            <TabsTrigger value="winners" className="gap-1 text-xs sm:text-sm"><CheckCircle className="h-4 w-4" /><span className="hidden sm:inline">{language === "th" ? "ผู้ถูกรางวัล" : "Winners"}</span></TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs sm:text-sm"><Users className="h-4 w-4" /><span className="hidden sm:inline">{language === "th" ? "ผู้ใช้" : "Users"}</span></TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1 text-xs sm:text-sm"><LineChart className="h-4 w-4" /><span className="hidden sm:inline">{language === "th" ? "วิเคราะห์" : "Charts"}</span></TabsTrigger>
            <TabsTrigger value="bets" className="gap-1 text-xs sm:text-sm"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">{language === "th" ? "รายงาน" : "Bets"}</span></TabsTrigger>
            <TabsTrigger value="blocked" className="gap-1 text-xs sm:text-sm"><Ban className="h-4 w-4" /><span className="hidden sm:inline">{language === "th" ? "อั้น" : "Block"}</span></TabsTrigger>
            <TabsTrigger value="limits" className="gap-1 text-xs sm:text-sm"><Shield className="h-4 w-4" /><span className="hidden sm:inline">{language === "th" ? "ลิมิต" : "Limits"}</span></TabsTrigger>
            <TabsTrigger value="bet-types" className="gap-1 text-xs sm:text-sm"><Play className="h-4 w-4" /><span className="hidden sm:inline">{language === "th" ? "ประเภท" : "Types"}</span></TabsTrigger>
          </TabsList>

          {/* ==================== TRANSACTIONS ==================== */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5" />{language === "th" ? "รายการฝากรอดำเนินการ" : "Pending Deposits"}{pendingDeposits.length > 0 && <Badge variant="destructive">{pendingDeposits.length}</Badge>}</CardTitle></CardHeader>
              <CardContent className="p-0">
                {isLoadingTransactions ? (<div className="p-4 space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-16 w-full"/>)}</div>) : pendingDeposits.length === 0 ? (<div className="p-8 text-center text-muted-foreground"><CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{language === "th" ? "ไม่มีรายการรอดำเนินการ" : "No pending"}</p></div>) : (
                  <Table><TableHeader><TableRow><TableHead>{language === "th" ? "ผู้ใช้" : "User"}</TableHead><TableHead>{language === "th" ? "จำนวน" : "Amount"}</TableHead><TableHead>{language === "th" ? "สลิป" : "Slip"}</TableHead><TableHead>{language === "th" ? "อ้างอิง" : "Ref"}</TableHead><TableHead>{language === "th" ? "วันที่" : "Date"}</TableHead><TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead></TableRow></TableHeader>
                  <TableBody>{pendingDeposits.map(tx => (<TableRow key={tx.id}><TableCell className="font-medium">{getUsernameById(tx.userId)}</TableCell><TableCell className="font-bold text-green-600">+{tx.amount.toLocaleString()} ฿</TableCell><TableCell>{tx.slipUrl ? (<Dialog><DialogTrigger asChild><Button size="sm" variant="outline"><ImageIcon className="h-4 w-4 mr-1" />{language === "th" ? "ดูสลิป" : "View"}</Button></DialogTrigger><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{language === "th" ? "สลิปการโอนเงิน" : "Slip"}</DialogTitle></DialogHeader><img src={tx.slipUrl} alt="Slip" className="w-full rounded-lg border" /></DialogContent></Dialog>) : <span className="text-muted-foreground text-xs">{language === "th" ? "ไม่มีสลิป" : "No slip"}</span>}</TableCell><TableCell className="font-mono text-xs">{tx.reference}</TableCell><TableCell className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button size="sm" onClick={() => handleApproveTransaction(tx)} disabled={updateTransactionMutation.isPending}><CheckCircle className="h-4 w-4 mr-1" />{language === "th" ? "อนุมัติ" : "OK"}</Button><Button size="sm" variant="destructive" onClick={() => handleRejectTransaction(tx)} disabled={updateTransactionMutation.isPending}><XCircle className="h-4 w-4 mr-1" />{language === "th" ? "ปฏิเสธ" : "No"}</Button></div></TableCell></TableRow>))}</TableBody></Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== ★ RESULTS - LIVE + MANUAL ==================== */}
          <TabsContent value="results" className="space-y-4">
            {/* Live Results - เหมือนหน้า /results */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-green-500" />
                  {language === "th" ? "ผลหวยสด (Live)" : "Live Lottery Results"}
                </CardTitle>
                <CardDescription>{language === "th" ? "ผลหวย 6 ชนิดแบบเรียลไทม์" : "6 lottery types, real-time"}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={liveResultsTab} onValueChange={setLiveResultsTab}>
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="thai-gov" className="gap-1 text-xs"><Landmark className="h-3 w-3" />{language === "th" ? "หวยไทย" : "Thai"}</TabsTrigger>
                    <TabsTrigger value="thai-stock" className="gap-1 text-xs"><TrendingUp className="h-3 w-3" />{language === "th" ? "หุ้นไทย" : "SET"}</TabsTrigger>
                    <TabsTrigger value="malaysia" className="gap-1 text-xs"><Globe className="h-3 w-3" />{language === "th" ? "มาเลย์" : "MY"}</TabsTrigger>
                    <TabsTrigger value="intl-stock" className="gap-1 text-xs"><TrendingUp className="h-3 w-3" />{language === "th" ? "ตปท" : "Intl"}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="thai-gov"><ThaiGovCard language={language} /></TabsContent>
                  <TabsContent value="thai-stock"><ThaiStockCard language={language} /></TabsContent>
                  <TabsContent value="malaysia"><div className="grid gap-3 md:grid-cols-3"><MalaysiaCards language={language} /></div></TabsContent>
                  <TabsContent value="intl-stock"><div className="grid gap-3 md:grid-cols-3"><InternationalStockCards language={language} /></div></TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Manual Result Entry */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5" />{language === "th" ? "บันทึกผลหวย (Manual)" : "Add Result (Manual)"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                  <div className="space-y-2"><Label>{language === "th" ? "ประเภทหวย" : "Type"}</Label><Select value={resultLotteryType} onValueChange={(v) => setResultLotteryType(v as LotteryType)}><SelectTrigger><SelectValue placeholder={language === "th" ? "เลือกหวย" : "Select"} /></SelectTrigger><SelectContent>{lotteryTypes.map(t => <SelectItem key={t} value={t}>{lotteryTypeNames[t][language]}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>{language === "th" ? "วันที่ออก" : "Date"}</Label><Input type="date" value={resultDrawDate} onChange={e => setResultDrawDate(e.target.value)} /></div>
                  <div className="space-y-2"><Label>{language === "th" ? "รางวัลที่ 1" : "1st Prize"}</Label><Input value={resultFirstPrize} onChange={e => setResultFirstPrize(e.target.value.replace(/[^0-9]/g,""))} placeholder="123456" className="font-mono" maxLength={6} /></div>
                  <div className="space-y-2"><Label>{language === "th" ? "3 ตัวหน้า" : "3 Front"}</Label><Input value={resultThreeTop} onChange={e => setResultThreeTop(e.target.value.replace(/[^0-9]/g,""))} placeholder="123" className="font-mono" maxLength={3} /></div>
                  <div className="space-y-2"><Label>{language === "th" ? "3 ตัวล่าง" : "3 Bottom"}</Label><Input value={resultThreeBottom} onChange={e => setResultThreeBottom(e.target.value.replace(/[^0-9]/g,""))} placeholder="456" className="font-mono" maxLength={3} /></div>
                  <div className="space-y-2"><Label>{language === "th" ? "2 ตัวล่าง" : "2 Bottom"}</Label><Input value={resultTwoBottom} onChange={e => setResultTwoBottom(e.target.value.replace(/[^0-9]/g,""))} placeholder="00" className="font-mono" maxLength={2} /></div>
                </div>
                <Button onClick={handleCreateResult} className="w-full gap-2" disabled={createResultMutation.isPending}>{createResultMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{language === "th" ? "บันทึกผลหวย" : "Save"}</Button>
              </CardContent>
            </Card>

            {/* Saved Results Table */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5" />{language === "th" ? "รายการผลหวยที่บันทึก" : "Saved Results"}<Badge variant="secondary">{lotteryResults.length}</Badge></CardTitle></CardHeader>
              <CardContent className="p-0">
                {isLoadingResults ? (<div className="p-4 space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-12 w-full"/>)}</div>) : lotteryResults.length === 0 ? (<div className="p-8 text-center text-muted-foreground"><Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{language === "th" ? "ยังไม่มีผลหวย" : "No results"}</p></div>) : (
                  <Table><TableHeader><TableRow><TableHead>{language === "th" ? "หวย" : "Lottery"}</TableHead><TableHead>{language === "th" ? "วันที่" : "Date"}</TableHead><TableHead>{language === "th" ? "รางวัลที่ 1" : "1st"}</TableHead><TableHead>{language === "th" ? "2 ตัวล่าง" : "2D"}</TableHead><TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead><TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead></TableRow></TableHeader>
                  <TableBody>{lotteryResults.map(r => (<TableRow key={r.id}><TableCell><Badge variant="secondary">{lotteryTypeNames[r.lotteryType as LotteryType]?.[language] || r.lotteryType}</Badge></TableCell><TableCell className="font-mono">{r.drawDate}</TableCell><TableCell className="font-mono font-bold text-lg text-primary">{r.firstPrize || "-"}</TableCell><TableCell className="font-mono font-bold">{r.twoDigitBottom || "-"}</TableCell><TableCell>{r.isProcessed ? <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" />{language === "th" ? "ประมวลผลแล้ว" : "Done"}</Badge> : <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{language === "th" ? "รอ" : "Pending"}</Badge>}</TableCell><TableCell className="text-right">{!r.isProcessed && <Button size="sm" onClick={() => handleProcessResult(r.id)} disabled={processResultMutation.isPending}><Play className="h-4 w-4 mr-1" />{language === "th" ? "ประมวลผล" : "Process"}</Button>}</TableCell></TableRow>))}</TableBody></Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== ★ WINNERS - MANUAL ADD ==================== */}
          <TabsContent value="winners" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5" />{language === "th" ? "เพิ่มผู้ถูกรางวัล (Manual)" : "Add Winner (Manual)"}</CardTitle>
                <CardDescription>{language === "th" ? "เพิ่มรายชื่อผู้ถูกรางวัลด้วยตนเอง" : "Manually add winner records"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div className="space-y-2"><Label>{language === "th" ? "ชื่อผู้ใช้" : "Username"}</Label><Input value={winnerUsername} onChange={e => setWinnerUsername(e.target.value)} placeholder={language === "th" ? "ชื่อผู้ใช้" : "Username"} /></div>
                  <div className="space-y-2"><Label>{language === "th" ? "ประเภทหวย" : "Lottery"}</Label><Select value={winnerLotteryType} onValueChange={v => setWinnerLotteryType(v as LotteryType)}><SelectTrigger><SelectValue placeholder={language === "th" ? "เลือก" : "Select"} /></SelectTrigger><SelectContent>{lotteryTypes.map(t => <SelectItem key={t} value={t}>{lotteryTypeNames[t][language]}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>{language === "th" ? "งวดวันที่" : "Draw Date"}</Label><Input type="date" value={winnerDrawDate} onChange={e => setWinnerDrawDate(e.target.value)} /></div>
                  <div className="space-y-2"><Label>{language === "th" ? "ประเภทแทง" : "Bet Type"}</Label><Select value={winnerBetType} onValueChange={v => setWinnerBetType(v as BetType)}><SelectTrigger><SelectValue placeholder={language === "th" ? "เลือก" : "Select"} /></SelectTrigger><SelectContent>{betTypes.map(t => <SelectItem key={t} value={t}>{betTypeNames[t][language]}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2"><Label>{language === "th" ? "เลขที่ถูก" : "Winning Numbers"}</Label><Input value={winnerNumbers} onChange={e => setWinnerNumbers(e.target.value.replace(/[^0-9]/g,""))} placeholder="123" className="font-mono" /></div>
                  <div className="space-y-2"><Label>{language === "th" ? "ยอดเดิมพัน (฿)" : "Bet Amount"}</Label><Input type="number" value={winnerAmount} onChange={e => setWinnerAmount(e.target.value)} placeholder="100" /></div>
                  <div className="space-y-2"><Label>{language === "th" ? "เงินรางวัล (฿)" : "Win Amount"}</Label><Input type="number" value={winnerWinAmount} onChange={e => setWinnerWinAmount(e.target.value)} placeholder="90000" /></div>
                </div>
                <Button onClick={handleAddManualWinner} className="w-full gap-2"><Plus className="h-4 w-4" />{language === "th" ? "เพิ่มผู้ถูกรางวัล" : "Add Winner"}</Button>
              </CardContent>
            </Card>

            {/* Manual Winners List */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" />{language === "th" ? "รายชื่อผู้ถูกรางวัล" : "Winners List"}<Badge variant="secondary">{manualWinners.length}</Badge></CardTitle></CardHeader>
              <CardContent className="p-0">
                {manualWinners.length === 0 ? (<div className="p-8 text-center text-muted-foreground"><Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{language === "th" ? "ยังไม่มีผู้ถูกรางวัล" : "No winners yet"}</p></div>) : (
                  <Table><TableHeader><TableRow><TableHead>{language === "th" ? "ผู้ใช้" : "User"}</TableHead><TableHead>{language === "th" ? "หวย" : "Lottery"}</TableHead><TableHead>{language === "th" ? "งวด" : "Date"}</TableHead><TableHead>{language === "th" ? "ประเภท" : "Type"}</TableHead><TableHead>{language === "th" ? "เลข" : "Number"}</TableHead><TableHead>{language === "th" ? "เดิมพัน" : "Bet"}</TableHead><TableHead>{language === "th" ? "เงินรางวัล" : "Win"}</TableHead><TableHead className="text-right">{language === "th" ? "ลบ" : "Del"}</TableHead></TableRow></TableHeader>
                  <TableBody>{manualWinners.map(w => (<TableRow key={w.id}><TableCell className="font-medium">{w.username}</TableCell><TableCell><Badge variant="secondary">{lotteryTypeNames[w.lotteryType as LotteryType]?.[language] || w.lotteryType}</Badge></TableCell><TableCell className="font-mono text-sm">{w.drawDate}</TableCell><TableCell>{betTypeNames[w.betType as BetType]?.[language] || w.betType}</TableCell><TableCell className="font-mono font-bold">{w.numbers}</TableCell><TableCell>{w.amount.toLocaleString()} ฿</TableCell><TableCell className="font-bold text-green-600">{w.winAmount.toLocaleString()} ฿</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDeleteManualWinner(w.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody></Table>
                )}
              </CardContent>
            </Card>

            {/* Summary Card */}
            {manualWinners.length > 0 && (
              <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-xs text-muted-foreground">{language === "th" ? "จำนวนผู้ถูกรางวัล" : "Winners"}</p><p className="text-2xl font-bold">{manualWinners.length}</p></div>
                    <div><p className="text-xs text-muted-foreground">{language === "th" ? "ยอดเดิมพันรวม" : "Total Bets"}</p><p className="text-2xl font-bold">{manualWinners.reduce((s,w) => s+w.amount, 0).toLocaleString()} ฿</p></div>
                    <div><p className="text-xs text-muted-foreground">{language === "th" ? "เงินรางวัลรวม" : "Total Payout"}</p><p className="text-2xl font-bold text-green-600">{manualWinners.reduce((s,w) => s+w.winAmount, 0).toLocaleString()} ฿</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ==================== USERS ==================== */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" />{language === "th" ? "รายชื่อผู้ใช้" : "Users"}<Badge variant="secondary">{allUsers.length}</Badge></CardTitle></CardHeader>
              <CardContent className="p-0">
                {isLoadingUsers ? (<div className="p-4 space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-12 w-full"/>)}</div>) : (
                  <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>{language === "th" ? "ชื่อ" : "Name"}</TableHead><TableHead>{language === "th" ? "สถานะออนไลน์" : "Online"}</TableHead><TableHead>{language === "th" ? "ยอด" : "Balance"}</TableHead><TableHead>{language === "th" ? "รหัส" : "Ref"}</TableHead><TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead><TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead></TableRow></TableHeader>
                  <TableBody>{allUsers.map(u => {
                    const isOnline = onlineUsers[u.id] === true;
                    return (<TableRow key={u.id}>
                      <TableCell className="font-mono text-muted-foreground">#{u.id}</TableCell>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                          <span className={`text-xs ${isOnline ? "text-green-500" : "text-muted-foreground"}`}>
                            {isOnline ? (language === "th" ? "ออนไลน์" : "Online") : (language === "th" ? "ออฟไลน์" : "Offline")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">{u.balance.toLocaleString()} ฿</TableCell>
                      <TableCell className="font-mono text-xs">{u.referralCode}</TableCell>
                      <TableCell>{u.isBlocked ? <Badge variant="destructive" className="gap-1"><UserX className="h-3 w-3" />{language === "th" ? "ระงับ" : "Blocked"}</Badge> : <Badge variant="secondary" className="gap-1"><UserCheck className="h-3 w-3" />{language === "th" ? "ใช้งาน" : "Active"}</Badge>}</TableCell>
                      <TableCell className="text-right"><Button size="sm" variant={u.isBlocked ? "default" : "destructive"} onClick={() => handleToggleUserBlock(u.id, u.isBlocked)} disabled={updateUserMutation.isPending}>{u.isBlocked ? <><UserCheck className="h-4 w-4 mr-1" />{language === "th" ? "ปลด" : "Unblock"}</> : <><UserX className="h-4 w-4 mr-1" />{language === "th" ? "ระงับ" : "Block"}</>}</Button></TableCell>
                    </TableRow>);
                  })}</TableBody></Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== ANALYTICS ==================== */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card><CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5" />{language === "th" ? "ยอดแทงรายวัน (7 วัน)" : "Daily (7d)"}</CardTitle></CardHeader><CardContent>{dailyBettingData.length > 0 ? (<ResponsiveContainer width="100%" height={250}><AreaChart data={dailyBettingData}><defs><linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="displayDate" tick={{fill: 'hsl(var(--muted-foreground))'}} className="text-xs" /><YAxis tick={{fill: 'hsl(var(--muted-foreground))'}} tickFormatter={v => `${(v/1000).toFixed(0)}k`} className="text-xs" /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`${v.toLocaleString()} ฿`, language === "th" ? "ยอด" : "Amt"]} /><Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorAmount)" /></AreaChart></ResponsiveContainer>) : <div className="h-[250px] flex items-center justify-center text-muted-foreground">{language === "th" ? "ไม่มีข้อมูล" : "No data"}</div>}</CardContent></Card>
              <Card><CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><PieChart className="h-5 w-5" />{language === "th" ? "ยอดแทงตามหวย" : "By Lottery"}</CardTitle></CardHeader><CardContent>{bettingByLotteryData.length > 0 ? (<ResponsiveContainer width="100%" height={250}><RechartsPie><Pie data={bettingByLotteryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">{bettingByLotteryData.map((_,i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`${v.toLocaleString()} ฿`, language === "th" ? "ยอด" : "Amt"]} /><Legend /></RechartsPie></ResponsiveContainer>) : <div className="h-[250px] flex items-center justify-center text-muted-foreground">{language === "th" ? "ไม่มีข้อมูล" : "No data"}</div>}</CardContent></Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card><CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" />{language === "th" ? "เลขฮอต Top 10" : "Hot Numbers"}</CardTitle></CardHeader><CardContent>{hotNumbers.length > 0 ? (<ResponsiveContainer width="100%" height={250}><BarChart data={hotNumbers} layout="vertical"><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis type="number" tick={{fill: 'hsl(var(--muted-foreground))'}} /><YAxis type="category" dataKey="number" tick={{fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace', fontWeight: 'bold'}} width={60} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[0,4,4,0]} /></BarChart></ResponsiveContainer>) : <div className="h-[250px] flex items-center justify-center text-muted-foreground">{language === "th" ? "ไม่มีข้อมูล" : "No data"}</div>}</CardContent></Card>
              <Card><CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5" />{language === "th" ? "ยอดแทงตามประเภท" : "By Type"}</CardTitle></CardHeader><CardContent>{betTypeDistribution.length > 0 ? (<ResponsiveContainer width="100%" height={250}><BarChart data={betTypeDistribution}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="name" tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10}} angle={-45} textAnchor="end" height={60} /><YAxis tick={{fill: 'hsl(var(--muted-foreground))'}} tickFormatter={v => `${(v/1000).toFixed(0)}k`} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`${v.toLocaleString()} ฿`, language === "th" ? "ยอด" : "Amt"]} /><Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>) : <div className="h-[250px] flex items-center justify-center text-muted-foreground">{language === "th" ? "ไม่มีข้อมูล" : "No data"}</div>}</CardContent></Card>
            </div>
            <Card><CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" />{language === "th" ? "Affiliate ยอดสูงสุด" : "Top Affiliates"}</CardTitle></CardHeader><CardContent>{affiliatePerformance.length > 0 ? (<div className="space-y-3">{affiliatePerformance.map((a,i) => (<div key={a.username} className="flex items-center justify-between p-3 rounded-lg bg-muted/30"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">#{i+1}</div><span className="font-medium">{a.username}</span></div><Badge className="bg-green-500/10 text-green-600 border-green-500/20">+{a.earnings.toLocaleString()} ฿</Badge></div>))}</div>) : <div className="py-8 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{language === "th" ? "ยังไม่มี" : "None yet"}</p></div>}</CardContent></Card>
          </TabsContent>

          {/* ==================== BETS ==================== */}
          <TabsContent value="bets" className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><div className="flex items-center justify-between flex-wrap gap-3"><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" />{language === "th" ? "รายงานการแทง" : "Bets"}<Badge variant="secondary">{filteredBets.length}</Badge></CardTitle><Select value={betFilter} onValueChange={v => setBetFilter(v as typeof betFilter)}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{language === "th" ? "ทั้งหมด" : "All"}</SelectItem><SelectItem value="pending">{language === "th" ? "รอผล" : "Pending"}</SelectItem><SelectItem value="won">{language === "th" ? "ถูก" : "Won"}</SelectItem><SelectItem value="lost">{language === "th" ? "ไม่ถูก" : "Lost"}</SelectItem></SelectContent></Select></div></CardHeader>
              <CardContent className="p-0">
                {isLoadingBets ? (<div className="p-4 space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-12 w-full"/>)}</div>) : filteredBets.length === 0 ? (<div className="p-8 text-center text-muted-foreground"><BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{language === "th" ? "ไม่มีรายการ" : "No bets"}</p></div>) : (
                  <Table><TableHeader><TableRow><TableHead>{language === "th" ? "ผู้ใช้" : "User"}</TableHead><TableHead>{language === "th" ? "หวย" : "Lottery"}</TableHead><TableHead>{language === "th" ? "ประเภท" : "Type"}</TableHead><TableHead>{language === "th" ? "เลข" : "No."}</TableHead><TableHead>{language === "th" ? "ยอด" : "Amt"}</TableHead><TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead><TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead></TableRow></TableHeader>
                  <TableBody>{filteredBets.slice(0,50).map(b => (<TableRow key={b.id}><TableCell className="font-medium">{getUsernameById(b.userId)}</TableCell><TableCell><Badge variant="secondary" className="text-xs">{lotteryTypeNames[b.lotteryType as LotteryType]?.[language] || b.lotteryType}</Badge></TableCell><TableCell className="text-sm">{betTypeNames[b.betType as BetType]?.[language] || b.betType}</TableCell><TableCell className="font-mono font-bold">{b.numbers}</TableCell><TableCell>{b.amount.toLocaleString()} ฿</TableCell><TableCell>{b.status === "pending" && <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{language === "th" ? "รอผล" : "Wait"}</Badge>}{b.status === "won" && <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" />{language === "th" ? "ถูก" : "Won"}</Badge>}{b.status === "lost" && <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{language === "th" ? "ไม่ถูก" : "Lost"}</Badge>}</TableCell>
                    <TableCell className="text-right">
                      {b.status === "pending" && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 gap-1" onClick={() => updateBetStatusMutation.mutate({ betId: b.id, status: "won" })} disabled={updateBetStatusMutation.isPending}>
                            <CheckCircle className="h-3 w-3" />{language === "th" ? "ถูก" : "Won"}
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-1" onClick={() => updateBetStatusMutation.mutate({ betId: b.id, status: "lost" })} disabled={updateBetStatusMutation.isPending}>
                            <XCircle className="h-3 w-3" />{language === "th" ? "ไม่ถูก" : "Lost"}
                          </Button>
                        </div>
                      )}
                      {b.status === "won" && <span className="text-xs text-green-500">{language === "th" ? `🏆 ${(b.potentialWin || 0).toLocaleString()} ฿` : `🏆 ${(b.potentialWin || 0).toLocaleString()} ฿`}</span>}
                    </TableCell>
                  </TableRow>))}</TableBody></Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== BLOCKED ==================== */}
          <TabsContent value="blocked" className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5" />{language === "th" ? "เพิ่มเลขอั้น" : "Add Blocked"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2"><Label>{language === "th" ? "ประเภทหวย" : "Lottery"}</Label><Select value={newLotteryType} onValueChange={v => setNewLotteryType(v as LotteryType)}><SelectTrigger><SelectValue placeholder={language === "th" ? "เลือก" : "Select"} /></SelectTrigger><SelectContent>{lotteryTypes.map(t => <SelectItem key={t} value={t}>{lotteryTypeNames[t][language]}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>{language === "th" ? "เลข" : "Number"}</Label><Input value={newNumber} onChange={e => setNewNumber(e.target.value.replace(/[^0-9]/g,""))} placeholder="123" className="font-mono" /></div>
                  <div className="space-y-2"><Label>{language === "th" ? "ประเภทแทง" : "Bet Type"}</Label><Select value={newBetType} onValueChange={v => setNewBetType(v as BetType | "all")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{language === "th" ? "ทุกประเภท" : "All"}</SelectItem>{betTypes.map(t => <SelectItem key={t} value={t}>{betTypeNames[t][language]}</SelectItem>)}</SelectContent></Select></div>
                  <div className="flex items-end"><Button onClick={handleAddBlocked} className="w-full gap-2" disabled={addBlockedMutation.isPending}>{addBlockedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{language === "th" ? "เพิ่ม" : "Add"}</Button></div>
                </div>
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><span className="font-medium">{language === "th" ? "ตั้งเวลาล่วงหน้า (GMT+7)" : "Schedule"}</span></div><Switch checked={blockedUseSchedule} onCheckedChange={setBlockedUseSchedule} /></div>
                  {blockedUseSchedule && (<div className="grid gap-4 sm:grid-cols-2 p-4 bg-primary/5 rounded-lg border border-primary/20"><div className="space-y-2"><Label className="flex items-center gap-2 text-green-600"><CalendarCheck className="h-4 w-4" />{language === "th" ? "เริ่ม" : "Start"}</Label><Input type="datetime-local" value={blockedStartDate} onChange={e => setBlockedStartDate(e.target.value)} /></div><div className="space-y-2"><Label className="flex items-center gap-2 text-red-600"><CalendarX className="h-4 w-4" />{language === "th" ? "สิ้นสุด" : "End"}</Label><Input type="datetime-local" value={blockedEndDate} onChange={e => setBlockedEndDate(e.target.value)} min={blockedStartDate} /></div></div>)}
                  {!blockedUseSchedule && <p className="text-sm text-muted-foreground flex items-center gap-2"><Info className="h-4 w-4" />{language === "th" ? "จะมีผลบังคับใช้ทันทีและตลอดไป" : "Active immediately and forever"}</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Ban className="h-5 w-5" />{language === "th" ? "รายการเลขอั้น" : "Blocked List"}</CardTitle></CardHeader>
              <CardContent className="p-0">
                {isLoading ? (<div className="p-4 space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-12 w-full"/>)}</div>) : blockedNumbers.length === 0 ? (<div className="p-8 text-center text-muted-foreground"><Ban className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{language === "th" ? "ยังไม่มีเลขอั้น" : "None"}</p></div>) : (
                  <Table><TableHeader><TableRow><TableHead>{language === "th" ? "หวย" : "Lottery"}</TableHead><TableHead>{language === "th" ? "เลข" : "No."}</TableHead><TableHead>{language === "th" ? "ประเภท" : "Type"}</TableHead><TableHead>{language === "th" ? "กำหนดการ" : "Schedule"}</TableHead><TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead><TableHead className="text-right">{language === "th" ? "ลบ" : "Del"}</TableHead></TableRow></TableHeader>
                  <TableBody>{blockedNumbers.map(bn => (<TableRow key={bn.id}><TableCell><Badge variant="secondary">{lotteryTypeNames[bn.lotteryType as LotteryType]?.[language] || bn.lotteryType}</Badge></TableCell><TableCell className="font-mono font-bold text-lg">{bn.number}</TableCell><TableCell>{bn.betType ? (betTypeNames[bn.betType as BetType]?.[language] || bn.betType) : (language === "th" ? "ทุกประเภท" : "All")}</TableCell><TableCell className="text-xs">{(bn as any).startDate || (bn as any).endDate ? (<div className="space-y-0.5">{(bn as any).startDate && <div className="text-green-500">{language === "th" ? "เริ่ม" : "From"}: {new Date((bn as any).startDate).toLocaleString(language === "th" ? "th-TH" : "en-US")}</div>}{(bn as any).endDate && <div className="text-red-500">{language === "th" ? "ถึง" : "To"}: {new Date((bn as any).endDate).toLocaleString(language === "th" ? "th-TH" : "en-US")}</div>}</div>) : <span className="text-muted-foreground">{language === "th" ? "ตลอดไป" : "Permanent"}</span>}</TableCell><TableCell><div className="flex items-center gap-2"><Switch checked={!!bn.isActive} onCheckedChange={() => handleToggleBlocked(bn.id, bn.isActive)} /><span className={bn.isActive ? "text-green-500" : "text-muted-foreground"}>{bn.isActive ? (language === "th" ? "เปิด" : "On") : (language === "th" ? "ปิด" : "Off")}</span></div></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDeleteBlocked(bn.id)} disabled={deleteBlockedMutation.isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody></Table>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5" />{language === "th" ? "อัตราจ่าย" : "Payout Rates"}</CardTitle><CardDescription>{language === "th" ? "คลิกเพื่อแก้ไข" : "Click to edit"}</CardDescription></CardHeader>
              <CardContent>
                {isLoadingPayoutRates ? (<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>) : isPayoutRatesError || payoutSettings.length < betTypes.length ? (<div className="p-8 text-center text-destructive"><XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{language === "th" ? `อัตราจ่ายไม่ครบ ${payoutSettings.length}/${betTypes.length}` : `Incomplete ${payoutSettings.length}/${betTypes.length}`}</p></div>) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{betTypes.map(type => (<Card key={type} className="bg-card/50"><CardContent className="p-4">{editingPayoutRate === type ? (<div className="flex flex-col gap-2"><span className="font-medium text-sm">{betTypeNames[type][language]}</span><div className="flex items-center gap-2"><span className="text-muted-foreground">x</span><Input type="number" step="0.1" value={editedRate} onChange={e => setEditedRate(e.target.value)} className="h-8 w-24 font-mono" autoFocus disabled={updatePayoutRateMutation.isPending} /><Button size="sm" onClick={() => handleSavePayoutRate(type)} disabled={updatePayoutRateMutation.isPending}>{updatePayoutRateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}</Button><Button size="sm" variant="ghost" onClick={handleCancelEditPayoutRate}><XCircle className="h-4 w-4" /></Button></div></div>) : (<div className="flex items-center justify-between gap-2 cursor-pointer" onClick={() => handleStartEditPayoutRate(type)}><span className="font-medium">{betTypeNames[type][language]}</span>{getPayoutRate(type) !== null ? <Badge variant="secondary" className="text-lg font-bold">x{getPayoutRate(type)}</Badge> : <Badge variant="destructive">Missing</Badge>}</div>)}</CardContent></Card>))}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== LIMITS ==================== */}
          <TabsContent value="limits" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5" />{language === "th" ? "เพิ่มลิมิต" : "Add Limit"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2"><Label>{language === "th" ? "เลข" : "Number"}</Label><Input placeholder="123" value={limitNumber} onChange={e => setLimitNumber(e.target.value)} /></div>
                  <div className="space-y-2"><Label>{language === "th" ? "ยอดสูงสุด (฿)" : "Max (฿)"}</Label><Input type="number" placeholder="1000" value={limitMaxAmount} onChange={e => setLimitMaxAmount(e.target.value)} /></div>
                  <div className="space-y-2"><Label>{language === "th" ? "ใช้กับหวย" : "Scope"}</Label><Select value={isAllLotteryTypes ? "all" : "specific"} onValueChange={v => { setIsAllLotteryTypes(v === "all"); if (v === "all") setLimitLotteryTypes([]); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{language === "th" ? "ทุกหวย" : "All"}</SelectItem><SelectItem value="specific">{language === "th" ? "เลือก" : "Pick"}</SelectItem></SelectContent></Select></div>
                  <div className="flex items-end"><Button onClick={() => { if (!limitNumber || !limitMaxAmount) return; addBetLimitMutation.mutate({ number: limitNumber, maxAmount: parseFloat(limitMaxAmount), lotteryTypes: isAllLotteryTypes ? [] : limitLotteryTypes, startDate: limitUseSchedule && limitStartDate ? limitStartDate : null, endDate: limitUseSchedule && limitEndDate ? limitEndDate : null }); }} disabled={!limitNumber || !limitMaxAmount || addBetLimitMutation.isPending} className="w-full">{addBetLimitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}{language === "th" ? "เพิ่ม" : "Add"}</Button></div>
                </div>
                {!isAllLotteryTypes && (<div className="flex flex-wrap gap-2">{lotteryTypes.map(t => <Badge key={t} variant={limitLotteryTypes.includes(t) ? "default" : "outline"} className="cursor-pointer" onClick={() => setLimitLotteryTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>{lotteryTypeNames[t][language]}</Badge>)}</div>)}
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><span className="font-medium">{language === "th" ? "ตั้งเวลา" : "Schedule"}</span></div><Switch checked={limitUseSchedule} onCheckedChange={setLimitUseSchedule} /></div>
                  {limitUseSchedule && (<div className="grid gap-4 sm:grid-cols-2 p-4 bg-primary/5 rounded-lg border border-primary/20"><div className="space-y-2"><Label className="flex items-center gap-2 text-green-600"><CalendarCheck className="h-4 w-4" />{language === "th" ? "เริ่ม" : "Start"}</Label><Input type="datetime-local" value={limitStartDate} onChange={e => setLimitStartDate(e.target.value)} /></div><div className="space-y-2"><Label className="flex items-center gap-2 text-red-600"><CalendarX className="h-4 w-4" />{language === "th" ? "สิ้นสุด" : "End"}</Label><Input type="datetime-local" value={limitEndDate} onChange={e => setLimitEndDate(e.target.value)} min={limitStartDate} /></div></div>)}
                  {!limitUseSchedule && <p className="text-sm text-muted-foreground flex items-center gap-2"><Info className="h-4 w-4" />{language === "th" ? "มีผลทันทีและตลอดไป" : "Active forever"}</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" />{language === "th" ? "รายการลิมิต" : "Limits"}<Badge variant="secondary">{betLimits.length}</Badge></CardTitle></CardHeader>
              <CardContent className="p-0">
                {isLoadingBetLimits ? (<div className="p-4 space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-12 w-full"/>)}</div>) : betLimits.length === 0 ? (<div className="p-8 text-center text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{language === "th" ? "ยังไม่มีลิมิต" : "None"}</p></div>) : (
                  <Table><TableHeader><TableRow><TableHead>{language === "th" ? "เลข" : "No."}</TableHead><TableHead>{language === "th" ? "สูงสุด" : "Max"}</TableHead><TableHead>{language === "th" ? "หวย" : "Lottery"}</TableHead><TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead><TableHead className="text-right">{language === "th" ? "ลบ" : "Del"}</TableHead></TableRow></TableHeader>
                  <TableBody>{betLimits.map(l => (<TableRow key={l.id}><TableCell className="font-mono font-bold text-lg">{l.number}</TableCell><TableCell className="font-bold text-amber-600">{l.maxAmount.toLocaleString()} ฿</TableCell><TableCell>{l.lotteryTypes.length === 0 ? <Badge variant="secondary">{language === "th" ? "ทุกหวย" : "All"}</Badge> : <div className="flex flex-wrap gap-1">{l.lotteryTypes.slice(0,3).map(t => <Badge key={t} variant="outline" className="text-xs">{lotteryTypeNames[t as LotteryType]?.[language] || t}</Badge>)}{l.lotteryTypes.length > 3 && <Badge variant="outline" className="text-xs">+{l.lotteryTypes.length-3}</Badge>}</div>}</TableCell><TableCell><Switch checked={!!l.isActive} onCheckedChange={c => updateBetLimitMutation.mutate({ id: l.id, isActive: c })} disabled={updateBetLimitMutation.isPending} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteBetLimitMutation.mutate(l.id)} disabled={deleteBetLimitMutation.isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody></Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== BET TYPES ==================== */}
          <TabsContent value="bet-types" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Play className="h-5 w-5" />{language === "th" ? "เปิด-ปิด ประเภทการแทง" : "Bet Types"}</CardTitle><CardDescription>{language === "th" ? "เปิดหรือปิดรับแทงแต่ละประเภททั่วทั้งระบบ ทุกหวย" : "Toggle globally"}</CardDescription></CardHeader>
              <CardContent>
                {isLoadingBetTypeSettings ? (<div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-16 w-full"/>)}</div>) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{betTypes.map(type => { const s = betTypeSettings.find(s => s.betType === type); const on = s?.isEnabled ?? true; return (
                    <Card key={type} className={`transition-all ${on ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5 opacity-70'}`}><CardContent className="p-4"><div className="flex items-center justify-between gap-4"><div className="flex-1"><p className="font-medium">{betTypeNames[type][language]}</p><p className="text-xs text-muted-foreground mt-1">{on ? (language === "th" ? "กำลังรับแทง" : "Active") : (language === "th" ? "ปิดรับแทง" : "Disabled")}</p></div><div className="flex items-center gap-2"><Switch checked={on} onCheckedChange={c => updateBetTypeSettingMutation.mutate({ betType: type, isEnabled: c })} disabled={updateBetTypeSettingMutation.isPending} />{on ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}</div></div></CardContent></Card>
                  ); })}</div>
                )}
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5" />{language === "th" ? "สถานะปัจจุบัน" : "Status"}</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{betTypes.map(type => { const s = betTypeSettings.find(s => s.betType === type); const on = s?.isEnabled ?? true; return <Badge key={type} variant={on ? "default" : "destructive"} className="text-sm">{betTypeNames[type][language]}: {on ? (language === "th" ? "เปิด" : "ON") : (language === "th" ? "ปิด" : "OFF")}</Badge>; })}</div></CardContent></Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
