import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/store";
import { 
  lotteryTypes, 
  lotteryTypeNames, 
  betTypeNames,
  type LotteryType, 
  type BetType 
} from "@shared/schema";
import {
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Search,
  DollarSign,
  BarChart3,
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface BetResult {
  id: number;
  numbers: string;
  amount: number;
  status: string;
  winAmount: number | null;
  matchedNumber: string | null;
  processedAt: string | null;
}

interface BetTypeResult {
  betType: string;
  purchased: boolean;
  bets: BetResult[];
  totalBets: number;
  wonCount: number;
  totalWinAmount: number;
  message: string;
}

interface LotteryResultInfo {
  firstPrize: string | null;
  twoDigitBottom: string | null;
  isProcessed: boolean;
  processedAt: string | null;
}

interface SelfCheckResponse {
  userId: number;
  lotteryType: string;
  drawDate: string;
  lotteryResult: LotteryResultInfo | null;
  betTypeResults: BetTypeResult[];
  summary: {
    totalBetTypes: number;
    totalBets: number;
    totalWonBets: number;
    totalWinnings: number;
    isProcessed: boolean;
  };
}

export default function SelfCheck() {
  const { language } = useI18n();
  const { user } = useUser();
  const [lotteryType, setLotteryType] = useState<LotteryType | "">("");
  const [drawDate, setDrawDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: checkResult, isLoading, refetch, isFetching } = useQuery<SelfCheckResponse>({
    queryKey: ["/api/users", user?.id, "bets-check", lotteryType, drawDate],
    queryFn: async () => {
      if (!user?.id || !lotteryType || !drawDate) {
        throw new Error("Missing parameters");
      }
      const lotteryTypeParam = encodeURIComponent(lotteryType);
      const drawDateParam = encodeURIComponent(drawDate);
      const res = await apiRequest("GET", `/api/users/${user.id}/bets-check?lotteryType=${lotteryTypeParam}&drawDate=${drawDateParam}`);
      return res.json();
    },
    enabled: false,
  });

  const handleSearch = () => {
    if (user?.id && lotteryType && drawDate) {
      refetch();
    }
  };

  const getBetStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "lost":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getBetTypeStatusBadge = (result: BetTypeResult, betType: string) => {
    if (!result.purchased) {
      return (
        <Badge variant="outline" className="gap-1" data-testid={`badge-status-${betType}-not-purchased`}>
          <AlertCircle className="h-3 w-3" />
          {language === "th" ? "ไม่ได้ซื้อ" : "Not Purchased"}
        </Badge>
      );
    }
    
    if (result.wonCount > 0) {
      return (
        <Badge className="bg-green-500 gap-1" data-testid={`badge-status-${betType}-won`}>
          <Trophy className="h-3 w-3" />
          {language === "th" ? "ถูกรางวัล!" : "Winner!"}
        </Badge>
      );
    }
    
    if (result.bets[0]?.status === "pending") {
      return (
        <Badge variant="secondary" className="gap-1" data-testid={`badge-status-${betType}-pending`}>
          <Clock className="h-3 w-3" />
          {language === "th" ? "รอประมวลผล" : "Pending"}
        </Badge>
      );
    }
    
    return (
      <Badge variant="destructive" className="gap-1" data-testid={`badge-status-${betType}-lost`}>
        <XCircle className="h-3 w-3" />
        {language === "th" ? "ไม่ถูกรางวัล" : "No Win"}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-lg font-medium">{language === "th" ? "กรุณาเข้าสู่ระบบก่อน" : "Please log in first"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            {language === "th" ? "ตรวจสอบผลรางวัล" : "Check Your Results"}
          </h1>
          <p className="text-muted-foreground">
            {language === "th" ? "ตรวจสอบว่าคุณถูกรางวัลหรือไม่" : "Check if you won any prizes"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            {language === "th" ? "เลือกงวดที่ต้องการตรวจ" : "Select Draw to Check"}
          </CardTitle>
          <CardDescription>
            {language === "th" 
              ? "เลือกประเภทหวยและวันที่ออกรางวัลเพื่อตรวจสอบโพยของคุณ" 
              : "Select lottery type and draw date to check your bets"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{language === "th" ? "ประเภทหวย" : "Lottery Type"}</Label>
              <Select
                value={lotteryType}
                onValueChange={(value: LotteryType) => setLotteryType(value)}
              >
                <SelectTrigger data-testid="select-lottery-type">
                  <SelectValue placeholder={language === "th" ? "เลือกประเภท" : "Select type"} />
                </SelectTrigger>
                <SelectContent>
                  {lotteryTypes.map((type) => (
                    <SelectItem key={type} value={type} data-testid={`select-item-lottery-${type}`}>
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
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
                data-testid="input-draw-date"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={!lotteryType || !drawDate || isLoading || isFetching}
                className="w-full md:w-auto"
                data-testid="button-check-results"
              >
                {isLoading || isFetching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {language === "th" ? "ตรวจสอบ" : "Check"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {(isLoading || isFetching) && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {checkResult && !isLoading && !isFetching && (
        <>
          {checkResult.lotteryResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {language === "th" ? "ผลรางวัลงวดนี้" : "Draw Results"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === "th" ? "รางวัลที่ 1" : "First Prize"}
                    </p>
                    <p className="text-2xl font-bold font-mono" data-testid="text-first-prize">
                      {checkResult.lotteryResult.firstPrize || "-"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === "th" ? "2 ตัวล่าง" : "2 Bottom"}
                    </p>
                    <p className="text-2xl font-bold font-mono" data-testid="text-two-bottom">
                      {checkResult.lotteryResult.twoDigitBottom || "-"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === "th" ? "สถานะ" : "Status"}
                    </p>
                    <div className="flex justify-center">
                      {checkResult.lotteryResult.isProcessed ? (
                        <Badge className="bg-green-500" data-testid="badge-processed">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {language === "th" ? "ประมวลผลแล้ว" : "Processed"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" data-testid="badge-pending">
                          <Clock className="h-3 w-3 mr-1" />
                          {language === "th" ? "รอประมวลผล" : "Pending"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === "th" ? "โพยที่ซื้อ" : "Your Bets"}
                    </p>
                    <p className="text-2xl font-bold" data-testid="text-total-bets">
                      {checkResult.summary.totalBets}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {language === "th" ? "โพยถูกรางวัล" : "Winning Bets"}
                    </p>
                    <p className="text-2xl font-bold" data-testid="text-won-bets">
                      {checkResult.summary.totalWonBets}
                    </p>
                  </div>
                  <Trophy className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {language === "th" ? "เงินรางวัลรวม" : "Total Winnings"}
                    </p>
                    <p className="text-2xl font-bold" data-testid="text-total-winnings">
                      {checkResult.summary.totalWinnings.toLocaleString()} ฿
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {language === "th" ? "ประเภทที่ซื้อ" : "Bet Types"}
                    </p>
                    <p className="text-2xl font-bold" data-testid="text-bet-types">
                      {checkResult.summary.totalBetTypes}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {language === "th" ? "ผลการตรวจสอบทุกประเภท" : "Results by Bet Type"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table data-testid="table-bet-type-results">
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "th" ? "ประเภท" : "Bet Type"}</TableHead>
                    <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                    <TableHead>{language === "th" ? "จำนวนโพย" : "Bets"}</TableHead>
                    <TableHead>{language === "th" ? "ถูกรางวัล" : "Won"}</TableHead>
                    <TableHead>{language === "th" ? "เงินรางวัล" : "Winnings"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkResult.betTypeResults.map((result) => (
                    <TableRow 
                      key={result.betType} 
                      className={result.wonCount > 0 ? "bg-green-50 dark:bg-green-950/20" : ""}
                      data-testid={`row-bet-type-${result.betType}`}
                    >
                      <TableCell className="font-medium">
                        {betTypeNames[result.betType as BetType]?.[language] || result.betType}
                      </TableCell>
                      <TableCell>
                        {getBetTypeStatusBadge(result, result.betType)}
                      </TableCell>
                      <TableCell>
                        {result.purchased ? result.totalBets : "-"}
                      </TableCell>
                      <TableCell>
                        {result.purchased ? (
                          <span className={result.wonCount > 0 ? "font-bold text-green-600" : ""}>
                            {result.wonCount}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {result.purchased ? (
                          <span className={result.totalWinAmount > 0 ? "font-bold text-green-600" : ""}>
                            {result.totalWinAmount > 0 ? `${result.totalWinAmount.toLocaleString()} ฿` : "0 ฿"}
                          </span>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {checkResult.betTypeResults.some(r => r.purchased && r.bets.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {language === "th" ? "รายละเอียดโพยที่ซื้อ" : "Your Bet Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table data-testid="table-bet-details">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "th" ? "ประเภท" : "Type"}</TableHead>
                      <TableHead>{language === "th" ? "เลขที่ซื้อ" : "Numbers"}</TableHead>
                      <TableHead>{language === "th" ? "เดิมพัน" : "Bet"}</TableHead>
                      <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                      <TableHead>{language === "th" ? "เลขที่ถูก" : "Matched"}</TableHead>
                      <TableHead>{language === "th" ? "เงินรางวัล" : "Win"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkResult.betTypeResults
                      .filter(r => r.purchased && r.bets.length > 0)
                      .flatMap(result => 
                        result.bets.map(bet => (
                          <TableRow 
                            key={bet.id} 
                            className={bet.status === "won" ? "bg-green-50 dark:bg-green-950/20" : ""}
                            data-testid={`row-bet-${bet.id}`}
                          >
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {betTypeNames[result.betType as BetType]?.[language] || result.betType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono font-medium">{bet.numbers}</TableCell>
                            <TableCell>{bet.amount.toLocaleString()} ฿</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1" data-testid={`status-bet-${bet.id}-${bet.status}`}>
                                {getBetStatusIcon(bet.status)}
                                <span className="text-xs">
                                  {bet.status === "won" && (language === "th" ? "ถูก" : "Won")}
                                  {bet.status === "lost" && (language === "th" ? "ไม่ถูก" : "Lost")}
                                  {bet.status === "pending" && (language === "th" ? "รอ" : "Pending")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono font-bold text-green-600">
                              {bet.matchedNumber || "-"}
                            </TableCell>
                            <TableCell className={bet.winAmount ? "font-bold text-green-600" : ""}>
                              {bet.winAmount ? `${bet.winAmount.toLocaleString()} ฿` : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {!checkResult.lotteryResult && (
            <Card className="border-yellow-500/50">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <p className="text-lg font-medium mb-2">
                  {language === "th" ? "ยังไม่มีผลรางวัลงวดนี้" : "No results for this draw yet"}
                </p>
                <p className="text-muted-foreground">
                  {language === "th" 
                    ? "กรุณารอผลรางวัลออกก่อนตรวจสอบ" 
                    : "Please wait for the draw results to be announced"}
                </p>
              </CardContent>
            </Card>
          )}

          {checkResult.summary.totalBets === 0 && (
            <Card className="border-muted">
              <CardContent className="p-6 text-center">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {language === "th" ? "คุณไม่ได้ซื้อโพยงวดนี้" : "You didn't buy any bets for this draw"}
                </p>
                <p className="text-muted-foreground">
                  {language === "th" 
                    ? "ลองเลือกงวดอื่นหรือซื้อโพยก่อนตรวจสอบ" 
                    : "Try selecting a different draw or buy tickets first"}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
