import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/store";
import { lotteryTypeNames, betTypeNames } from "@shared/schema";
import type { User as UserType, Bet, Transaction } from "@shared/schema";
import {
  User,
  Wallet,
  History,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Crown
} from "lucide-react";

export default function Profile() {
  const { language, t } = useI18n();
  const { user, isAuthenticated } = useUser();

  const { data: userData, isLoading: userLoading } = useQuery<UserType>({
    queryKey: [`/api/users/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: bets = [], isLoading: betsLoading } = useQuery<Bet[]>({
    queryKey: [`/api/bets?userId=${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{t("profile.title")}</CardTitle>
            <CardDescription>
              {language === "th" 
                ? "เข้าสู่ระบบเพื่อดูข้อมูลโปรไฟล์" 
                : "Login to view your profile"}
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

  const isLoading = userLoading || betsLoading || txLoading;
  const balance = userData?.balance || user?.balance || 0;
  const username = userData?.username || user?.username || "User";
  const totalBets = bets.length;
  const wonBets = bets.filter(b => b.status === "won").length;
  const winRate = totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(1) : "0";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "won":
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" />{t("status.won")}</Badge>;
      case "lost":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{t("status.lost")}</Badge>;
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{t("status.pending")}</Badge>;
      case "approved":
        return <Badge className="bg-green-500">{t("status.approved")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
      case "win":
      case "affiliate_commission":
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      case "bet":
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return language === "th" ? "ฝากเงิน" : "Deposit";
      case "withdrawal":
        return language === "th" ? "ถอนเงิน" : "Withdraw";
      case "bet":
        return language === "th" ? "แทงหวย" : "Bet";
      case "win":
        return language === "th" ? "ถูกรางวัล" : "Win";
      case "affiliate_commission":
        return language === "th" ? "คอมมิชชั่น" : "Commission";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-full">
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 md:p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            {isLoading ? (
              <Skeleton className="h-7 w-32" />
            ) : (
              <h1 className="text-xl md:text-2xl font-bold">{username}</h1>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4 text-primary" />
              <span>{language === "th" ? "สมาชิก VIP" : "VIP Member"}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t("profile.balance")}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-primary">
                {balance.toLocaleString()} {t("common.baht")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <History className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "th" ? "ยอดแทงทั้งหมด" : "Total Bets"}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{totalBets}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Trophy className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "th" ? "ถูกรางวัล" : "Wins"}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-green-500">{wonBets}</p>
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
                    {language === "th" ? "อัตราชนะ" : "Win Rate"}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{winRate}%</p>
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
                  <p className="text-sm text-muted-foreground">{t("profile.balance")}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-amber-500">
                      {balance.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1" asChild data-testid="button-deposit">
            <a href="/wallet">
              <ArrowDownRight className="h-4 w-4 mr-2" />
              {t("profile.deposit")}
            </a>
          </Button>
          <Button variant="outline" className="flex-1" asChild data-testid="button-withdraw">
            <a href="/wallet">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              {t("profile.withdraw")}
            </a>
          </Button>
        </div>

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              {t("profile.history")}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <Wallet className="h-4 w-4" />
              {t("profile.transactions")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-0">
                {betsLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : bets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "th" ? "ยังไม่มีประวัติการแทง" : "No betting history yet"}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "th" ? "หวย" : "Lottery"}</TableHead>
                        <TableHead>{language === "th" ? "ประเภท" : "Type"}</TableHead>
                        <TableHead className="text-center">{language === "th" ? "เลข" : "Number"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "เงินแทง" : "Amount"}</TableHead>
                        <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bets.map((bet) => (
                        <TableRow key={bet.id}>
                          <TableCell className="font-medium">
                            {lotteryTypeNames[bet.lotteryType as keyof typeof lotteryTypeNames]?.[language] || bet.lotteryType}
                          </TableCell>
                          <TableCell>
                            {betTypeNames[bet.betType as keyof typeof betTypeNames]?.[language] || bet.betType}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold">
                            {bet.numbers}
                          </TableCell>
                          <TableCell className="text-right">
                            {bet.amount.toLocaleString()}
                            {bet.status === "won" && bet.potentialWin && (
                              <span className="text-green-500 block text-xs">
                                +{bet.potentialWin.toLocaleString()}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(bet.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardContent className="p-0">
                {txLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "th" ? "ยังไม่มีรายการธุรกรรม" : "No transactions yet"}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "th" ? "ประเภท" : "Type"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "จำนวน" : "Amount"}</TableHead>
                        <TableHead>{language === "th" ? "อ้างอิง" : "Reference"}</TableHead>
                        <TableHead>{language === "th" ? "วันที่" : "Date"}</TableHead>
                        <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(tx.type)}
                              {getTransactionLabel(tx.type)}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                          <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{getStatusBadge(tx.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
