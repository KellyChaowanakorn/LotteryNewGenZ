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
  type BlockedNumber
} from "@shared/schema";
import {
  Settings,
  Ban,
  Plus,
  Trash2,
  DollarSign,
  Shield,
  Users,
  Loader2
} from "lucide-react";

export default function Admin() {
  const { language, t } = useI18n();
  const { isAdminAuthenticated } = useAdmin();
  const { toast } = useToast();

  const [newLotteryType, setNewLotteryType] = useState<LotteryType | "">("");
  const [newNumber, setNewNumber] = useState("");
  const [newBetType, setNewBetType] = useState<BetType | "all">("all");

  const { data: blockedNumbers = [], isLoading } = useQuery<BlockedNumber[]>({
    queryKey: ["/api/blocked-numbers"],
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
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/blocked-numbers/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-numbers"] });
    }
  });

  const deleteBlockedMutation = useMutation({
    mutationFn: async (id: string) => {
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

  const handleToggleBlocked = (id: string, isActive: boolean) => {
    updateBlockedMutation.mutate({ id, isActive: !isActive });
  };

  const handleDeleteBlocked = (id: string) => {
    deleteBlockedMutation.mutate(id);
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
              {language === "th" ? "จัดการเลขอั้น อัตราจ่าย และระบบต่างๆ" : "Manage blocked numbers, payout rates, and system"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <Tabs defaultValue="blocked" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="blocked" className="gap-2">
              <Ban className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.blockedNumbers")}</span>
              <span className="sm:hidden">{language === "th" ? "เลขอั้น" : "Blocked"}</span>
            </TabsTrigger>
            <TabsTrigger value="rates" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">{t("admin.payoutRates")}</span>
              <span className="sm:hidden">{language === "th" ? "อัตราจ่าย" : "Rates"}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "th" ? "ผู้ใช้" : "Users"}</span>
            </TabsTrigger>
          </TabsList>

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
          </TabsContent>

          <TabsContent value="rates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t("admin.payoutRates")}
                </CardTitle>
                <CardDescription>
                  {language === "th" 
                    ? "อัตราจ่ายปัจจุบัน (จะเปิดให้แก้ไขในอนาคต)" 
                    : "Current payout rates (editing coming soon)"}
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

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {language === "th" ? "รายชื่อผู้ใช้" : "User List"}
                </CardTitle>
                <CardDescription>
                  {language === "th" 
                    ? "ข้อมูลผู้ใช้งานในระบบ" 
                    : "System user information"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "th" ? "กำลังพัฒนา..." : "Coming soon..."}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
