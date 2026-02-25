import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { betTypeNames, payoutRates, allowedBetTypes, type BetType, type LotteryType } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

interface BetTypeSelectorProps {
  selectedType: BetType | null;
  onSelect: (type: BetType) => void;
  lotteryType?: LotteryType | null;
}

// Stock lottery categories
const stockCategories = {
  threeDigit: ["THREE_TOP", "THREE_TOD"] as BetType[],
  twoDigit: ["TWO_TOP", "TWO_BOTTOM"] as BetType[],
};

// Malaysia 4D categories
const malaysiaCategories = {
  fourDigit: ["FOUR_TOP"] as BetType[],
  threeDigit: ["THREE_TOP", "THREE_TOD"] as BetType[],
};

// Thai Gov categories
const thaiGovCategories = {
  threeDigit: ["THREE_TOP", "THREE_TOD", "THREE_FRONT", "THREE_BACK"] as BetType[],
  twoDigit: ["TWO_TOP", "TWO_BOTTOM"] as BetType[],
  running: ["RUN_TOP", "RUN_BOTTOM"] as BetType[],
};

export function BetTypeSelector({ selectedType, onSelect, lotteryType }: BetTypeSelectorProps) {
  const { language } = useI18n();

  const allowedTypes = lotteryType ? allowedBetTypes[lotteryType] : [];

  const isStockLottery = lotteryType && ["THAI_STOCK", "STOCK_NIKKEI", "STOCK_HSI", "STOCK_DOW"].includes(lotteryType);
  const isMalaysiaLottery = lotteryType === "MALAYSIA";
  const isThaiGovLottery = lotteryType === "THAI_GOV";

  const renderBetType = (type: BetType) => {
    if (lotteryType && !allowedTypes.includes(type)) return null;

    const name = betTypeNames[type][language];
    const rate = payoutRates[type];
    const isSelected = selectedType === type;

    return (
      <Card
        key={type}
        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
          isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onClick={() => onSelect(type)}
      >
        <CardContent className="p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isSelected && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
            <span className="font-medium text-sm">{name}</span>
          </div>
          <Badge variant="secondary" className="text-xs font-bold">x{rate}</Badge>
        </CardContent>
      </Card>
    );
  };

  // Stock Lottery UI
  if (isStockLottery) {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">{language === "th" ? "3 ตัว" : "3 Digits"}</h4>
          <div className="grid grid-cols-2 gap-2">{stockCategories.threeDigit.map(renderBetType)}</div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">{language === "th" ? "2 ตัว" : "2 Digits"}</h4>
          <div className="grid grid-cols-2 gap-2">{stockCategories.twoDigit.map(renderBetType)}</div>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 {language === "th"
              ? "หวยหุ้นใช้ 3 ตัวท้ายและ 2 ตัวท้ายของดัชนีหุ้น เช่น SET 1,423.56 → เลขที่ใช้คือ 356 (3 ตัว) หรือ 56 (2 ตัว)"
              : "Stock lottery uses last 3 or 2 digits of stock index. E.g., SET 1,423.56 → 356 (3D) or 56 (2D)"}
          </p>
        </div>
      </div>
    );
  }

  // Malaysia 4D UI
  if (isMalaysiaLottery) {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">{language === "th" ? "4 ตัว" : "4 Digits"}</h4>
          <div className="grid grid-cols-1 gap-2">{malaysiaCategories.fourDigit.map(renderBetType)}</div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">{language === "th" ? "3 ตัว" : "3 Digits"}</h4>
          <div className="grid grid-cols-2 gap-2">{malaysiaCategories.threeDigit.map(renderBetType)}</div>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            🎰 {language === "th"
              ? "หวยมาเลย์ออกรางวัล พ, ส, อา เวลา 19:00 น. (Magnum 4D, Damacai, Sports Toto)"
              : "Malaysia 4D draws on Wed, Sat, Sun at 19:00 (Magnum 4D, Damacai, Sports Toto)"}
          </p>
        </div>
      </div>
    );
  }

  // Thai Government UI
  if (isThaiGovLottery) {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">{language === "th" ? "3 ตัว" : "3 Digits"}</h4>
          <div className="grid grid-cols-2 gap-2">{thaiGovCategories.threeDigit.map(renderBetType)}</div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">{language === "th" ? "2 ตัว" : "2 Digits"}</h4>
          <div className="grid grid-cols-2 gap-2">{thaiGovCategories.twoDigit.map(renderBetType)}</div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">{language === "th" ? "วิ่ง (เลขลอย)" : "Running"}</h4>
          <div className="grid grid-cols-2 gap-2">{thaiGovCategories.running.map(renderBetType)}</div>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            🏆 {language === "th"
              ? "หวยรัฐบาลไทยออกรางวัลวันที่ 1 และ 16 ของทุกเดือน เวลา 15:00 น."
              : "Thai Government Lottery draws on 1st and 16th of every month at 15:00"}
          </p>
        </div>
      </div>
    );
  }

  // Default: Show all allowed types
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {allowedTypes.map(renderBetType)}
      </div>
    </div>
  );
}
