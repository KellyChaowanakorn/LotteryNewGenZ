import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { lotteryTypes, lotteryTypeNames, type LotteryType } from "@shared/schema";
import { 
  Trophy, 
  ExternalLink, 
  Clock, 
  Wifi, 
  RefreshCw,
  Landmark,
  TrendingUp,
  Globe,
  Building2
} from "lucide-react";
import { useState } from "react";

interface ResultData {
  firstPrize?: string;
  threeTop?: string[];
  threeBottom?: string[];
  twoDigit?: string;
  date: string;
  isLive: boolean;
  externalUrl?: string;
}

const mockResults: Partial<Record<LotteryType, ResultData>> = {
  THAI_GOV: {
    firstPrize: "123456",
    threeTop: ["123", "456"],
    threeBottom: ["789", "012"],
    twoDigit: "56",
    date: "16 พ.ย. 2567",
    isLive: true
  },
  THAI_STOCK: {
    firstPrize: "89",
    threeTop: ["889"],
    twoDigit: "89",
    date: "29 พ.ย. 2567 12:00",
    isLive: true
  },
  STOCK_NIKKEI: {
    firstPrize: "34",
    threeTop: ["234"],
    twoDigit: "34",
    date: "29 พ.ย. 2567",
    isLive: false,
    externalUrl: "https://example.com/nikkei"
  },
  LAO: {
    firstPrize: "5678",
    threeTop: ["567"],
    twoDigit: "78",
    date: "28 พ.ย. 2567",
    isLive: true
  },
  HANOI: {
    firstPrize: "12345",
    threeTop: ["123", "345"],
    twoDigit: "45",
    date: "28 พ.ย. 2567",
    isLive: true
  }
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
  instant: <Clock className="h-4 w-4" />
};

function ResultCard({ type }: { type: LotteryType }) {
  const { language, t } = useI18n();
  const result = mockResults[type];
  const name = lotteryTypeNames[type][language];

  return (
    <Card className="hover-elevate transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{name}</CardTitle>
          {result?.isLive ? (
            <Badge variant="secondary" className="gap-1">
              <Wifi className="h-3 w-3" />
              {t("results.liveApi")}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <ExternalLink className="h-3 w-3" />
              {t("results.externalLink")}
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
                    {language === "th" ? "3 ตัวบน" : "3 Top"}
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
                    {language === "th" ? "3 ตัวล่าง" : "3 Bottom"}
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
                    {language === "th" ? "2 ตัว" : "2 Digits"}
                  </p>
                  <Badge variant="secondary" className="font-mono text-lg px-3">
                    {result.twoDigit}
                  </Badge>
                </div>
              )}
            </div>

            {result.externalUrl && (
              <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                <a href={result.externalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  {t("results.viewExternal")}
                </a>
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>{t("common.noData")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Results() {
  const { language, t } = useI18n();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
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
        <div className="flex items-center justify-between gap-4">
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
            disabled={isRefreshing}
            data-testid="button-refresh-results"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {language === "th" ? "รีเฟรช" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-6">
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
                  <ResultCard key={type} type={type} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
