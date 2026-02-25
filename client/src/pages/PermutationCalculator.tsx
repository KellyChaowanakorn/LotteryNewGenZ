import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useCart, useUser } from "@/lib/store";
import { useLocation } from "wouter";
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
  type LotteryType, 
  type BetType,
  payoutRates 
} from "@shared/schema";

/* =========================
   6 หวยสำหรับหน้า Permutation
========================= */

const PERM_LOTTERIES: { id: LotteryType; th: string; en: string }[] = [
  { id: "THAI_GOV", th: "🇹🇭 หวยรัฐบาลไทย", en: "🇹🇭 Thai Government" },
  { id: "THAI_STOCK", th: "📈 หุ้นไทย (SET)", en: "📈 Thai Stock" },
  { id: "STOCK_NIKKEI", th: "🇯🇵 หุ้นนิเคอิ", en: "🇯🇵 Nikkei" },
  { id: "STOCK_HSI", th: "🇭🇰 หุ้นฮั่งเส็ง", en: "🇭🇰 Hang Seng" },
  { id: "STOCK_DOW", th: "🇺🇸 หุ้นดาวโจนส์", en: "🇺🇸 Dow Jones" },
  { id: "MALAYSIA", th: "🇲🇾 หวยมาเลย์", en: "🇲🇾 Malaysia" },
];

/* =========================
   Bet Types Config
========================= */

const PERM_BET_TYPES: {
  id: BetType;
  th: string;
  en: string;
  digits: number;
  isTod?: boolean;
}[] = [
  { id: "TWO_TOP", th: "2 ตัวบน", en: "2D Top", digits: 2 },
  { id: "TWO_BOTTOM", th: "2 ตัวล่าง", en: "2D Bottom", digits: 2 },
  { id: "THREE_TOP", th: "3 ตัวบน", en: "3D Top", digits: 3 },
  { id: "THREE_TOD", th: "3 ตัวโต๊ด", en: "3D Tod", digits: 3, isTod: true },
  { id: "THREE_FRONT", th: "3 ตัวหน้า", en: "3D Front", digits: 3 },
  { id: "THREE_BACK", th: "3 ตัวท้าย", en: "3D Back", digits: 3 },
  { id: "FOUR_TOP", th: "4 ตัวบน", en: "4D Top", digits: 4 },
];

/* =========================
   Bet Types ที่ใช้ได้ตามหวยแต่ละประเภท
========================= */

const ALLOWED_BETS: Record<string, BetType[]> = {
  THAI_GOV: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD", "THREE_FRONT", "THREE_BACK"],
  THAI_STOCK: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD"],
  STOCK_NIKKEI: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD"],
  STOCK_HSI: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD"],
  STOCK_DOW: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD"],
  MALAYSIA: ["TWO_TOP", "TWO_BOTTOM", "THREE_TOP", "THREE_TOD", "FOUR_TOP"],
};

/* =========================
   HELPER FUNCTIONS
========================= */

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

/* =========================
   COMPONENT
========================= */

export default function PermutationCalculator() {
  const { language } = useI18n();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { isAuthenticated } = useUser();
  const [, setLocation] = useLocation();
  
  const [digitInput, setDigitInput] = useState("");
  const [pricePerNumber, setPricePerNumber] = useState("1");
  const [lotteryId, setLotteryId] = useState<LotteryType>("THAI_GOV");
  const [betId, setBetId] = useState<BetType>("THREE_TOD");

  // Get available bet types for selected lottery
  const availableBetIds = (ALLOWED_BETS[lotteryId] || []).filter(id => 
    PERM_BET_TYPES.some(b => b.id === id)
  );
  const currentBetId = availableBetIds.includes(betId) ? betId : availableBetIds[0];
  const betInfo = PERM_BET_TYPES.find(b => b.id === currentBetId)!;

  const requiredDigits = betInfo?.digits || 3;
  const payoutRate = payoutRates[currentBetId] || 150;
  const isTod = betInfo?.isTod || false;

  // คำนวณผลลัพธ์
  const result = useMemo(() => {
    const cleanInput = digitInput.replace(/\D/g, '');
    
    if (cleanInput.length !== requiredDigits) {
      return {
        isValid: false,
        error: language === "th" 
          ? `กรุณาใส่ตัวเลข ${requiredDigits} ตัว`
          : `Please enter ${requiredDigits} digits`,
        permutations: [] as string[],
        uniqueCount: 0,
        totalAmount: 0,
        potentialWin: 0,
        hasRepeats: false,
        isTod: false
      };
    }

    // สำหรับ TOD จะสลับตำแหน่ง, สำหรับอื่นๆ ไม่สลับ (ตรง)
    const permutations = isTod ? getUniquePermutations(cleanInput) : [cleanInput];
    
    const price = parseFloat(pricePerNumber) || 0;
    const totalAmount = permutations.length * price;
    const potentialWin = price * payoutRate;

    const digitFreq: Record<string, number> = {};
    for (const d of cleanInput) {
      digitFreq[d] = (digitFreq[d] || 0) + 1;
    }

    return {
      isValid: true,
      error: null,
      permutations,
      uniqueCount: permutations.length,
      totalAmount,
      potentialWin,
      digitFreq,
      hasRepeats: Object.values(digitFreq).some(c => c > 1),
      isTod
    };
  }, [digitInput, requiredDigits, pricePerNumber, payoutRate, language, isTod]);

  const handleLotteryChange = (value: string) => {
    const newLotteryId = value as LotteryType;
    setLotteryId(newLotteryId);
    const newAvailable = (ALLOWED_BETS[newLotteryId] || []).filter(id => 
      PERM_BET_TYPES.some(b => b.id === id)
    );
    if (!newAvailable.includes(betId)) {
      setBetId(newAvailable[0]);
    }
    setDigitInput("");
  };

  const handleBetTypeChange = (value: string) => {
    setBetId(value as BetType);
    setDigitInput("");
  };

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

    // ★ FIX: เพิ่ม potentialWin ที่ CartItemWithWin ต้องการ
    result.permutations.forEach((num, idx) => {
      addItem({
        lotteryType: lotteryId,
        betType: currentBetId,
        numbers: num,
        amount: price,
        potentialWin: price * payoutRate,
        isSet: result.isTod,
        setIndex: result.isTod ? idx + 1 : undefined
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
        {/* Header */}
        <Card className="bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Shuffle className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <span className="text-xl">
                  {language === "th" ? "เครื่องคิดเลขกลับ/โต๊ด" : "Permutation Calculator"}
                </span>
                <p className="text-sm font-normal text-muted-foreground mt-1">
                  {language === "th" 
                    ? "6 หวย: รัฐบาล, หุ้นไทย, นิเคอิ, ฮั่งเส็ง, ดาวโจนส์, มาเลย์" 
                    : "6 Lotteries with permutation support"}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: Input */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  {language === "th" ? "ตั้งค่า" : "Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* เลือกหวย */}
                <div className="space-y-2">
                  <Label>{language === "th" ? "ประเภทหวย" : "Lottery Type"}</Label>
                  <Select value={lotteryId} onValueChange={handleLotteryChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERM_LOTTERIES.map((lottery) => (
                        <SelectItem key={lottery.id} value={lottery.id}>
                          {language === "th" ? lottery.th : lottery.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* เลือกประเภทแทง */}
                <div className="space-y-2">
                  <Label>{language === "th" ? "ประเภทการแทง" : "Bet Type"}</Label>
                  <Select value={currentBetId} onValueChange={handleBetTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBetIds.map((id) => {
                        const bet = PERM_BET_TYPES.find(b => b.id === id)!;
                        return (
                          <SelectItem key={id} value={id}>
                            {language === "th" ? bet.th : bet.en}
                            {bet.isTod && (
                              <span className="text-xs text-orange-500 ml-1">
                                ★ {language === "th" ? "สลับ" : "permute"}
                              </span>
                            )}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* ใส่เลข */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="digits">
                      {language === "th" ? `ใส่ตัวเลข ${requiredDigits} ตัว` : `Enter ${requiredDigits} Digits`}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {digitInput.replace(/\D/g, '').length}/{requiredDigits}
                    </Badge>
                  </div>
                  <Input
                    id="digits"
                    type="text"
                    maxLength={requiredDigits}
                    placeholder={
                      requiredDigits === 2 ? "12" :
                      requiredDigits === 3 ? "123" : "1234"
                    }
                    value={digitInput}
                    onChange={(e) => setDigitInput(e.target.value.replace(/\D/g, '').slice(0, requiredDigits))}
                    className="text-center text-2xl font-mono tracking-widest h-14"
                  />
                  {!result.isValid && digitInput.length > 0 && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {result.error}
                    </p>
                  )}
                </div>

                {/* ราคาต่อเลข */}
                <div className="space-y-2">
                  <Label htmlFor="price">
                    {language === "th" ? "ราคาต่อเลข (บาท)" : "Price per Number (Baht)"}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={pricePerNumber}
                      onChange={(e) => setPricePerNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleClear}
                  disabled={!digitInput}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === "th" ? "ล้าง" : "Clear"}
                </Button>
              </CardContent>
            </Card>

            {/* แจ้งเตือนโต๊ด */}
            {isTod && result.isValid && result.hasRepeats && (
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

            {/* แจ้งเตือนแบบตรง */}
            {!isTod && result.isValid && (
              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {language === "th" ? "แทงตรง (ไม่สลับ)" : "Straight bet (no permutation)"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === "th" 
                          ? `เลข ${digitInput} จะถูกแทงตรงๆ 1 เลข ไม่สลับตำแหน่ง`
                          : `Number ${digitInput} will be bet as-is, no permutation`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Results */}
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
                      <p className="text-2xl font-bold text-primary">
                        {result.isValid ? result.uniqueCount : 0}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-500/10 border-green-500/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === "th" ? "ยอดรวม" : "Total Amount"}
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
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
                          {language === "th" ? "ถ้าถูก จะได้ (ต่อเลข)" : "Win per number"}
                        </p>
                      </div>
                      <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
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
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {language === "th" 
                    ? `เพิ่ม ${result.isValid ? result.uniqueCount : 0} เลขลงตะกร้า`
                    : `Add ${result.isValid ? result.uniqueCount : 0} numbers to cart`}
                </Button>
              </CardContent>
            </Card>

            {/* แสดงเลขที่จะซื้อ */}
            {result.isValid && result.permutations.length > 0 && (
              <Card className="bg-purple-500/5 border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Shuffle className="h-4 w-4 text-purple-500" />
                      <span className="text-purple-600 dark:text-purple-400">
                        {language === "th" ? "เลขที่จะซื้อ" : "Numbers to Purchase"}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
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
                        className="font-mono text-sm bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
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

        {/* คำอธิบาย */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">
                  {language === "th" ? "ประเภทการแทง:" : "Bet Types:"}
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>
                    <strong>{language === "th" ? "ตรง" : "Straight"}</strong>: 
                    {language === "th" 
                      ? " 2บน, 2ล่าง, 3บน, 3หน้า, 3ท้าย, 4บน = แทงเลขตรงๆ ไม่สลับ" 
                      : " 2Top, 2Bot, 3Top, 3Front, 3Back, 4Top = exact match, no permutation"}
                  </li>
                  <li>
                    <strong className="text-orange-500">{language === "th" ? "โต๊ด ★" : "Tod ★"}</strong>: 
                    {language === "th" 
                      ? " 3โต๊ด = สลับตำแหน่งทั้งหมด เช่น 123 → 123, 132, 213, 231, 312, 321 (6 เลข)" 
                      : " 3Tod = all permutations, e.g. 123 → 6 numbers"}
                  </li>
                </ul>
                <p className="text-xs mt-2">
                  {language === "th" 
                    ? "💡 ถ้าเลขซ้ำ (เช่น 112) จำนวน permutation จะลดลง (112 → 112, 121, 211 = 3 เลข)"
                    : "💡 Repeated digits reduce permutations (e.g. 112 → 3 numbers instead of 6)"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
