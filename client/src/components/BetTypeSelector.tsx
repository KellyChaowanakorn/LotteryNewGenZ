import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { betTypeNames, payoutRates, allowedBetTypes, type BetType, type LotteryType } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

interface BetTypeSelectorProps {
  selectedType: BetType | null;
  onSelect: (type: BetType) => void;
  lotteryType?: LotteryType | null;
}

// Category definitions for different lottery types
const defaultCategories = {
  twoDigit: ["TWO_TOP", "TWO_BOTTOM", "REVERSE"] as BetType[],
  threeDigit: ["THREE_TOP", "THREE_TOD"] as BetType[],
  fourFiveDigit: ["FOUR_TOP", "FIVE_TOP"] as BetType[],
  running: ["RUN_TOP", "RUN_BOTTOM"] as BetType[]
};

// Stock lottery categories
const stockCategories = {
  threeDigit: ["THREE_STRAIGHT", "THREE_TOD", "THREE_REVERSE"] as BetType[],
  twoDigit: ["TWO_STRAIGHT", "TWO_REVERSE"] as BetType[],
};

const categoryLabels = {
  twoDigit: { th: "2 ตัว", en: "2 Digits" },
  threeDigit: { th: "3 ตัว", en: "3 Digits" },
  fourFiveDigit: { th: "4-5 ตัว", en: "4-5 Digits" },
  running: { th: "วิ่ง (เลขลอย)", en: "Running" },
};

export function BetTypeSelector({ selectedType, onSelect, lotteryType }: BetTypeSelectorProps) {
  const { language } = useI18n();

  // Get allowed types for this lottery
  const allowedTypes = lotteryType ? allowedBetTypes[lotteryType] : [];
  
  // Check if this is a stock lottery
  const isStockLottery = lotteryType && [
    "THAI_STOCK", "STOCK_NIKKEI", "STOCK_DOW", "STOCK_FTSE", "STOCK_DAX"
  ].includes(lotteryType);

  const renderBetType = (type: BetType) => {
    // Skip if not allowed for this lottery
    if (lotteryType && !allowedTypes.includes(type)) {
      return null;
    }

    const name = betTypeNames[type][language];
    const rate = payoutRates[type];
    const isSelected = selectedType === type;

    return (
      <Card
        key={type}
        className={`cursor-pointer transition-all duration-200 hover-elevate ${
          isSelected 
            ? "ring-2 ring-primary border-primary bg-primary/5" 
            : "border-border"
        }`}
        onClick={() => onSelect(type)}
        data-testid={`card-bet-type-${type}`}
      >
        <CardContent className="p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isSelected && (
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
            <span className="font-medium text-sm">{name}</span>
          </div>
          <Badge variant="secondary" className="text-xs font-bold">
            x{rate}
          </Badge>
        </CardContent>
      </Card>
    );
  };

  // Render for stock lottery
  if (isStockLottery) {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            {language === "th" ? "3 ตัว" : "3 Digits"}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {stockCategories.threeDigit.map(renderBetType)}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            {language === "th" ? "2 ตัว" : "2 Digits"}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {stockCategories.twoDigit.map(renderBetType)}
          </div>
        </div>

        {/* Info box explaining stock lottery */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {language === "th" 
              ? "💡 หวยหุ้นใช้ 3 ตัวท้ายและ 2 ตัวท้ายของดัชนีหุ้น เช่น SET 1,423.56 → เลขที่ใช้คือ 356 (3 ตัว) หรือ 56 (2 ตัว)"
              : "💡 Stock lottery uses last 3 or 2 digits of stock index. E.g., SET 1,423.56 → Result is 356 (3D) or 56 (2D)"
            }
          </p>
        </div>
      </div>
    );
  }

  // Render for other lottery types
  const categories = defaultCategories;
  
  // Filter categories based on allowed types
  const filteredCategories = {
    twoDigit: categories.twoDigit.filter(t => !lotteryType || allowedTypes.includes(t)),
    threeDigit: categories.threeDigit.filter(t => !lotteryType || allowedTypes.includes(t)),
    fourFiveDigit: categories.fourFiveDigit.filter(t => !lotteryType || allowedTypes.includes(t)),
    running: categories.running.filter(t => !lotteryType || allowedTypes.includes(t)),
  };

  return (
    <div className="space-y-4">
      {filteredCategories.twoDigit.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            {categoryLabels.twoDigit[language]}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {filteredCategories.twoDigit.map(renderBetType)}
          </div>
        </div>
      )}

      {filteredCategories.threeDigit.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            {categoryLabels.threeDigit[language]}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {filteredCategories.threeDigit.map(renderBetType)}
          </div>
        </div>
      )}

      {filteredCategories.fourFiveDigit.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            {categoryLabels.fourFiveDigit[language]}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {filteredCategories.fourFiveDigit.map(renderBetType)}
          </div>
        </div>
      )}

      {filteredCategories.running.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            {categoryLabels.running[language]}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {filteredCategories.running.map(renderBetType)}
          </div>
        </div>
      )}
    </div>
  );
}
