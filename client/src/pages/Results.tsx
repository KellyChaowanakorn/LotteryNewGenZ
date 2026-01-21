import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useI18n } from "@/lib/i18n";
import { lotteryTypeNames } from "@shared/schema";
import { Trophy, ExternalLink, Wifi, RefreshCw, Landmark, TrendingUp, Globe, AlertCircle, TrendingDown } from "lucide-react";

interface StockResult {
  lotteryType: string;
  date: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  twoDigit: string;
  threeDigit: string;
  marketState: string;
  source: string;
  error?: string;
}

interface MalaysiaResult {
  lotteryType: string;
  date: string;
  company: string;
  firstPrize: string;
  secondPrize: string;
  thirdPrize: string;
  source: string;
  error?: string;
}

interface ThaiGovResult {
  status: string;
  response: {
    date: string;
    endpoint?: string;
    prizes: Array<{ id: string; name: string; reward?: string; number: string[] }>;
    runningNumbers: Array<{ id: string; name: string; reward?: string; number: string[] }>;
  };
  error?: string;
}

// Tab 1: Thai Government Lottery
function ThaiGovCard({ language }: { language: string }) {
  const { data, isLoading, refetch, isFetching } = useQuery<ThaiGovResult>({
    queryKey: ["/api/results/live/thai-gov"],
    refetchInterval: 60000,
  });

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  const result = data?.response;
  const firstPrize = result?.prizes?.find((p) => p.id === "prizeFirst")?.number?.[0];
  const twoDigit = result?.runningNumbers?.find((r) => r.id === "runningNumberBackTwo")?.number?.[0];
  const threeTop = result?.runningNumbers?.find((r) => r.id === "runningNumberFrontThree")?.number || [];
  const threeBottom = result?.runningNumbers?.find((r) => r.id === "runningNumberBackThree")?.number || [];

  return (
    <Card className="col-span-full border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
              {language === "th" ? "รัฐบาลไทย" : "Thai Government"}
              <Badge variant="outline" className="ml-2"><Wifi className="h-3 w-3 mr-1 text-green-500" />{language === "th" ? "สด" : "Live"}</Badge>
            </CardTitle>
            <CardDescription className="mt-1">📅 {result?.date} • {result?.endpoint || "API"}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.error ? (
          <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>{data.error}</AlertDescription></Alert>
        ) : (
          <>
            <div className="text-center p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl">
              <p className="text-sm text-muted-foreground mb-2">🏆 {language === "th" ? "รางวัลที่ 1" : "First Prize"}</p>
              <p className="text-5xl font-bold tracking-[0.2em] text-yellow-500 font-mono">{firstPrize || "------"}</p>
              <p className="text-sm text-muted-foreground mt-2">{language === "th" ? "รางวัล 6,000,000 บาท" : "Prize 6,000,000 Baht"}</p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-xl text-center">
              <p className="text-sm text-muted-foreground mb-1">{language === "th" ? "รางวัลเลขท้าย 2 ตัว" : "Last 2 Digits"}</p>
              <p className="text-4xl font-bold text-blue-500 font-mono">{twoDigit || "--"}</p>
              <p className="text-sm text-muted-foreground mt-1">{language === "th" ? "รางวัล 2,000 บาท" : "Prize 2,000 Baht"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-2">{language === "th" ? "รางวัลเลขหน้า 3 ตัว" : "Front 3 Digits"}</p>
                <div className="flex justify-center gap-2">{threeTop.map((n, i) => <span key={i} className="bg-background px-3 py-1 rounded font-mono font-bold">{n}</span>)}</div>
              </div>
              <div className="p-4 bg-muted rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-2">{language === "th" ? "รางวัลเลขท้าย 3 ตัว" : "Back 3 Digits"}</p>
                <div className="flex justify-center gap-2">{threeBottom.map((n, i) => <span key={i} className="bg-background px-3 py-1 rounded font-mono font-bold">{n}</span>)}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />{language === "th" ? "รีเฟรช" : "Refresh"}</Button>
              <Button variant="outline" className="flex-1" asChild><a href="https://www.glo.or.th/" target="_blank"><ExternalLink className="h-4 w-4 mr-2" />GLO</a></Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Tab 2: Thai Stock (SET)
function ThaiStockCard({ language }: { language: string }) {
  const { data, isLoading, refetch, isFetching } = useQuery<StockResult>({
    queryKey: ["/api/results/live/thai-stock"],
    refetchInterval: 15000,
  });

  if (isLoading) return <Skeleton className="h-[350px] w-full" />;

  const isUp = (data?.change || 0) >= 0;

  return (
    <Card className="col-span-full border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
              {language === "th" ? "หุ้นไทย (SET Index)" : "Thai Stock (SET Index)"}
              <Badge variant={data?.marketState === "OPEN" ? "default" : "secondary"} className="ml-2">
                {data?.marketState === "OPEN" ? (language === "th" ? "ตลาดเปิด" : "Market Open") : (language === "th" ? "ตลาดปิด" : "Market Closed")}
              </Badge>
            </CardTitle>
            <CardDescription>📅 {data?.date} • {data?.source}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.error ? (
          <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>{data.error}</AlertDescription></Alert>
        ) : (
          <>
            <div className="p-6 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">SET Index</p>
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-emerald-500">{data?.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className={`flex items-center text-lg ${isUp ? "text-green-500" : "text-red-500"}`}>
                  {isUp ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {isUp ? "+" : ""}{data?.changePercent?.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-emerald-500/10 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-2">{language === "th" ? "3 ตัวตรง" : "3D Straight"}</p>
                <p className="text-4xl font-bold text-emerald-500 font-mono">{data?.threeDigit}</p>
                <p className="text-xs text-muted-foreground mt-1">{language === "th" ? "จ่าย x900" : "Payout x900"}</p>
              </div>
              <div className="p-6 bg-orange-500/10 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-2">{language === "th" ? "2 ตัวตรง" : "2D Straight"}</p>
                <p className="text-4xl font-bold text-orange-500 font-mono">{data?.twoDigit}</p>
                <p className="text-xs text-muted-foreground mt-1">{language === "th" ? "จ่าย x90" : "Payout x90"}</p>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 {language === "th" ? `คำนวณจาก SET ${data?.price?.toFixed(2)} → ตัดจุดทศนิยม = ${data?.price?.toFixed(2).replace(".", "")} → 3 ตัวท้าย = ${data?.threeDigit}, 2 ตัวท้าย = ${data?.twoDigit}` : `Calculated from SET ${data?.price?.toFixed(2)} → Last 3 = ${data?.threeDigit}, Last 2 = ${data?.twoDigit}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />{language === "th" ? "รีเฟรช" : "Refresh"}</Button>
              <Button variant="outline" className="flex-1" asChild><a href="https://www.set.or.th/" target="_blank"><ExternalLink className="h-4 w-4 mr-2" />SET</a></Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Tab 3: Malaysia 4D
function MalaysiaCard({ language }: { language: string }) {
  const { data, isLoading, refetch, isFetching } = useQuery<MalaysiaResult[]>({
    queryKey: ["/api/results/live/malaysia"],
    refetchInterval: 60000,
  });

  if (isLoading) return <Skeleton className="h-[300px] w-full" />;

  return (
    <>
      {data?.map((result, idx) => (
        <Card key={idx} className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              {result.company}
              {result.error && <Badge variant="secondary">{language === "th" ? "รอผล" : "Pending"}</Badge>}
            </CardTitle>
            <CardDescription>📅 {result.date} • {result.source}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.error ? (
              <Alert><AlertDescription>{result.error}</AlertDescription></Alert>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-yellow-500/20 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">{language === "th" ? "รางวัลที่ 1" : "1st Prize"}</p>
                    <p className="text-2xl font-bold text-yellow-500 font-mono">{result.firstPrize}</p>
                  </div>
                  <div className="p-4 bg-gray-500/20 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">{language === "th" ? "รางวัลที่ 2" : "2nd Prize"}</p>
                    <p className="text-2xl font-bold text-gray-500 font-mono">{result.secondPrize}</p>
                  </div>
                  <div className="p-4 bg-orange-500/20 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">{language === "th" ? "รางวัลที่ 3" : "3rd Prize"}</p>
                    <p className="text-2xl font-bold text-orange-500 font-mono">{result.thirdPrize}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
      <div className="col-span-full">
        <Button variant="outline" className="w-full" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />{language === "th" ? "รีเฟรชหวยมาเลย์" : "Refresh Malaysia 4D"}
        </Button>
      </div>
    </>
  );
}

// Tab 4: International Stocks
function InternationalStocksCard({ language }: { language: string }) {
  const { data, isLoading, refetch, isFetching } = useQuery<StockResult[]>({
    queryKey: ["/api/results/live/stocks"],
    refetchInterval: 30000,
  });

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  const stocks = data?.filter(s => s.lotteryType !== "THAI_STOCK") || [];

  const stockInfo: Record<string, { name: { th: string; en: string }; color: string; url: string }> = {
    STOCK_NIKKEI: { name: { th: "นิเคอิ 225", en: "Nikkei 225" }, color: "red", url: "https://www.investing.com/indices/japan-ni225" },
    STOCK_HSI: { name: { th: "ฮั่งเส็ง", en: "Hang Seng" }, color: "orange", url: "https://www.investing.com/indices/hang-sen-40" },
    STOCK_DOW: { name: { th: "ดาวโจนส์", en: "Dow Jones" }, color: "blue", url: "https://www.investing.com/indices/us-30" },
  };

  return (
    <>
      {stocks.map((stock) => {
        const info = stockInfo[stock.lotteryType] || { name: { th: stock.symbol, en: stock.symbol }, color: "gray", url: "#" };
        const isUp = stock.change >= 0;

        return (
          <Card key={stock.lotteryType} className={`border-${info.color}-500/30`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className={`h-5 w-5 text-${info.color}-500`} />
                  {info.name[language as "th" | "en"]}
                </span>
                <Badge variant={stock.marketState === "REGULAR" ? "default" : "secondary"}>
                  {stock.marketState === "REGULAR" ? "OPEN" : "CLOSED"}
                </Badge>
              </CardTitle>
              <CardDescription>📅 {stock.date} • {stock.source}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stock.error ? (
                <Alert><AlertDescription>{stock.error}</AlertDescription></Alert>
              ) : (
                <>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold">{stock.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span className={`flex items-center ${isUp ? "text-green-500" : "text-red-500"}`}>
                      {isUp ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                      {isUp ? "+" : ""}{stock.changePercent?.toFixed(2)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 bg-${info.color}-500/10 rounded-xl text-center`}>
                      <p className="text-xs text-muted-foreground mb-1">3 ตัวตรง</p>
                      <p className={`text-2xl font-bold text-${info.color}-500 font-mono`}>{stock.threeDigit}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-xl text-center">
                      <p className="text-xs text-muted-foreground mb-1">2 ตัวตรง</p>
                      <p className="text-2xl font-bold font-mono">{stock.twoDigit}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={info.url} target="_blank"><ExternalLink className="h-4 w-4 mr-2" />{language === "th" ? "ดูรายละเอียด" : "View Details"}</a>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
      <div className="col-span-full">
        <Button variant="outline" className="w-full" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />{language === "th" ? "รีเฟรชหุ้นต่างประเทศ" : "Refresh International Stocks"}
        </Button>
      </div>
    </>
  );
}

// Main Component
export default function Results() {
  const { language, t } = useI18n();
  const [activeTab, setActiveTab] = useState("thai-gov");

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            {t("results.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{language === "th" ? "ผลหวย 4 หมวด อัพเดทแบบเรียลไทม์" : "4 Categories, Real-time Updates"}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="thai-gov" className="gap-2"><Landmark className="h-4 w-4" />{language === "th" ? "หวยไทย" : "Thai"}</TabsTrigger>
          <TabsTrigger value="thai-stock" className="gap-2"><TrendingUp className="h-4 w-4" />{language === "th" ? "หุ้นไทย" : "SET"}</TabsTrigger>
          <TabsTrigger value="malaysia" className="gap-2"><Globe className="h-4 w-4" />{language === "th" ? "มาเลย์" : "Malaysia"}</TabsTrigger>
          <TabsTrigger value="intl-stock" className="gap-2"><TrendingUp className="h-4 w-4" />{language === "th" ? "หุ้น ตปท" : "Intl Stock"}</TabsTrigger>
        </TabsList>

        <TabsContent value="thai-gov" className="mt-6">
          <div className="grid gap-4"><ThaiGovCard language={language} /></div>
        </TabsContent>

        <TabsContent value="thai-stock" className="mt-6">
          <div className="grid gap-4"><ThaiStockCard language={language} /></div>
        </TabsContent>

        <TabsContent value="malaysia" className="mt-6">
          <div className="grid gap-4 md:grid-cols-3"><MalaysiaCard language={language} /></div>
        </TabsContent>

        <TabsContent value="intl-stock" className="mt-6">
          <div className="grid gap-4 md:grid-cols-3"><InternationalStocksCard language={language} /></div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
