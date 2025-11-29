import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useI18n } from "@/lib/i18n";
import { useBlockedNumbers } from "@/lib/store";
import type { LotteryType, BetType } from "@shared/schema";
import { AlertTriangle, X, Shuffle } from "lucide-react";

interface NumberInputProps {
  lotteryType: LotteryType | null;
  betType: BetType | null;
  numbers: string[];
  onNumbersChange: (numbers: string[]) => void;
}

const getRequiredDigits = (betType: BetType | null): number => {
  if (!betType) return 0;
  if (betType.startsWith("THREE_")) return 3;
  if (betType.startsWith("TWO_")) return 2;
  if (betType.startsWith("RUN_")) return 1;
  return 0;
};

export function NumberInput({ lotteryType, betType, numbers, onNumbersChange }: NumberInputProps) {
  const { language, t } = useI18n();
  const { isBlocked } = useBlockedNumbers();
  const [currentInput, setCurrentInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const requiredDigits = getRequiredDigits(betType);
  const maxNumbers = betType?.includes("REVERSE") ? 1 : 10;

  const handleInputChange = (value: string) => {
    const numbersOnly = value.replace(/[^0-9]/g, "").slice(0, requiredDigits);
    setCurrentInput(numbersOnly);
  };

  const addNumber = () => {
    if (currentInput.length === requiredDigits && numbers.length < maxNumbers) {
      if (!numbers.includes(currentInput)) {
        onNumbersChange([...numbers, currentInput]);
        setCurrentInput("");
        inputRef.current?.focus();
      }
    }
  };

  const removeNumber = (index: number) => {
    onNumbersChange(numbers.filter((_, i) => i !== index));
  };

  const generateRandom = () => {
    const random = Math.floor(Math.random() * Math.pow(10, requiredDigits))
      .toString()
      .padStart(requiredDigits, "0");
    setCurrentInput(random);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNumber();
    }
  };

  const blockedWarning = lotteryType && currentInput.length === requiredDigits && 
    isBlocked(lotteryType, currentInput, betType || undefined);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={currentInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${language === "th" ? "กรอกเลข" : "Enter"} ${requiredDigits} ${language === "th" ? "หลัก" : "digits"}`}
            className="text-center text-2xl font-bold tracking-[0.5em] h-14"
            disabled={!betType}
            data-testid="input-lottery-number"
          />
          {requiredDigits > 0 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {currentInput.length}/{requiredDigits}
            </div>
          )}
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={generateRandom}
          disabled={!betType}
          className="h-14 w-14"
          data-testid="button-random-number"
        >
          <Shuffle className="h-5 w-5" />
        </Button>
      </div>

      {blockedWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t("home.blockedWarning")}
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={addNumber}
        disabled={currentInput.length !== requiredDigits || numbers.length >= maxNumbers || !!blockedWarning}
        className="w-full"
        data-testid="button-add-number"
      >
        {language === "th" ? "เพิ่มเลข" : "Add Number"}
      </Button>

      {numbers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {numbers.map((num, index) => {
            const isBlockedNum = lotteryType && isBlocked(lotteryType, num, betType || undefined);
            return (
              <Badge
                key={index}
                variant={isBlockedNum ? "destructive" : "secondary"}
                className="text-lg font-bold tracking-widest px-3 py-1.5 gap-2"
                data-testid={`badge-number-${index}`}
              >
                {num}
                <button
                  onClick={() => removeNumber(index)}
                  className="hover:bg-background/20 rounded-full p-0.5"
                  data-testid={`button-remove-number-${index}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {betType?.includes("REVERSE") && numbers.length === 1 && (
        <p className="text-sm text-muted-foreground">
          {language === "th" 
            ? "สามารถใส่ได้ 1 เลขเท่านั้น (ระบบจะสร้างทุกการเรียงสลับให้อัตโนมัติ)"
            : "Only 1 number allowed (system will generate all permutations)"}
        </p>
      )}
    </div>
  );
}
