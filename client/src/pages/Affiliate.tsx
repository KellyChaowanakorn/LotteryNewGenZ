import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Copy,
  Check,
  Gift,
  Wallet,
  TrendingUp,
  Share2,
  Link,
  Crown,
  History,
  ArrowDown,
  User,
  Network,
  Percent,
  Info,
  ChevronDown,
  Star
} from "lucide-react";
import type { User as UserType, Transaction } from "@shared/schema";

// Commission rates
const LEVEL1_COMMISSION = 10; // Direct referral: 10%
const LEVEL2_COMMISSION = 5;  // Downline's referral: 5%

// Referral interface
interface Referral {
  id: number;
  username: string;
  level: 1 | 2;
  joinedAt: string;
  totalBets: number;
  yourEarnings: number;
}

export default function Affiliate() {
  const { language, t } = useI18n();
  const { isAuthenticated, user } = useUser();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: userData, isLoading: userLoading } = useQuery<UserType>({
    queryKey: [`/api/users/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
  });

  // Mock referrals data (replace with actual API)
  const { data: referrals = [], isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: [`/api/affiliates/${user?.id}/referrals`],
    enabled: isAuthenticated && !!user?.id,
    // Mock data for demo
    placeholderData: []
  });

  const affiliateEarnings = userData?.affiliateEarnings || 0;
  const referralCode = userData?.referralCode || user?.referralCode || "QNQ" + (user?.id || "12345");
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  
  const affiliateTxs = transactions.filter(tx => tx.type === "affiliate_commission");
  const paidEarnings = affiliateTxs.filter(tx => tx.status === "approved").reduce((sum, tx) => sum + tx.amount, 0);
  const pendingEarnings = affiliateTxs.filter(tx => tx.status === "pending").reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate referral stats
  const level1Referrals = referrals.filter(r => r.level === 1);
  const level2Referrals = referrals.filter(r => r.level === 2);
  const level1Earnings = level1Referrals.reduce((sum, r) => sum + r.yourEarnings, 0);
  const level2Earnings = level2Referrals.reduce((sum, r) => sum + r.yourEarnings, 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: t("affiliate.copied"),
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
              <Network className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{t("affiliate.title")}</CardTitle>
            <CardDescription>
              {language === "th" 
                ? "เข้าสู่ระบบเพื่อเริ่มหารายได้จากการแนะนำเพื่อน" 
                : "Login to start earning from referrals"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <a href="/login">{t("nav.login")}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = userLoading || txLoading || referralsLoading;

  return (
    <div className="min-h-full bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 md:p-6 border-b">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="p-3 bg-primary rounded-2xl shadow-lg">
            <Network className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {language === "th" ? "โปรแกรมแนะนำเพื่อน" : "Affiliate Program"}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Gift className="h-4 w-4" />
              {language === "th" ? "รับค่าคอมมิชชั่น 2 ชั้น" : "Earn 2-tier commission"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Commission Structure Visual */}
        <Card className="overflow-hidden border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              {language === "th" ? "โครงสร้างค่าคอมมิชชั่น" : "Commission Structure"}
            </CardTitle>
            <CardDescription>
              {language === "th" 
                ? "รับรายได้จากสมาชิกที่คุณแนะนำ และสมาชิกที่เขาแนะนำต่อ!" 
                : "Earn from members you refer and members they refer!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* MLM Tree Visualization */}
            <div className="flex flex-col items-center space-y-4">
              {/* You (Top) */}
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
                  <User className="h-10 w-10 text-white" />
                </div>
                <Badge className="mt-2 bg-primary">{language === "th" ? "คุณ" : "YOU"}</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "th" ? "เจ้าของลิงก์" : "Link Owner"}
                </p>
              </div>

              {/* Arrow Down */}
              <div className="flex flex-col items-center">
                <ArrowDown className="h-6 w-6 text-green-500 animate-bounce" />
                <Badge variant="outline" className="border-green-500 text-green-600 bg-green-500/10 mt-1">
                  <Percent className="h-3 w-3 mr-1" />
                  {LEVEL1_COMMISSION}% {language === "th" ? "คอมมิชชั่น" : "Commission"}
                </Badge>
              </div>

              {/* Level 1 (Direct) */}
              <div className="flex flex-col items-center">
                <div className="flex gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
                <Badge className="mt-2 bg-green-500">
                  {language === "th" ? "ชั้น 1 (ตรง)" : "Level 1 (Direct)"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "th" ? "คนที่คุณแนะนำโดยตรง" : "People you directly refer"}
                </p>
              </div>

              {/* Arrow Down */}
              <div className="flex flex-col items-center">
                <ArrowDown className="h-6 w-6 text-amber-500 animate-bounce" />
                <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-500/10 mt-1">
                  <Percent className="h-3 w-3 mr-1" />
                  {LEVEL2_COMMISSION}% {language === "th" ? "คอมมิชชั่น" : "Commission"}
                </Badge>
              </div>

              {/* Level 2 (Downline) */}
              <div className="flex flex-col items-center">
                <div className="flex gap-2 flex-wrap justify-center max-w-[300px]">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-sm">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
                <Badge className="mt-2 bg-amber-500">
                  {language === "th" ? "ชั้น 2 (ดาวน์ไลน์)" : "Level 2 (Downline)"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "th" ? "คนที่ชั้น 1 แนะนำต่อ" : "People referred by Level 1"}
                </p>
              </div>
            </div>

            {/* Example Box */}
            <div className="mt-6 p-4 bg-muted/50 rounded-xl border-2 border-dashed">
              <p className="font-semibold flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-primary" />
                {language === "th" ? "ตัวอย่างการคำนวณ:" : "Calculation Example:"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {language === "th" ? "🎯 ชั้น 1 แทง 1,000 บาท" : "🎯 Level 1 bets 1,000 THB"}
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {language === "th" ? `คุณได้ ${LEVEL1_COMMISSION}% = 100 บาท` : `You get ${LEVEL1_COMMISSION}% = 100 THB`}
                  </p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {language === "th" ? "🎯 ชั้น 2 แทง 1,000 บาท" : "🎯 Level 2 bets 1,000 THB"}
                  </p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {language === "th" ? `คุณได้ ${LEVEL2_COMMISSION}% = 50 บาท` : `You get ${LEVEL2_COMMISSION}% = 50 THB`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Code & Link */}
        <Card className="bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/20 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Link className="h-5 w-5" />
              {t("affiliate.yourCode")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background/80 rounded-lg p-4 font-mono text-2xl font-bold text-center tracking-wider">
                {isLoading ? <Skeleton className="h-8 w-32 mx-auto" /> : referralCode}
              </div>
              <Button
                size="lg"
                onClick={() => copyToClipboard(referralCode)}
                data-testid="button-copy-code"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("affiliate.copyLink")}</p>
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="text-xs font-mono bg-background/80"
                  data-testid="input-referral-link"
                />
                <Button
                  variant="default"
                  onClick={() => copyToClipboard(referralLink)}
                  className="gap-2 min-w-[100px]"
                  data-testid="button-copy-link"
                >
                  <Share2 className="h-4 w-4" />
                  {language === "th" ? "แชร์" : "Share"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "th" ? "ชั้น 1 (10%)" : "Level 1 (10%)"}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{level1Referrals.length}</p>
                  )}
                  <p className="text-xs text-green-600">
                    +{level1Earnings.toLocaleString()} ฿
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500 rounded-xl">
                  <Network className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "th" ? "ชั้น 2 (5%)" : "Level 2 (5%)"}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-amber-600">{level2Referrals.length}</p>
                  )}
                  <p className="text-xs text-amber-600">
                    +{level2Earnings.toLocaleString()} ฿
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("affiliate.totalEarnings")}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">
                      {affiliateEarnings.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {language === "th" ? "บาท" : "THB"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500 rounded-xl">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("affiliate.pendingEarnings")}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-yellow-600">
                      {pendingEarnings.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {language === "th" ? "รอถอน" : "Withdrawable"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Network and History */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="gap-2">
              <Network className="h-4 w-4" />
              {language === "th" ? "เครือข่าย" : "Network"}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              {language === "th" ? "ประวัติรายได้" : "Earnings History"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {language === "th" ? "สมาชิกในเครือข่าย" : "Network Members"}
                  <Badge variant="secondary">{referrals.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Users className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">
                      {language === "th" ? "ยังไม่มีสมาชิกในเครือข่าย" : "No network members yet"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                      {language === "th" 
                        ? "แชร์ลิงก์ของคุณเพื่อเริ่มสร้างเครือข่าย และรับค่าคอมมิชชั่น 2 ชั้น!" 
                        : "Share your link to start building your network and earn 2-tier commissions!"}
                    </p>
                    <Button className="mt-4 gap-2" onClick={() => copyToClipboard(referralLink)}>
                      <Share2 className="h-4 w-4" />
                      {language === "th" ? "แชร์ลิงก์เลย" : "Share Link Now"}
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "th" ? "ชื่อผู้ใช้" : "Username"}</TableHead>
                        <TableHead>{language === "th" ? "ชั้น" : "Level"}</TableHead>
                        <TableHead>{language === "th" ? "วันที่สมัคร" : "Joined"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "ยอดแทงรวม" : "Total Bets"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "รายได้จากคนนี้" : "Your Earnings"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((ref) => (
                        <TableRow key={ref.id}>
                          <TableCell className="font-medium">{ref.username}</TableCell>
                          <TableCell>
                            <Badge className={ref.level === 1 ? "bg-green-500" : "bg-amber-500"}>
                              {language === "th" ? `ชั้น ${ref.level}` : `Level ${ref.level}`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(ref.joinedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {ref.totalBets.toLocaleString()} ฿
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            +{ref.yourEarnings.toLocaleString()} ฿
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {t("affiliate.history")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : affiliateTxs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Gift className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">
                      {language === "th" ? "ยังไม่มีรายได้จากการแนะนำ" : "No affiliate earnings yet"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {language === "th" 
                        ? `แชร์ลิงก์ของคุณเพื่อรับ ${LEVEL1_COMMISSION}% จากชั้น 1 และ ${LEVEL2_COMMISSION}% จากชั้น 2` 
                        : `Share your link to earn ${LEVEL1_COMMISSION}% from Level 1 and ${LEVEL2_COMMISSION}% from Level 2`}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "th" ? "รหัสอ้างอิง" : "Reference"}</TableHead>
                        <TableHead>{language === "th" ? "ชั้น" : "Level"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "คอมมิชชั่น" : "Commission"}</TableHead>
                        <TableHead>{language === "th" ? "วันที่" : "Date"}</TableHead>
                        <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliateTxs.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono">{tx.reference}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {tx.reference?.includes("L2") 
                                ? (language === "th" ? "ชั้น 2" : "Level 2")
                                : (language === "th" ? "ชั้น 1" : "Level 1")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            +{tx.amount.toLocaleString()} ฿
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={tx.status === "approved" ? "default" : "secondary"}>
                              {tx.status === "approved" 
                                ? (language === "th" ? "จ่ายแล้ว" : "Paid")
                                : (language === "th" ? "รอจ่าย" : "Pending")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Withdraw Button */}
        {pendingEarnings > 0 && (
          <div className="flex justify-end">
            <Button size="lg" className="gap-2" data-testid="button-withdraw-affiliate">
              <Wallet className="h-5 w-5" />
              {t("affiliate.withdraw")} ({pendingEarnings.toLocaleString()} {t("common.baht")})
            </Button>
          </div>
        )}

        {/* How It Works */}
        <Card className="bg-gradient-to-r from-muted/50 to-muted/20 border-2">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-4 flex-1">
                <p className="font-bold text-foreground">
                  {language === "th" ? "📖 วิธีการทำงาน" : "📖 How It Works"}
                </p>
                
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="p-4 bg-background rounded-xl border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">1</div>
                      <span className="font-semibold">{language === "th" ? "แชร์ลิงก์" : "Share Link"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === "th" 
                        ? "คัดลอกลิงก์แนะนำของคุณและแชร์ให้เพื่อน"
                        : "Copy your referral link and share with friends"}
                    </p>
                  </div>

                  <div className="p-4 bg-background rounded-xl border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                      <span className="font-semibold">{language === "th" ? "เพื่อนสมัคร" : "Friend Joins"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === "th" 
                        ? "เมื่อเพื่อนสมัครผ่านลิงก์ จะเป็นชั้น 1 ของคุณ"
                        : "When friends sign up via your link, they become Level 1"}
                    </p>
                  </div>

                  <div className="p-4 bg-background rounded-xl border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                      <span className="font-semibold">{language === "th" ? "รับค่าคอม" : "Earn Commission"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === "th" 
                        ? `ชั้น 1 = ${LEVEL1_COMMISSION}%, ชั้น 2 = ${LEVEL2_COMMISSION}% จากทุกการแทง`
                        : `Level 1 = ${LEVEL1_COMMISSION}%, Level 2 = ${LEVEL2_COMMISSION}% of all bets`}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                  <p className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-medium">
                    <Star className="h-5 w-5" />
                    {language === "th" 
                      ? "💡 ยิ่งชวนมาก ยิ่งได้มาก! สร้างเครือข่ายใหญ่ รับรายได้ต่อเนื่องตลอดชีพ"
                      : "💡 The more you refer, the more you earn! Build a big network for lifetime passive income"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
