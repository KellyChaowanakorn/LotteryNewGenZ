import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { payoutRates, type BetType } from "@shared/schema";

interface AmountInputProps {
  amount: number;
  onAmountChange: (amount: number) => void;
  betType: BetType | null;
  numbersCount: number;
}

const quickAmounts = [10, 20, 50, 100, 200, 500, 1000];

export function AmountInput({ amount, onAmountChange, betType, numbersCount }: AmountInputProps) {
  const { language, t } = useI18n();
  
  const rate = betType ? payoutRates[betType] : 0;
  const totalBet = amount * Math.max(1, numbersCount);
  const potentialWin = amount * rate * Math.max(1, numbersCount);

  const handleInputChange = (value: string) => {
    const num = parseInt(value) || 0;
    onAmountChange(Math.max(0, num));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          {t("home.enterAmount")} ({language === "th" ? "ต่อเลข" : "per number"})
        </label>
        <Input
          type="number"
          value={amount || ""}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="0"
          className="text-center text-2xl font-bold h-14"
          min={1}
          data-testid="input-amount"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {quickAmounts.map((amt) => (
          <Button
            key={amt}
            variant={amount === amt ? "default" : "secondary"}
            size="sm"
            onClick={() => onAmountChange(amt)}
            data-testid={`button-quick-amount-${amt}`}
          >
            {amt}
          </Button>
        ))}
      </div>

      {betType && amount > 0 && (
        <Card className="bg-gradient-to-br from-card to-accent/30 border-primary/20">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("home.payoutRate")}</span>
              <span className="font-bold text-primary">x{rate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {language === "th" ? "ยอดแทงรวม" : "Total Bet"}
              </span>
              <span className="font-bold">
                {totalBet.toLocaleString()} {t("common.baht")}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-medium">{t("home.potentialWin")}</span>
              <span className="font-bold text-xl text-primary">
                {potentialWin.toLocaleString()} {t("common.baht")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
