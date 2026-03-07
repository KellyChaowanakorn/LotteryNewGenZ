import { Card, CardContent } from "@/components/ui/card";
import { lotteryTypeNames, type LotteryType } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

interface LotteryTypeCardProps {
  type: LotteryType;
  isSelected: boolean;
  onClick: () => void;
  drawTime?: string;
}

const lotteryLogos: Record<LotteryType, { emoji: string; bg: string }> = {
  THAI_GOV: {
    emoji: "🇹🇭",
    bg: "from-yellow-500 to-red-600",
  },
  THAI_STOCK: {
    emoji: "📈",
    bg: "from-emerald-500 to-green-700",
  },
  STOCK_NIKKEI: {
    emoji: "🇯🇵",
    bg: "from-red-500 to-rose-700",
  },
  STOCK_HSI: {
    emoji: "🇭🇰",
    bg: "from-red-600 to-red-800",
  },
  STOCK_DOW: {
    emoji: "🇺🇸",
    bg: "from-blue-600 to-indigo-800",
  },
  MALAYSIA: {
    emoji: "🇲🇾",
    bg: "from-blue-500 to-yellow-600",
  },
};

export function LotteryTypeCard({ type, isSelected, onClick, drawTime }: LotteryTypeCardProps) {
  const { language } = useI18n();
  const name = lotteryTypeNames[type][language];
  const logo = lotteryLogos[type];

  if (!logo) return null;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
        isSelected
          ? "ring-2 ring-primary border-primary shadow-lg shadow-primary/20"
          : "border-border hover:border-primary/50"
      }`}
      onClick={onClick}
      data-testid={`card-lottery-${type}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${logo.bg} flex items-center justify-center text-2xl shadow-md`}>
            {logo.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{name}</p>
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
