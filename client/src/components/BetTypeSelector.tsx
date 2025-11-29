import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { betTypeNames, payoutRates, type BetType } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

interface BetTypeSelectorProps {
  selectedType: BetType | null;
  onSelect: (type: BetType) => void;
}

const betTypeCategories = {
  threeDigit: ["THREE_TOP", "THREE_TOOD", "THREE_FRONT", "THREE_BOTTOM", "THREE_REVERSE"] as BetType[],
  twoDigit: ["TWO_TOP", "TWO_BOTTOM"] as BetType[],
  running: ["RUN_TOP", "RUN_BOTTOM"] as BetType[]
};

export function BetTypeSelector({ selectedType, onSelect }: BetTypeSelectorProps) {
  const { language, t } = useI18n();

  const renderBetType = (type: BetType) => {
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

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
          {language === "th" ? "3 ตัว" : "3 Digits"}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {betTypeCategories.threeDigit.map(renderBetType)}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
          {language === "th" ? "2 ตัว" : "2 Digits"}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {betTypeCategories.twoDigit.map(renderBetType)}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
          {language === "th" ? "วิ่ง" : "Running"}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {betTypeCategories.running.map(renderBetType)}
        </div>
      </div>
    </div>
  );
}
