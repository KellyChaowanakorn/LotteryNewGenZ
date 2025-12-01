import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useCart, useUser } from "@/lib/store";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Shuffle, 
  Hash, 
  DollarSign, 
  ShoppingCart,
  AlertCircle,
  Gift,
  Trash2,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  lotteryTypes, 
  lotteryTypeNames,
  betTypeNames,
  type LotteryType,
  type BetType,
  type PayoutSetting
} from "@shared/schema";

function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function getUniquePermutations(digits: string): string[] {
  if (digits.length <= 1) return [digits];
  const result: string[] = [];
  const used: boolean[] = new Array(digits.length).fill(false);
  const sortedDigits = digits.split('').sort().join('');
  
  function permute(current: string) {
    if (current.length === sortedDigits.length) {
      result.push(current);
      return;
    }
    for (let i = 0; i < sortedDigits.length; i++) {
      if (used[i]) continue;
      if (i > 0 && sortedDigits[i] === sortedDigits[i - 1] && !used[i - 1]) continue;
      used[i] = true;
      permute(current + sortedDigits[i]);
      used[i] = false;
    }
  }
  
  permute('');
  return Array.from(new Set(result));
}

function getDefaultPayoutRate(betType: BetType): number {
  const defaults: Record<BetType, number> = {
    TWO_TOP: 60,
    TWO_BOTTOM: 60,
    THREE_TOP: 500,
    THREE_TOD: 90,
    FOUR_TOP: 900,
    FIVE_TOP: 2000,
    RUN_TOP: 3,
    RUN_BOTTOM: 4,
    REVERSE: 94
  };
  return defaults[betType] || 1;
}

type PermBetType = "TWO_TOP" | "TWO_BOTTOM" | "THREE_TOP" | "FOUR_TOP" | "FIVE_TOP";

const permBetTypes: PermBetType[] = ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "FOUR_TOP", "FIVE_TOP"];

const digitCountMap: Record<PermBetType, number> = {
  TWO_TOP: 2,
  TWO_BOTTOM: 2,
  THREE_TOP: 3,
  FOUR_TOP: 4,
  FIVE_TOP: 5
};

export default function PermutationCalculator() {
  const { language } = useI18n();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { isAuthenticated } = useUser();
  const [, setLocation] = useLocation();
  
  const [digitInput, setDigitInput] = useState("");
  const [pricePerNumber, setPricePerNumber] = useState("1");
  const [lotteryType, setLotteryType] = useState<LotteryType>("THAI_GOV");
  const [betType, setBetType] = useState<PermBetType>("THREE_TOP");

  const { data: payoutSettings } = useQuery<PayoutSetting[]>({
    queryKey: ["/api/payout-settings"]
  });

  const payoutRate = useMemo(() => {
    const setting = payoutSettings?.find(s => s.betType === betType);
    return setting?.rate || getDefaultPayoutRate(betType);
  }, [payoutSettings, betType]);

  const requiredDigits = digitCountMap[betType];

  const result = useMemo(() => {
    const cleanInput = digitInput.replace(/\D/g, '');
    
    if (cleanInput.length !== requiredDigits) {
      return {
        isValid: false,
        error: language === "th" 
          ? `กรุณาใส่ตัวเลข ${requiredDigits} ตัว`
          : `Please enter ${requiredDigits} digits`,
        permutations: [],
        uniqueCount: 0,
        totalAmount: 0,
        potentialWin: 0
      };
    }

    const permutations = getUniquePermutations(cleanInput);
    const price = parseFloat(pricePerNumber) || 0;
    const totalAmount = permutations.length * price;
    const potentialWin = price * payoutRate;

    const digitFreq: Record<string, number> = {};
    for (const d of cleanInput) {
      digitFreq[d] = (digitFreq[d] || 0) + 1;
    }
    
    let expectedPerms = factorial(cleanInput.length);
    for (const count of Object.values(digitFreq)) {
      expectedPerms /= factorial(count);
    }

    return {
      isValid: true,
      error: null,
      permutations,
      uniqueCount: permutations.length,
      expectedCount: expectedPerms,
      totalAmount,
      potentialWin,
      digitFreq,
      hasRepeats: Object.values(digitFreq).some(c => c > 1)
    };
  }, [digitInput, requiredDigits, pricePerNumber, payoutRate, language]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: language === "th" ? "กรุณาเข้าสู่ระบบ" : "Please login",
        description: language === "th" ? "คุณต้องเข้าสู่ระบบก่อนซื้อ" : "You need to login before purchasing",
        variant: "destructive"
      });
      setLocation("/login");
      return;
    }

    if (!result.isValid || result.permutations.length === 0) {
      toast({
        title: language === "th" ? "ไม่มีเลขที่จะเพิ่ม" : "No numbers to add",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(pricePerNumber) || 0;
    if (price <= 0) {
      toast({
        title: language === "th" ? "กรุณาใส่ราคาต่อเลข" : "Please enter price per number",
        variant: "destructive"
      });
      return;
    }

    result.permutations.forEach((num, idx) => {
      addItem({
        lotteryType,
        betType,
        numbers: num,
        amount: price,
        isSet: true,
        setIndex: idx + 1
      });
    });

    toast({
      title: language === "th" ? "เพิ่มลงตะกร้าแล้ว" : "Added to cart",
      description: language === "th" 
        ? `เพิ่ม ${result.permutations.length} เลข รวม ${result.totalAmount.toLocaleString()} บาท`
        : `Added ${result.permutations.length} numbers, total ${result.totalAmount.toLocaleString()} Baht`
    });

    setDigitInput("");
  };

  const handleClear = () => {
    setDigitInput("");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shuffle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {language === "th" ? "คำนวณหวยกลับ (Permutation)" : "Permutation Calculator"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "th" 
              ? "ใส่ตัวเลข ระบบจะสร้างทุกรูปแบบที่เป็นไปได้อัตโนมัติ" 
              : "Enter digits, system generates all possible arrangements automatically"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  {language === "th" ? "ใส่ตัวเลข" : "Enter Digits"}
                </CardTitle>
                <CardDescription>
                  {language === "th" 
                    ? `ใส่ตัวเลข ${requiredDigits} ตัว ระบบจะสร้างทุกรูปแบบให้` 
                    : `Enter ${requiredDigits} digits, system generates all arrangements`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "th" ? "ประเภทหวย" : "Lottery Type"}</Label>
                    <Select value={lotteryType} onValueChange={(v) => setLotteryType(v as LotteryType)}>
                      <SelectTrigger data-testid="select-lottery-type-perm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {lotteryTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {lotteryTypeNames[type][language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "th" ? "ประเภทแทง" : "Bet Type"}</Label>
                    <Select value={betType} onValueChange={(v) => setBetType(v as PermBetType)}>
                      <SelectTrigger data-testid="select-bet-type-perm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {permBetTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {betTypeNames[type][language]} ({digitCountMap[type]} {language === "th" ? "ตัว" : "digits"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="digits">
                      {language === "th" ? `ใส่ตัวเลข ${requiredDigits} ตัว` : `Enter ${requiredDigits} Digits`}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {digitInput.replace(/\D/g, '').length}/{requiredDigits}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Input
                      id="digits"
                      type="text"
                      maxLength={requiredDigits}
                      placeholder={
                        requiredDigits === 2 ? "12" :
                        requiredDigits === 3 ? "123" :
                        requiredDigits === 4 ? "1234" : "12345"
                      }
                      value={digitInput}
                      onChange={(e) => setDigitInput(e.target.value.replace(/\D/g, '').slice(0, requiredDigits))}
                      className="text-center text-2xl font-mono tracking-widest h-14"
                      data-testid="input-digits-perm"
                    />
                  </div>
                  {!result.isValid && digitInput.length > 0 && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {result.error}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price-perm">
                    {language === "th" ? "ราคาต่อเลข (บาท)" : "Price per Number (Baht)"}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price-perm"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={pricePerNumber}
                      onChange={(e) => setPricePerNumber(e.target.value)}
                      className="pl-10"
                      data-testid="input-price-perm"
                    />
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleClear}
                  disabled={!digitInput}
                  data-testid="button-clear-perm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === "th" ? "ล้าง" : "Clear"}
                </Button>
              </CardContent>
            </Card>

            {result.isValid && result.hasRepeats && (
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        {language === "th" ? "ตัวเลขซ้ำ" : "Repeated digits detected"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === "th" 
                          ? `เลข ${digitInput} มีตัวซ้ำ จึงได้ ${result.uniqueCount} รูปแบบ (แทนที่จะได้ ${factorial(requiredDigits)} รูปแบบ)`
                          : `Number ${digitInput} has repeats, so ${result.uniqueCount} arrangements (instead of ${factorial(requiredDigits)})`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "th" ? "ผลลัพธ์" : "Results"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === "th" ? "จำนวนเลข" : "Total Numbers"}
                      </p>
                      <p className="text-2xl font-bold text-primary" data-testid="text-perm-count">
                        {result.isValid ? result.uniqueCount : 0}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-500/10 border-green-500/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === "th" ? "ยอดรวม" : "Total Amount"}
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-perm-total">
                        {result.totalAmount.toLocaleString()} ฿
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {result.isValid && result.totalAmount > 0 && (
                  <Card className="bg-yellow-500/10 border-yellow-500/30">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Gift className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <p className="text-sm text-muted-foreground">
                          {language === "th" ? "ถ้าถูก จะได้" : "Win per number"}
                        </p>
                      </div>
                      <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-perm-win">
                        {result.potentialWin.toLocaleString()} ฿
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "th" ? `อัตราจ่าย x${payoutRate}` : `Payout rate x${payoutRate}`}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Button 
                  className="w-full h-12 text-lg"
                  onClick={handleAddToCart}
                  disabled={!result.isValid || result.permutations.length === 0 || result.totalAmount <= 0}
                  data-testid="button-add-perm-to-cart"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {language === "th" 
                    ? `เพิ่ม ${result.isValid ? result.uniqueCount : 0} เลขลงตะกร้า`
                    : `Add ${result.isValid ? result.uniqueCount : 0} numbers to cart`}
                </Button>
              </CardContent>
            </Card>

            {result.isValid && result.permutations.length > 0 && (
              <Card className="bg-blue-500/5 border-blue-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Shuffle className="h-4 w-4 text-blue-500" />
                      <span className="text-blue-600 dark:text-blue-400">
                        {language === "th" ? "เลขทั้งหมดที่จะซื้อ" : "All Numbers to Purchase"}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                      {result.uniqueCount} {language === "th" ? "เลข" : "nos"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                    {result.permutations.map((num, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="font-mono text-sm bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                        data-testid={`badge-perm-${idx}`}
                      >
                        {num}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium">
                  {language === "th" ? "วิธีใช้:" : "How to use:"}
                </p>
                <p>
                  {language === "th" 
                    ? "1. เลือกประเภทแทง (2-5 ตัว) → 2. ใส่ตัวเลข → 3. ตั้งราคาต่อเลข → 4. กด \"เพิ่มลงตะกร้า\""
                    : "1. Select bet type (2-5 digits) → 2. Enter digits → 3. Set price → 4. Click \"Add to cart\""}
                </p>
                <p className="text-xs mt-2">
                  {language === "th" 
                    ? "ตัวอย่าง: ใส่ 123 จะได้ 6 เลข (123, 132, 213, 231, 312, 321) | ใส่ 112 จะได้ 3 เลข (112, 121, 211) เพราะมีตัวซ้ำ"
                    : "Example: 123 gives 6 numbers (123, 132, 213, 231, 312, 321) | 112 gives 3 numbers (112, 121, 211) due to repeats"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
