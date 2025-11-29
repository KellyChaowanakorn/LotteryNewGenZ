import { Card, CardContent } from "@/components/ui/card";
import { lotteryTypeNames, type LotteryType } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { 
  Building2, 
  TrendingUp, 
  Globe, 
  Landmark,
  Dice1
} from "lucide-react";

interface LotteryTypeCardProps {
  type: LotteryType;
  isSelected: boolean;
  onClick: () => void;
  drawTime?: string;
}

const lotteryIcons: Record<LotteryType, JSX.Element> = {
  THAI_GOV: <Landmark className="h-6 w-6" />,
  THAI_STOCK: <TrendingUp className="h-6 w-6" />,
  STOCK_NIKKEI: <Building2 className="h-6 w-6" />,
  STOCK_DOW: <TrendingUp className="h-6 w-6" />,
  STOCK_FTSE: <Globe className="h-6 w-6" />,
  STOCK_DAX: <Building2 className="h-6 w-6" />,
  LAO: <Globe className="h-6 w-6" />,
  HANOI: <Globe className="h-6 w-6" />,
  MALAYSIA: <Globe className="h-6 w-6" />,
  SINGAPORE: <Globe className="h-6 w-6" />,
  KENO: <Dice1 className="h-6 w-6" />
};

const lotteryColors: Record<LotteryType, string> = {
  THAI_GOV: "from-blue-600 to-blue-800",
  THAI_STOCK: "from-green-600 to-green-800",
  STOCK_NIKKEI: "from-red-600 to-red-800",
  STOCK_DOW: "from-indigo-600 to-indigo-800",
  STOCK_FTSE: "from-purple-600 to-purple-800",
  STOCK_DAX: "from-amber-600 to-amber-800",
  LAO: "from-rose-600 to-rose-800",
  HANOI: "from-teal-600 to-teal-800",
  MALAYSIA: "from-cyan-600 to-cyan-800",
  SINGAPORE: "from-pink-600 to-pink-800",
  KENO: "from-violet-600 to-violet-800"
};

export function LotteryTypeCard({ type, isSelected, onClick, drawTime }: LotteryTypeCardProps) {
  const { language } = useI18n();
  const name = lotteryTypeNames[type][language];

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover-elevate ${
        isSelected 
          ? "ring-2 ring-primary border-primary shadow-lg shadow-primary/20" 
          : "border-border"
      }`}
      onClick={onClick}
      data-testid={`card-lottery-${type}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${lotteryColors[type]} text-white`}>
            {lotteryIcons[type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{name}</p>
            {drawTime && (
              <p className="text-xs text-muted-foreground">{drawTime}</p>
            )}
          </div>
          {isSelected && (
            <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
