import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useCart, useUser } from "@/lib/store";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Calculator, 
  Hash, 
  DollarSign, 
  Layers, 
  Plus, 
  Trash2, 
  ShoppingCart,
  CheckCircle,
  X,
  AlertCircle,
  Gift,
  Shuffle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  lotteryTypes, 
  betTypes, 
  lotteryTypeNames, 
  betTypeNames,
  type LotteryType,
  type BetType,
  type PayoutSetting
} from "@shared/schema";

interface NumberSet {
  id: string;
  numbers: string[];
}

function getPermutations(str: string): string[] {
  if (str.length <= 1) return [str];
  const result: string[] = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const remaining = str.slice(0, i) + str.slice(i + 1);
    for (const perm of getPermutations(remaining)) {
      result.push(char + perm);
    }
  }
  return [...new Set(result)];
}

function getReversePermutations(str: string): string[] {
  if (str.length !== 2) return [str];
  const reversed = str[1] + str[0];
  return str === reversed ? [str] : [str, reversed];
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

function getRequiredDigits(betType: BetType): number {
  switch (betType) {
    case "RUN_TOP":
    case "RUN_BOTTOM":
      return 1;
    case "TWO_TOP":
    case "TWO_BOTTOM":
    case "REVERSE":
      return 2;
    case "THREE_TOP":
    case "THREE_TOD":
      return 3;
    case "FOUR_TOP":
      return 4;
    case "FIVE_TOP":
      return 5;
    default:
      return 2;
  }
}

function getDigitLabel(betType: BetType, language: string): string {
  const digits = getRequiredDigits(betType);
  if (language === "th") {
    switch (digits) {
      case 1: return "1 ตัว";
      case 2: return "2 ตัว";
      case 3: return "3 ตัว";
      case 4: return "4 ตัว";
      case 5: return "5 ตัว";
      default: return `${digits} ตัว`;
    }
  }
  return `${digits} digit${digits > 1 ? "s" : ""}`;
}

export default function SetCalculator() {
  const { language } = useI18n();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { isAuthenticated } = useUser();
  const [, setLocation] = useLocation();
  
  const [sets, setSets] = useState<NumberSet[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [pricePerSet, setPricePerSet] = useState("1");
  const [lotteryType, setLotteryType] = useState<LotteryType>("THAI_GOV");
  const [betType, setBetType] = useState<BetType>("TWO_TOP");

  const { data: payoutSettings } = useQuery<PayoutSetting[]>({
    queryKey: ["/api/payout-settings"]
  });

  const payoutRate = useMemo(() => {
    const setting = payoutSettings?.find(s => s.betType === betType);
    return setting?.rate || getDefaultPayoutRate(betType);
  }, [payoutSettings, betType]);

  const requiredDigits = getRequiredDigits(betType);

  const parseAndValidate = (input: string) => {
    const tokens = input
      .split(/[,\s\n]+/)
      .map(n => n.trim())
      .filter(n => /^\d+$/.test(n));
    
    const validNumbers: string[] = [];
    const invalidNumbers: string[] = [];
    
    tokens.forEach(token => {
      const paddedToken = token.padStart(requiredDigits, '0');
      if (paddedToken.length === requiredDigits) {
        validNumbers.push(paddedToken);
      } else {
        invalidNumbers.push(token);
      }
    });
    
    return { validNumbers, invalidNumbers };
  };

  const { validNumbers: currentValidNumbers, invalidNumbers: currentInvalidNumbers } = 
    useMemo(() => parseAndValidate(currentInput), [currentInput, requiredDigits]);

  useEffect(() => {
    if (sets.length > 0) {
      const hasInvalidSets = sets.some(set => 
        set.numbers.some(n => n.length !== requiredDigits)
      );
      if (hasInvalidSets) {
        toast({
          title: language === "th" ? "ประเภทแทงเปลี่ยน" : "Bet type changed",
          description: language === "th" 
            ? `กรุณาล้างชุดเก่าเพื่อเพิ่มเลข ${getDigitLabel(betType, language)} ใหม่`
            : `Please clear old sets to add new ${getDigitLabel(betType, language)} numbers`,
          variant: "destructive"
        });
        setSets([]);
      }
    }
  }, [betType]);

  const handleAddSet = () => {
    if (currentValidNumbers.length === 0) {
      toast({
        title: language === "th" ? "กรุณาใส่เลข" : "Please enter numbers",
        description: language === "th" 
          ? `ต้องเป็นเลข ${getDigitLabel(betType, language)} เท่านั้น`
          : `Must be ${getDigitLabel(betType, language)} only`,
        variant: "destructive"
      });
      return;
    }

    const newSet: NumberSet = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      numbers: currentValidNumbers
    };

    setSets(prev => [...prev, newSet]);
    setCurrentInput("");
    
    toast({
      title: language === "th" ? `เพิ่มชุดที่ ${sets.length + 1} แล้ว` : `Added Set ${sets.length + 1}`,
      description: language === "th" 
        ? `${currentValidNumbers.length} เลข: ${currentValidNumbers.join(", ")}`
        : `${currentValidNumbers.length} numbers: ${currentValidNumbers.join(", ")}`
    });
  };

  const handleRemoveSet = (id: string) => {
    setSets(prev => prev.filter(s => s.id !== id));
  };

  const handleClearAll = () => {
    setSets([]);
    setCurrentInput("");
  };

  const result = useMemo(() => {
    const allNumbers: string[] = [];
    sets.forEach(set => {
      allNumbers.push(...set.numbers);
    });

    const uniqueNumbers = Array.from(new Set(allNumbers)).sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      return a.localeCompare(b);
    });

    const price = parseFloat(pricePerSet) || 0;
    const totalNumbers = allNumbers.length;
    const totalAmount = sets.length * price;

    let winningNumbers: string[] = [];
    if (betType === "THREE_TOD") {
      uniqueNumbers.forEach(num => {
        const perms = getPermutations(num);
        winningNumbers.push(...perms);
      });
      winningNumbers = [...new Set(winningNumbers)].sort();
    } else if (betType === "REVERSE") {
      uniqueNumbers.forEach(num => {
        const perms = getReversePermutations(num);
        winningNumbers.push(...perms);
      });
      winningNumbers = [...new Set(winningNumbers)].sort();
    } else {
      winningNumbers = uniqueNumbers;
    }

    const potentialWin = totalAmount * payoutRate;

    return {
      totalSets: sets.length,
      totalNumbers,
      uniqueCount: uniqueNumbers.length,
      uniqueNumbers,
      totalAmount,
      winningNumbers,
      potentialWin,
      payoutRate
    };
  }, [sets, pricePerSet, betType, payoutRate]);

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

    if (sets.length === 0) {
      toast({
        title: language === "th" ? "ไม่มีเลขในชุด" : "No numbers in sets",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(pricePerSet) || 0;
    if (price <= 0) {
      toast({
        title: language === "th" ? "กรุณาใส่ราคาต่อชุด" : "Please enter price per set",
        variant: "destructive"
      });
      return;
    }

    sets.forEach((set, idx) => {
      addItem({
        lotteryType,
        betType,
        numbers: set.numbers.join(","),
        amount: price,
        isSet: true,
        setIndex: idx + 1
      });
    });

    toast({
      title: language === "th" ? "เพิ่มลงตะกร้าแล้ว" : "Added to cart",
      description: language === "th" 
        ? `เพิ่ม ${sets.length} ชุด รวม ${result.totalAmount.toLocaleString()} บาท`
        : `Added ${sets.length} sets, total ${result.totalAmount.toLocaleString()} Baht`
    });

    handleClearAll();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {language === "th" ? "คำนวณหวยชุด" : "Lottery Set Calculator"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "th" 
              ? "เพิ่มเลขเป็นชุด คำนวณยอด แล้วซื้อได้เลย" 
              : "Add numbers in sets, calculate total, and purchase directly"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  {language === "th" ? "เพิ่มชุดใหม่" : "Add New Set"}
                </CardTitle>
                <CardDescription>
                  {language === "th" 
                    ? `ชุดที่ ${sets.length + 1} - ใส่เลขคั่นด้วย , หรือ ช่องว่าง` 
                    : `Set ${sets.length + 1} - Separate numbers with comma or space`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="numbers">
                      {language === "th" ? "ใส่เลข" : "Enter Numbers"}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {getDigitLabel(betType, language)}
                    </Badge>
                  </div>
                  <Textarea
                    id="numbers"
                    placeholder={language === "th" 
                      ? `ตัวอย่าง: ${
                          requiredDigits === 1 ? "1, 2, 3, 4" : 
                          requiredDigits === 2 ? "12, 34, 56, 78" : 
                          requiredDigits === 3 ? "123, 456, 789" :
                          requiredDigits === 4 ? "1234, 5678" :
                          "12345, 67890"
                        }` 
                      : `Example: ${
                          requiredDigits === 1 ? "1, 2, 3, 4" : 
                          requiredDigits === 2 ? "12, 34, 56, 78" : 
                          requiredDigits === 3 ? "123, 456, 789" :
                          requiredDigits === 4 ? "1234, 5678" :
                          "12345, 67890"
                        }`}
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    className="min-h-[100px] font-mono"
                    data-testid="textarea-numbers"
                  />
                  {currentValidNumbers.length > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {language === "th" 
                        ? `ถูกต้อง ${currentValidNumbers.length} เลข: ${currentValidNumbers.join(", ")}`
                        : `Valid ${currentValidNumbers.length} numbers: ${currentValidNumbers.join(", ")}`}
                    </p>
                  )}
                  {currentInvalidNumbers.length > 0 && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {language === "th" 
                        ? `ไม่ถูกต้อง (ต้อง ${getDigitLabel(betType, language)}): ${currentInvalidNumbers.join(", ")}`
                        : `Invalid (must be ${getDigitLabel(betType, language)}): ${currentInvalidNumbers.join(", ")}`}
                    </p>
                  )}
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleAddSet}
                  disabled={currentValidNumbers.length === 0}
                  data-testid="button-add-set"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "th" ? `เพิ่มชุดที่ ${sets.length + 1}` : `Add Set ${sets.length + 1}`}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  {language === "th" ? "ชุดที่เพิ่มแล้ว" : "Added Sets"}
                  {sets.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {sets.length} {language === "th" ? "ชุด" : "sets"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {language === "th" ? "ยังไม่มีชุด กรุณาเพิ่มชุดใหม่" : "No sets yet. Please add a new set."}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {sets.map((set, idx) => (
                      <div 
                        key={set.id} 
                        className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg group"
                        data-testid={`row-set-${idx}`}
                      >
                        <Badge variant="outline" className="shrink-0">
                          {language === "th" ? `ชุด ${idx + 1}` : `Set ${idx + 1}`}
                        </Badge>
                        <span className="font-mono text-sm flex-1 truncate">
                          {set.numbers.join(", ")}
                        </span>
                        <Badge variant="secondary" className="shrink-0">
                          {set.numbers.length} {language === "th" ? "เลข" : "nos"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveSet(set.id)}
                          data-testid={`button-remove-set-${idx}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {sets.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={handleClearAll}
                    data-testid="button-clear-all"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {language === "th" ? "ล้างทั้งหมด" : "Clear All"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {language === "th" ? "ตั้งค่าการซื้อ" : "Purchase Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "th" ? "ประเภทหวย" : "Lottery Type"}</Label>
                    <Select value={lotteryType} onValueChange={(v) => setLotteryType(v as LotteryType)}>
                      <SelectTrigger data-testid="select-lottery-type">
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
                    <Select value={betType} onValueChange={(v) => setBetType(v as BetType)}>
                      <SelectTrigger data-testid="select-bet-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {betTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {betTypeNames[type][language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">
                    {language === "th" ? "ราคาต่อชุด (บาท)" : "Price per Set (Baht)"}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={pricePerSet}
                      onChange={(e) => setPricePerSet(e.target.value)}
                      className="pl-10"
                      data-testid="input-price"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {language === "th" ? "สรุปยอด" : "Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === "th" ? "จำนวนชุด" : "Total Sets"}
                      </p>
                      <p className="text-2xl font-bold text-primary" data-testid="text-total-sets">
                        {result.totalSets}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-accent/50 border-accent">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === "th" ? "จำนวนเลข" : "Total Numbers"}
                      </p>
                      <p className="text-2xl font-bold text-accent-foreground" data-testid="text-total-numbers">
                        {result.totalNumbers}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      {language === "th" ? "ยอดรวมทั้งหมด" : "Total Amount"}
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-amount">
                      {result.totalAmount.toLocaleString()} ฿
                    </p>
                    {result.totalSets > 0 && pricePerSet && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.totalSets} {language === "th" ? "ชุด" : "sets"} × {parseFloat(pricePerSet).toLocaleString()} ฿
                      </p>
                    )}
                  </CardContent>
                </Card>

                {result.totalAmount > 0 && (
                  <Card className="bg-yellow-500/10 border-yellow-500/30">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Gift className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <p className="text-sm text-muted-foreground">
                          {language === "th" ? "ถ้าถูก จะได้" : "Potential Win"}
                        </p>
                      </div>
                      <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-potential-win">
                        {result.potentialWin.toLocaleString()} ฿
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "th" ? `อัตราจ่าย x${result.payoutRate}` : `Payout rate x${result.payoutRate}`}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Button 
                  className="w-full h-12 text-lg"
                  onClick={handleAddToCart}
                  disabled={sets.length === 0 || result.totalAmount <= 0}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {language === "th" ? "เพิ่มลงตะกร้า" : "Add to Cart"}
                </Button>
              </CardContent>
            </Card>

            {result.uniqueNumbers.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{language === "th" ? "เลขที่ซื้อ (ไม่ซ้ำ)" : "Numbers Purchased (Unique)"}</span>
                    <Badge variant="outline">{result.uniqueCount}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto">
                    {result.uniqueNumbers.map((num, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="font-mono text-xs"
                        data-testid={`badge-number-${idx}`}
                      >
                        {num}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(betType === "THREE_TOD" || betType === "REVERSE") && result.winningNumbers.length > 0 && (
              <Card className="bg-blue-500/5 border-blue-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Shuffle className="h-4 w-4 text-blue-500" />
                      <span className="text-blue-600 dark:text-blue-400">
                        {language === "th" 
                          ? (betType === "THREE_TOD" ? "เลขโต๊ดที่จะถูก" : "เลขกลับที่จะถูก")
                          : (betType === "THREE_TOD" ? "TOD Winning Numbers" : "Reverse Winning Numbers")}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                      {result.winningNumbers.length} {language === "th" ? "เลข" : "nos"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto">
                    {result.winningNumbers.map((num, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="font-mono text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                        data-testid={`badge-winning-${idx}`}
                      >
                        {num}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {language === "th" 
                      ? (betType === "THREE_TOD" 
                          ? "หมายเหตุ: ตั๋วโต๊ดจะถูกถ้าเลข 3 ตัวท้ายของรางวัลที่ 1 ตรงกับหนึ่งในเลขเหล่านี้" 
                          : "หมายเหตุ: ตั๋วกลับจะถูกทั้ง 2 แบบ (12 ถูกทั้ง 12 และ 21)")
                      : (betType === "THREE_TOD" 
                          ? "Note: TOD ticket wins if last 3 digits of 1st prize match any of these numbers"
                          : "Note: Reverse ticket wins both ways (12 wins on both 12 and 21)")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                {language === "th" 
                  ? "วิธีใช้: พิมพ์เลขชุดแรก กดปุ่ม \"เพิ่มชุดที่ 1\" → พิมพ์เลขชุดถัดไป กดปุ่ม \"เพิ่มชุดที่ 2\" → ทำซ้ำจนครบ → ตั้งราคาต่อชุด → กดปุ่ม \"เพิ่มลงตะกร้า\" เพื่อซื้อ" 
                  : "How to use: Enter first set numbers, click \"Add Set 1\" → Enter next set, click \"Add Set 2\" → Repeat → Set price per set → Click \"Add to Cart\" to purchase"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
