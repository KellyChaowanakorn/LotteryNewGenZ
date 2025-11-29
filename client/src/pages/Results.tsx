import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { lotteryTypeNames, type LotteryType } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { 
  Trophy, 
  ExternalLink, 
  Clock, 
  Wifi, 
  RefreshCw,
  Landmark,
  TrendingUp,
  Globe,
  Zap
} from "lucide-react";
import { useState } from "react";

interface ResultData {
  firstPrize?: string;
  threeTop?: string[];
  threeBottom?: string[];
  twoDigit?: string;
  date: string;
  isLive: boolean;
  externalUrl: string;
}

interface ThaiLottoApiResponse {
  status: string;
  response: {
    date: string;
    endpoint: string;
    prizes: Array<{
      id: string;
      name: string;
      reward: string;
      amount: number;
      number: string[];
    }>;
    runningNumbers: Array<{
      id: string;
      name: string;
      reward: string;
      number: string[];
    }>;
  };
}

const externalUrls: Record<LotteryType, string> = {
  THAI_GOV: "https://www.glo.or.th/",
  THAI_STOCK: "https://lotto.mthai.com/lottery/stock",
  STOCK_NIKKEI: "https://www.investing.com/indices/japan-ni225",
  STOCK_DOW: "https://www.investing.com/indices/us-30",
  STOCK_FTSE: "https://www.investing.com/indices/uk-100",
  STOCK_DAX: "https://www.investing.com/indices/germany-30",
  LAO: "https://www.sanook.com/news/laolotto/",
  HANOI: "https://www.sealotto.com/en/vietnam/hanoi",
  MALAYSIA: "https://www.check4d.org/",
  SINGAPORE: "https://www.singaporepools.com.sg/en/product/Pages/4d_results.aspx",
  YEEKEE: "https://lotto.mthai.com/lottery/yeekee",
  KENO: "https://lotto.mthai.com/lottery/keno"
};

const externalUrlNames: Record<LotteryType, { th: string; en: string }> = {
  THAI_GOV: { th: "สำนักงานสลากกินแบ่งรัฐบาล", en: "GLO Official" },
  THAI_STOCK: { th: "MThai หวยหุ้น", en: "MThai Stock Lottery" },
  STOCK_NIKKEI: { th: "Investing.com Nikkei", en: "Investing.com Nikkei" },
  STOCK_DOW: { th: "Investing.com Dow Jones", en: "Investing.com Dow Jones" },
  STOCK_FTSE: { th: "Investing.com FTSE", en: "Investing.com FTSE" },
  STOCK_DAX: { th: "Investing.com DAX", en: "Investing.com DAX" },
  LAO: { th: "Sanook หวยลาว", en: "Sanook Lao Lottery" },
  HANOI: { th: "SEA Lotto ฮานอย", en: "SEA Lotto Hanoi" },
  MALAYSIA: { th: "Check4D Malaysia", en: "Check4D Malaysia" },
  SINGAPORE: { th: "Singapore Pools 4D", en: "Singapore Pools 4D" },
  YEEKEE: { th: "MThai ยี่กี", en: "MThai Yeekee" },
  KENO: { th: "MThai Keno", en: "MThai Keno" }
};

const categories = {
  thai: ["THAI_GOV", "THAI_STOCK"] as LotteryType[],
  stock: ["STOCK_NIKKEI", "STOCK_DOW", "STOCK_FTSE", "STOCK_DAX"] as LotteryType[],
  foreign: ["LAO", "HANOI", "MALAYSIA", "SINGAPORE"] as LotteryType[],
  instant: ["YEEKEE", "KENO"] as LotteryType[]
};

const categoryIcons = {
  thai: <Landmark className="h-4 w-4" />,
  stock: <TrendingUp className="h-4 w-4" />,
  foreign: <Globe className="h-4 w-4" />,
  instant: <Zap className="h-4 w-4" />
};

function parseThaiLottoResult(data: ThaiLottoApiResponse): ResultData | null {
  if (data.status !== "success" || !data.response) return null;
  
  const { response } = data;
  const firstPrize = response.prizes.find(p => p.id === "prizeFirst")?.number[0];
  const threeTop = response.prizes.find(p => p.id === "prizeFirstNear")?.number || [];
  const last3f = response.runningNumbers.find(r => r.id === "runningNumberFrontThree")?.number || [];
  const last3b = response.runningNumbers.find(r => r.id === "runningNumberBackThree")?.number || [];
  const last2 = response.runningNumbers.find(r => r.id === "runningNumberBackTwo")?.number[0];

  return {
    firstPrize,
    threeTop: [...last3f],
    threeBottom: [...last3b],
    twoDigit: last2,
    date: response.date,
    isLive: true,
    externalUrl: externalUrls.THAI_GOV
  };
}

function ResultCard({ type, thaiGovResult, isLoading, isError }: { 
  type: LotteryType; 
  thaiGovResult?: ResultData | null;
  isLoading?: boolean;
  isError?: boolean;
}) {
  const { language } = useI18n();
  const name = lotteryTypeNames[type][language];
  const externalUrl = externalUrls[type];
  const siteName = externalUrlNames[type][language];
  
  const result = type === "THAI_GOV" && !isError ? thaiGovResult : null;

  if (isLoading && type === "THAI_GOV") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-elevate transition-all" data-testid={`card-result-${type}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">{name}</CardTitle>
          {result ? (
            <Badge variant="secondary" className="gap-1">
              <Wifi className="h-3 w-3" />
              API
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <ExternalLink className="h-3 w-3" />
              {language === "th" ? "ลิงก์ภายนอก" : "External"}
            </Badge>
          )}
        </div>
        {result && (
          <CardDescription className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {result.date}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {result ? (
          <>
            {result.firstPrize && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {language === "th" ? "รางวัลที่ 1" : "First Prize"}
                </p>
                <div className="text-3xl font-bold font-mono tracking-widest text-primary">
                  {result.firstPrize}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {result.threeTop && result.threeTop.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === "th" ? "3 ตัวหน้า" : "Front 3"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.threeTop.map((num, i) => (
                      <Badge key={i} variant="secondary" className="font-mono text-sm">
                        {num}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.threeBottom && result.threeBottom.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === "th" ? "3 ตัวท้าย" : "Back 3"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.threeBottom.map((num, i) => (
                      <Badge key={i} variant="secondary" className="font-mono text-sm">
                        {num}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.twoDigit && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === "th" ? "2 ตัวท้าย" : "Last 2"}
                  </p>
                  <Badge variant="secondary" className="font-mono text-lg px-3">
                    {result.twoDigit}
                  </Badge>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-2 text-muted-foreground">
            <p className="text-sm mb-3">
              {language === "th" 
                ? "กดปุ่มด้านล่างเพื่อเช็คผลหวยล่าสุด" 
                : "Click button below to check latest results"}
            </p>
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2" 
          asChild
          data-testid={`button-external-${type}`}
        >
          <a href={externalUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            {language === "th" ? `เปิด ${siteName}` : `Open ${siteName}`}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Results() {
  const { language, t } = useI18n();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: thaiGovData, isLoading: isLoadingThaiGov, refetch, isError } = useQuery<ThaiLottoApiResponse>({
    queryKey: ["thai-lotto-api"],
    queryFn: async () => {
      const latestRes = await fetch("https://lotto.api.rayriffy.com/latest");
      const latestData = await latestRes.json();
      
      if (latestData.status === "success" && latestData.response) {
        if (latestData.response.date && latestData.response.prizes) {
          return latestData;
        }
        if (Array.isArray(latestData.response) && latestData.response.length > 0) {
          const responseArr = latestData.response;
          const latestId = responseArr[responseArr.length - 1].id;
          const resultRes = await fetch(`https://lotto.api.rayriffy.com/lotto/${latestId}`);
          return resultRes.json();
        }
      }
      throw new Error("No lottery data available");
    },
    staleTime: 1000 * 60 * 5,
    retry: 2
  });

  const thaiGovResult = thaiGovData ? parseThaiLottoResult(thaiGovData) : null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const categoryNames = {
    thai: language === "th" ? "หวยไทย" : "Thai",
    stock: language === "th" ? "หวยหุ้น" : "Stock",
    foreign: language === "th" ? "ต่างประเทศ" : "Foreign",
    instant: language === "th" ? "หวยด่วน" : "Instant"
  };

  return (
    <div className="min-h-full">
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 md:p-6 border-b border-border">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{t("results.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("results.latest")}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingThaiGov}
            data-testid="button-refresh-results"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {language === "th" ? "รีเฟรช" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <Card className="mb-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  {language === "th" ? "เช็คผลหวยจากเว็บไซต์ทางการ" : "Check Results from Official Sites"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === "th" 
                    ? "กดปุ่ม \"เปิด...\" ในแต่ละการ์ดเพื่อไปยังเว็บไซต์ทางการสำหรับผลหวยล่าสุด" 
                    : "Click \"Open...\" button on each card to visit official sites for latest results"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="thai" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(categoryNames).map(([key, name]) => (
              <TabsTrigger key={key} value={key} className="gap-1">
                {categoryIcons[key as keyof typeof categoryIcons]}
                <span className="hidden sm:inline">{name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(categories).map(([key, types]) => (
            <TabsContent key={key} value={key}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {types.map((type) => (
                  <ResultCard 
                    key={type} 
                    type={type} 
                    thaiGovResult={type === "THAI_GOV" ? thaiGovResult : null}
                    isLoading={type === "THAI_GOV" && isLoadingThaiGov}
                    isError={type === "THAI_GOV" && isError}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
