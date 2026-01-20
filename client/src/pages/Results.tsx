import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useI18n, type Language } from "@/lib/i18n";
import { lotteryTypeNames, type LotteryType } from "@shared/schema";
import {
  Trophy,
  ExternalLink,
  Clock,
  Wifi,
  RefreshCw,
  Landmark,
  TrendingUp,
  Globe,
  Zap,
  AlertCircle,
  TrendingUp as TrendingUpIcon,
  TrendingDown,
} from "lucide-react";

// ------------------ TYPE DEFINITIONS ------------------

interface LotteryResult {
  lotteryType: string;
  date: string;
  firstPrize?: string;
  threeDigitTop?: string;
  threeDigitBottom?: string;
  twoDigitTop?: string;
  twoDigitBottom?: string;
  source: string;
  error?: string;
}

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

interface ThaiGovResult {
  status: string;
  response: {
    date: string;
    endpoint?: string;
    prizes: Array<{
      id: string;
      name: string;
      reward?: string;
      number: string[];
    }>;
    runningNumbers: Array<{
      id: string;
      name: string;
      reward?: string;
      number: string[];
    }>;
  };
  error?: string;
}

// ------------------ CONSTANTS ------------------

const externalUrls: Record<LotteryType, string> = {
  THAI_GOV: "https://www.glo.or.th/",
  THAI_STOCK: "https://www.set.or.th/th/market/index/set/overview",
  STOCK_NIKKEI: "https://www.investing.com/indices/japan-ni225",
  STOCK_DOW: "https://www.investing.com/indices/us-30",
  STOCK_FTSE: "https://www.investing.com/indices/uk-100",
  STOCK_DAX: "https://www.investing.com/indices/germany-30",
  LAO: "https://www.sanook.com/news/laolotto/",
  HANOI: "https://www.sealotto.com/en/vietnam/hanoi",
  MALAYSIA: "https://www.check4d.org/",
  SINGAPORE: "https://www.singaporepools.com.sg/en/product/Pages/4d_results.aspx",
  KENO: "https://nclottery.com/keno-results",
};

const categories: Record<string, LotteryType[]> = {
  thai: ["THAI_GOV", "THAI_STOCK"],
  stock: ["STOCK_NIKKEI", "STOCK_DOW", "STOCK_FTSE", "STOCK_DAX"],
  foreign: ["LAO", "MALAYSIA", "SINGAPORE", "HANOI"],
  instant: ["KENO"],
};

const categoryIcons: Record<string, JSX.Element> = {
  thai: <Landmark className="h-4 w-4" />,
  stock: <TrendingUp className="h-4 w-4" />,
  foreign: <Globe className="h-4 w-4" />,
  instant: <Zap className="h-4 w-4" />,
};

const categoryNames: Record<string, Record<Language, string>> = {
  thai: { th: "หวยไทย", en: "Thai Lottery" },
  stock: { th: "หวยหุ้น", en: "Stock Market" },
  foreign: { th: "หวยต่างประเทศ", en: "Foreign Lottery" },
  instant: { th: "เกมส์ทันที", en: "Instant Games" },
};

// ------------------ COMPONENTS ------------------

function ThaiGovCard({ language }: { language: Language }) {
  const [isRefetching, setIsRefetching] = useState(false);
  const { data, isLoading, error, refetch } = useQuery<ThaiGovResult>({
    queryKey: ["/api/results/live/thai-gov"],
    refetchInterval: 60000, // refresh every 1 minute
    staleTime: 30000,
  });

  const handleRefetch = async () => {
    setIsRefetching(true);
    await refetch();
    setIsRefetching(false);
  };

  if (isLoading) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full mb-4" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.status !== "success") {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {lotteryTypeNames.THAI_GOV[language]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === "th" ? "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่" : "Failed to load data. Please try again."}
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="w-full" onClick={handleRefetch}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            {language === "th" ? "ลองใหม่" : "Try Again"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const firstPrize = data.response.prizes.find((p) => p.id === "prizeFirst")?.number[0];
  const threeTop = data.response.runningNumbers.find((r) => r.id === "runningNumberFrontThree")?.number || [];
  const threeBottom = data.response.runningNumbers.find((r) => r.id === "runningNumberBackThree")?.number || [];
  const twoBottom = data.response.runningNumbers.find((r) => r.id === "runningNumberBackTwo")?.number[0];

  return (
    <Card className="md:col-span-2 hover:shadow-lg transition-shadow border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            {lotteryTypeNames.THAI_GOV[language]}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
              <Wifi className="h-3 w-3" />
              {language === "th" ? "สด" : "Live"}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          {data.response.date}
          <span className="text-xs text-muted-foreground">• {data.response.endpoint}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* รางวัลที่ 1 */}
        <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50 rounded-xl border border-yellow-200 dark:border-yellow-900">
          <p className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            {language === "th" ? "รางวัลที่ 1" : "First Prize"}
          </p>
          <p className="text-5xl md:text-6xl font-bold tracking-wider font-mono text-yellow-600 dark:text-yellow-400">
            {firstPrize || "------"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {language === "th" ? "รางวัล 6,000,000 บาท" : "Prize: 6,000,000 THB"}
          </p>
        </div>
        
        {/* เลขท้าย 2 ตัว */}
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border border-blue-200 dark:border-blue-900">
          <p className="text-sm text-muted-foreground mb-2">
            {language === "th" ? "รางวัลเลขท้าย 2 ตัว" : "Last 2 Digits"}
          </p>
          <p className="text-4xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {twoBottom || "--"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {language === "th" ? "รางวัล 2,000 บาท" : "Prize: 2,000 THB"}
          </p>
        </div>

        {/* เลข 3 ตัว */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted rounded-xl">
            <p className="text-xs text-muted-foreground mb-2">
              {language === "th" ? "รางวัลเลขหน้า 3 ตัว" : "First 3 Digits"}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {threeTop.length > 0 ? (
                threeTop.map((num, i) => (
                  <span key={i} className="text-xl font-bold font-mono bg-primary/10 px-3 py-1 rounded-lg">
                    {num}
                  </span>
                ))
              ) : (
                <span className="text-xl font-bold font-mono">---</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "th" ? "รางวัล 4,000 บาท" : "Prize: 4,000 THB"}
            </p>
          </div>
          <div className="text-center p-4 bg-muted rounded-xl">
            <p className="text-xs text-muted-foreground mb-2">
              {language === "th" ? "รางวัลเลขท้าย 3 ตัว" : "Last 3 Digits"}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {threeBottom.length > 0 ? (
                threeBottom.map((num, i) => (
                  <span key={i} className="text-xl font-bold font-mono bg-primary/10 px-3 py-1 rounded-lg">
                    {num}
                  </span>
                ))
              ) : (
                <span className="text-xl font-bold font-mono">---</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "th" ? "รางวัล 4,000 บาท" : "Prize: 4,000 THB"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleRefetch} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            {language === "th" ? "รีเฟรช" : "Refresh"}
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <a href="https://www.glo.or.th/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              {language === "th" ? "GLO" : "GLO"}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StockCard({ lotteryType, language }: { lotteryType: LotteryType; language: Language }) {
  const [isRefetching, setIsRefetching] = useState(false);
  const stockSymbolMap: Record<string, string> = {
    STOCK_NIKKEI: "NIKKEI",
    STOCK_DOW: "DOW",
    STOCK_FTSE: "FTSE",
    STOCK_DAX: "DAX",
  };

  const apiUrl = lotteryType === "THAI_STOCK" 
    ? "/api/results/live/thai-stock"
    : `/api/results/live/stock/${stockSymbolMap[lotteryType]}`;

  const { data, isLoading, error, refetch } = useQuery<StockResult>({
    queryKey: [apiUrl],
    refetchInterval: lotteryType === "THAI_STOCK" ? 15000 : 30000, // Thai stock refresh faster
  });

  const handleRefetch = async () => {
    setIsRefetching(true);
    await refetch();
    setIsRefetching(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{lotteryTypeNames[lotteryType][language]}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === "th" ? "ไม่สามารถโหลดข้อมูลได้" : "Failed to load data"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.change >= 0;
  const isThaiStock = lotteryType === "THAI_STOCK";
  const isMarketOpen = data.marketState === "OPEN" || data.marketState === "REGULAR";

  // For Thai Stock, show enhanced card
  if (isThaiStock) {
    return (
      <Card className="hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-blue-500" />
              {language === "th" ? "หุ้นไทย (SET Index)" : "Thai Stock (SET Index)"}
            </span>
            <Badge 
              variant={isMarketOpen ? "default" : "secondary"}
              className={isMarketOpen ? "bg-green-500" : ""}
            >
              {isMarketOpen 
                ? (language === "th" ? "ตลาดเปิด" : "OPEN") 
                : (language === "th" ? "ตลาดปิด" : "CLOSED")
              }
            </Badge>
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {data.date}
            <span className="text-xs">• {data.source}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Display */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SET Index</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
                  {isPositive ? <TrendingUpIcon className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span className="font-bold text-lg">{data.changePercent.toFixed(2)}%</span>
                </div>
                <p className="text-sm">{isPositive ? "+" : ""}{data.change.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Lottery Numbers - Large Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-muted-foreground mb-2">
                {language === "th" ? "3 ตัวตรง" : "3D Straight"}
              </p>
              <p className="text-4xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {data.threeDigit}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "th" ? "จ่าย x900" : "Payout x900"}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 rounded-xl border border-orange-200 dark:border-orange-800">
              <p className="text-xs text-muted-foreground mb-2">
                {language === "th" ? "2 ตัวตรง" : "2D Straight"}
              </p>
              <p className="text-4xl font-bold font-mono text-orange-600 dark:text-orange-400">
                {data.twoDigit}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "th" ? "จ่าย x90" : "Payout x90"}
              </p>
            </div>
          </div>

          {/* Info about calculation */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 {language === "th" 
                ? `คำนวณจาก SET ${data.price.toFixed(2)} → ตัดจุดทศนิยม = ${data.price.toFixed(2).replace(".", "")} → 3 ตัวท้าย = ${data.threeDigit}, 2 ตัวท้าย = ${data.twoDigit}`
                : `Calculated from SET ${data.price.toFixed(2)} → Remove decimal = ${data.price.toFixed(2).replace(".", "")} → Last 3 = ${data.threeDigit}, Last 2 = ${data.twoDigit}`
              }
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleRefetch} disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
              {language === "th" ? "รีเฟรช" : "Refresh"}
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <a href="https://www.set.or.th/th/market/index/set/overview" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                SET
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For international stocks
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-blue-500" />
            {lotteryTypeNames[lotteryType][language]}
          </span>
          <Badge variant={isMarketOpen ? "default" : "secondary"}>
            {data.marketState}
          </Badge>
        </CardTitle>
        <CardDescription>{data.date}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">{language === "th" ? "ราคา" : "Price"}</p>
            <p className="text-2xl font-bold">{data.price.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? <TrendingUpIcon className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-semibold">{data.changePercent.toFixed(2)}%</span>
            </div>
            <p className="text-sm">{isPositive ? "+" : ""}{data.change.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">
              {language === "th" ? "3 ตัว" : "3D"}
            </p>
            <p className="text-xl font-bold font-mono">{data.threeDigit}</p>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">
              {language === "th" ? "2 ตัว" : "2D"}
            </p>
            <p className="text-xl font-bold font-mono">{data.twoDigit}</p>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleRefetch} disabled={isRefetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          {language === "th" ? "รีเฟรช" : "Refresh"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ForeignLotteryCard({ language }: { language: Language }) {
  const { data, isLoading, error, refetch } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/live/foreign"],
    refetchInterval: 120000, // refresh every 2 minutes
  });

  if (isLoading) {
    return (
      <>
        {["LAO", "MALAYSIA", "SINGAPORE"].map((type) => (
          <Card key={type}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  if (error || !data) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === "th" ? "ไม่สามารถโหลดข้อมูลหวยต่างประเทศได้" : "Failed to load foreign lottery data"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {data.map((result) => (
        <Card key={result.lotteryType} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-500" />
                {lotteryTypeNames[result.lotteryType as LotteryType][language]}
              </span>
              {result.error ? (
                <Badge variant="destructive">{language === "th" ? "ข้อผิดพลาด" : "Error"}</Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Wifi className="h-3 w-3 text-green-500" />
                  {language === "th" ? "สด" : "Live"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{result.date}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.error ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    {language === "th" ? "รางวัลที่ 1" : "First Prize"}
                  </p>
                  <p className="text-3xl font-bold tracking-wider font-mono">
                    {result.firstPrize || "N/A"}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === "th" ? "3 ตัว" : "3D"}
                    </p>
                    <p className="text-lg font-bold font-mono">{result.threeDigitTop || "---"}</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === "th" ? "2 ตัว" : "2D"}
                    </p>
                    <p className="text-lg font-bold font-mono">{result.twoDigitTop || "--"}</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full" asChild>
                  <a href={externalUrls[result.lotteryType as LotteryType]} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {language === "th" ? "ดูผลหวย" : "View Results"}
                  </a>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}

// ------------------ MAIN COMPONENT ------------------

export default function Results() {
  const { language, t } = useI18n();
  const [activeTab, setActiveTab] = useState("thai");

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            {t("results.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "th" ? "ผลหวยทุกประเภท อัพเดทแบบเรียลไทม์" : "All lottery results, updated in real-time"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {Object.keys(categories).map((cat) => (
            <TabsTrigger key={cat} value={cat} className="gap-2">
              {categoryIcons[cat]}
              {categoryNames[cat][language]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Thai Lotteries */}
        <TabsContent value="thai" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <ThaiGovCard language={language} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <StockCard lotteryType="THAI_STOCK" language={language} />
          </div>
        </TabsContent>

        {/* Stock Markets */}
        <TabsContent value="stock" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.stock.map((type) => (
              <StockCard key={type} lotteryType={type} language={language} />
            ))}
          </div>
        </TabsContent>

        {/* Foreign Lotteries */}
        <TabsContent value="foreign" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ForeignLotteryCard language={language} />
          </div>
        </TabsContent>

        {/* Instant Games */}
        <TabsContent value="instant" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                {lotteryTypeNames.KENO[language]}
              </CardTitle>
              <CardDescription>
                {language === "th" ? "เร็วๆ นี้" : "Coming Soon"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  {language === "th" 
                    ? "ระบบเกมส์คีโนจะเปิดให้บริการเร็วๆ นี้" 
                    : "Keno game system coming soon"}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}