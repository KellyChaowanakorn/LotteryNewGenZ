import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  History
} from "lucide-react";
import type { User, Transaction } from "@shared/schema";

export default function Affiliate() {
  const { language, t } = useI18n();
  const { isAuthenticated, user } = useUser();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: userData, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
  });

  const affiliateEarnings = userData?.affiliateEarnings || 0;
  const referralCode = userData?.referralCode || user?.referralCode || "QNQ12345";
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  
  const affiliateTxs = transactions.filter(tx => tx.type === "affiliate_commission");
  const paidEarnings = affiliateTxs.filter(tx => tx.status === "approved").reduce((sum, tx) => sum + tx.amount, 0);
  const pendingEarnings = affiliateTxs.filter(tx => tx.status === "pending").reduce((sum, tx) => sum + tx.amount, 0);

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
              <Users className="h-8 w-8 text-primary" />
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

  const isLoading = userLoading || txLoading;

  return (
    <div className="min-h-full">
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 md:p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{t("affiliate.title")}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Gift className="h-4 w-4" />
              {t("affiliate.commission")}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        <Card className="bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/20 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Link className="h-5 w-5" />
              {t("affiliate.yourCode")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background/80 rounded-lg p-3 font-mono text-lg font-bold text-center">
                {isLoading ? <Skeleton className="h-6 w-24 mx-auto" /> : referralCode}
              </div>
              <Button
                size="icon"
                onClick={() => copyToClipboard(referralCode)}
                data-testid="button-copy-code"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("affiliate.copyLink")}</p>
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="text-xs font-mono"
                  data-testid="input-referral-link"
                />
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(referralLink)}
                  className="gap-2"
                  data-testid="button-copy-link"
                >
                  <Share2 className="h-4 w-4" />
                  {language === "th" ? "แชร์" : "Share"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("affiliate.totalReferrals")}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">0</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("affiliate.totalEarnings")}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-green-500">
                      {affiliateEarnings.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Wallet className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("affiliate.pendingEarnings")}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-amber-500">
                      {pendingEarnings.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "th" ? "อัตราคอมมิชชั่น" : "Commission Rate"}
                  </p>
                  <p className="text-2xl font-bold text-primary">20%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === "th" ? "ยังไม่มีรายได้จากการแนะนำ" : "No affiliate earnings yet"}</p>
                <p className="text-sm mt-2">
                  {language === "th" 
                    ? "แชร์ลิงก์ของคุณเพื่อเริ่มรับค่าคอมมิชชั่น 20%" 
                    : "Share your link to start earning 20% commission"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "th" ? "รหัสอ้างอิง" : "Reference"}</TableHead>
                    <TableHead className="text-right">{language === "th" ? "คอมมิชชั่น" : "Commission"}</TableHead>
                    <TableHead>{language === "th" ? "วันที่" : "Date"}</TableHead>
                    <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliateTxs.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono">{tx.reference}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        +{tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={tx.status === "approved" ? "secondary" : "outline"}>
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

        {pendingEarnings > 0 && (
          <div className="flex justify-end">
            <Button className="gap-2" data-testid="button-withdraw-affiliate">
              <Wallet className="h-4 w-4" />
              {t("affiliate.withdraw")} ({pendingEarnings.toLocaleString()} {t("common.baht")})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
