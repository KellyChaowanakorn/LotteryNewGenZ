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
}

interface ThaiGovResult {
  status: string;
  response: {
    date: string;
    prizes: Array<{
      id: string;
      name: string;
      number: string[];
    }>;
    runningNumbers: Array<{
      id: string;
      name: string;
      number: string[];
    }>;
  };
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
  const { data, isLoading, error, refetch } = useQuery<ThaiGovResult>({
    queryKey: ["/api/results/live/thai-gov"],
    refetchInterval: 60000, // refresh every 1 minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.status !== "success") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{lotteryTypeNames.THAI_GOV[language]}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === "th" ? "ไม่สามารถโหลดข้อมูลได้" : "Failed to load data"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const firstPrize = data.response.prizes.find((p) => p.id === "prizeFirst")?.number[0];
  const threeTop = data.response.runningNumbers.find((r) => r.id === "runningNumberFrontThree")?.number || [];
  const twoBottom = data.response.runningNumbers.find((r) => r.id === "runningNumberBackTwo")?.number[0];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {lotteryTypeNames.THAI_GOV[language]}
          </span>
          <Badge variant="outline" className="gap-1">
            <Wifi className="h-3 w-3 text-green-500" />
            {language === "th" ? "สด" : "Live"}
          </Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {data.response.date}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            {language === "th" ? "รางวัลที่ 1" : "First Prize"}
          </p>
          <p className="text-4xl font-bold tracking-wider font-mono">
            {firstPrize || "---"}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">
              {language === "th" ? "3 ตัวบน" : "3D Top"}
            </p>
            <div className="flex flex-wrap gap-1 justify-center">
              {threeTop.slice(0, 2).map((num, i) => (
                <span key={i} className="text-sm font-bold font-mono">{num}</span>
              ))}
            </div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">
              {language === "th" ? "2 ตัวล่าง" : "2D Bottom"}
            </p>
            <p className="text-lg font-bold font-mono">{twoBottom || "--"}</p>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {language === "th" ? "รีเฟรช" : "Refresh"}
        </Button>
      </CardContent>
    </Card>
  );
}

function StockCard({ lotteryType, language }: { lotteryType: LotteryType; language: Language }) {
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
    refetchInterval: 30000, // refresh every 30 seconds
  });

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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-blue-500" />
            {lotteryTypeNames[lotteryType][language]}
          </span>
          <Badge variant={data.marketState === "REGULAR" ? "default" : "secondary"}>
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

        <Button variant="outline" className="w-full" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
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