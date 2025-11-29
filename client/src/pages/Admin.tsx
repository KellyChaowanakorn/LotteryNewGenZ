import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  payoutRates,
  type LotteryType, 
  type BetType,
  type BlockedNumber,
  type User,
  type Transaction,
  type Bet
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
  UserCheck
} from "lucide-react";

type UserWithoutPassword = Omit<User, "password">;

interface AdminStats {
  users: { total: number; blocked: number; active: number };
  bets: { total: number; pending: number; won: number; lost: number; totalAmount: number };
  transactions: { pendingDeposits: number; totalDeposits: number };
  affiliates: { total: number; totalCommission: number };
}

export default function Admin() {
  const { language, t } = useI18n();
  const { isAdminAuthenticated } = useAdmin();
  const { toast } = useToast();

  const [newLotteryType, setNewLotteryType] = useState<LotteryType | "">("");
  const [newNumber, setNewNumber] = useState("");
  const [newBetType, setNewBetType] = useState<BetType | "all">("all");
  const [betFilter, setBetFilter] = useState<"all" | "pending" | "won" | "lost">("all");

  const { data: blockedNumbers = [], isLoading } = useQuery<BlockedNumber[]>({
    queryKey: ["/api/blocked-numbers"],
  });

  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery<UserWithoutPassword[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: allTransactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: allBets = [], isLoading: isLoadingBets } = useQuery<Bet[]>({
    queryKey: ["/api/bets"],
  });

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000,
  });

  const addBlockedMutation = useMutation({
    mutationFn: async (data: { lotteryType: string; number: string; betType: string | null }) => {
      const res = await apiRequest("POST", "/api/blocked-numbers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-numbers"] });
      setNewNumber("");
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
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/blocked-numbers/${id}`, { isActive });
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
      betType: newBetType === "all" ? null : newBetType
    });
  };

  const handleToggleBlocked = (id: number, isActive: boolean) => {
    updateBlockedMutation.mutate({ id, isActive: !isActive });
  };

  const handleDeleteBlocked = (id: number) => {
    deleteBlockedMutation.mutate(id);
  };

  const handleToggleUserBlock = (userId: number, isBlocked: boolean) => {
    updateUserMutation.mutate({ id: userId, isBlocked: !isBlocked });
  };

  const handleApproveTransaction = (tx: Transaction) => {
    updateTransactionMutation.mutate({ id: tx.id, status: "approved" });
  };

  const handleRejectTransaction = (tx: Transaction) => {
    updateTransactionMutation.mutate({ id: tx.id, status: "rejected" });
  };

  const pendingDeposits = allTransactions.filter(t => t.type === "deposit" && t.status === "pending");
  const filteredBets = betFilter === "all" 
    ? allBets 
    : allBets.filter(b => b.status === betFilter);

  const getUsernameById = (userId: number) => {
    const user = allUsers.find(u => u.id === userId);
    return user?.username || `User #${userId}`;
  };

  return (
    <div className="min-h-full">
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 md:p-6 border-b border-border">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="transactions" className="gap-1 text-xs sm:text-sm">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "ธุรกรรม" : "Transactions"}</span>
              {pendingDeposits.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingDeposits.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "ผู้ใช้" : "Users"}</span>
            </TabsTrigger>
            <TabsTrigger value="bets" className="gap-1 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "รายงาน" : "Reports"}</span>
            </TabsTrigger>
            <TabsTrigger value="blocked" className="gap-1 text-xs sm:text-sm">
              <Ban className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "เลขอั้น" : "Blocked"}</span>
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
                                  checked={bn.isActive}
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
                    ? "อัตราจ่ายปัจจุบัน" 
                    : "Current payout rates"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {betTypes.map((type) => (
                    <Card key={type} className="bg-card/50">
                      <CardContent className="p-4 flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {betTypeNames[type][language]}
                        </span>
                        <Badge variant="secondary" className="text-lg font-bold">
                          x{payoutRates[type]}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
