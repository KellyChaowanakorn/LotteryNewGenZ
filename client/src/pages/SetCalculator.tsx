import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n";
import { useCart, useUser } from "@/lib/store";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Layers, 
  X as XIcon,
  Plus, 
  Minus,
  Trash2, 
  ShoppingCart,
  Gift,
  Info,
  Hash,
  DollarSign,
  Sparkles,
  Package,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  lotteryTypes, 
  lotteryTypeNames, 
  betTypeNames,
  payoutRates,
  type LotteryType,
  type BetType,
  type PayoutSetting
} from "@shared/schema";

// Bet types allowed for this calculator
type SetBetType = "THREE_TOP" | "THREE_TOD" | "TWO_TOP" | "TWO_BOTTOM";
const setBetTypes: SetBetType[] = ["THREE_TOP", "THREE_TOD", "TWO_TOP", "TWO_BOTTOM"];

// Mode type
type BetMode = "normal" | "multiply" | "set";

// Get required digits for bet type
function getRequiredDigits(betType: SetBetType): number {
  switch (betType) {
    case "TWO_TOP":
    case "TWO_BOTTOM":
      return 2;
    case "THREE_TOP":
    case "THREE_TOD":
      return 3;
    default:
      return 3;
  }
}

// Get bet type label
function getBetTypeLabel(betType: SetBetType, language: string): string {
  const digits = getRequiredDigits(betType);
  if (language === "th") {
    return `${digits} ตัวตรง`;
  }
  return `${digits}D Straight`;
}

export default function SetCalculator() {
  const { language } = useI18n();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { isAuthenticated } = useUser();
  const [, setLocation] = useLocation();

  // States
  const [mode, setMode] = useState<BetMode>("normal");
  const [lotteryType, setLotteryType] = useState<LotteryType>("THAI_GOV");
  const [betType, setBetType] = useState<SetBetType>("THREE_TOP");
  const [pricePerUnit, setPricePerUnit] = useState("10");
  
  // Normal mode
  const [normalNumber, setNormalNumber] = useState("");
  
  // Multiply mode
  const [multiplyNumber, setMultiplyNumber] = useState("");
  const [multiplier, setMultiplier] = useState(1);
  
  // Set mode
  const [setInput, setSetInput] = useState("");
  const [setNumbers, setSetNumbers] = useState<string[]>([]);

  // Fetch payout settings
  const { data: payoutSettings } = useQuery<PayoutSetting[]>({
    queryKey: ["/api/payout-settings"]
  });

  const payoutRate = useMemo(() => {
    const setting = payoutSettings?.find(s => s.betType === betType);
    return setting?.rate || payoutRates[betType] || 900;
  }, [payoutSettings, betType]);

  const requiredDigits = getRequiredDigits(betType);

  // Parse numbers from input
  const parseNumbers = (input: string): string[] => {
    return input
      .split(/[,\s\n]+/)
      .map(n => n.trim())
      .filter(n => /^\d+$/.test(n) && n.length === requiredDigits);
  };

  // Current valid numbers from set input
  const currentParsedNumbers = useMemo(() => parseNumbers(setInput), [setInput, requiredDigits]);

  // Calculate results based on mode
  const result = useMemo(() => {
    const price = parseFloat(pricePerUnit) || 0;
    const betLabel = getBetTypeLabel(betType, language);

    if (mode === "normal") {
      const isValid = normalNumber.length === requiredDigits && /^\d+$/.test(normalNumber);
      return {
        isValid,
        numbers: isValid ? [normalNumber] : [],
        totalNumbers: isValid ? 1 : 0,
        totalAmount: isValid ? price : 0,
        potentialWin: isValid ? price * payoutRate : 0,
        displayText: isValid 
          ? `${betLabel} — ${normalNumber} = ${price.toLocaleString()} ${language === "th" ? "บาท" : "THB"}`
          : "",
        modeLabel: language === "th" ? "ปกติ" : "Normal"
      };
    }

    if (mode === "multiply") {
      const isValid = multiplyNumber.length === requiredDigits && /^\d+$/.test(multiplyNumber) && multiplier > 0;
      const total = price * multiplier;
      return {
        isValid,
        numbers: isValid ? [multiplyNumber] : [],
        totalNumbers: isValid ? 1 : 0,
        totalAmount: total,
        potentialWin: isValid ? price * payoutRate : 0,
        displayText: isValid 
          ? `${betLabel} — ${multiplyNumber} ×${multiplier} = ${total.toLocaleString()} ${language === "th" ? "บาท" : "THB"}`
          : "",
        modeLabel: language === "th" ? "คูณ" : "Multiply"
      };
    }

    // Set mode
    const totalNumbers = setNumbers.length;
    const totalAmount = totalNumbers * price;
    
    return {
      isValid: totalNumbers > 0,
      numbers: setNumbers,
      totalNumbers,
      totalAmount,
      potentialWin: price * payoutRate,
      displayText: totalNumbers > 0 
        ? `${betLabel} (${language === "th" ? "คูณชุด" : "Set"}) — ${totalNumbers} ${language === "th" ? "ชุด" : "sets"} — ${language === "th" ? "รวม" : "Total"} ${totalAmount.toLocaleString()} ${language === "th" ? "บาท" : "THB"}`
        : "",
      modeLabel: language === "th" ? "คูณชุด" : "Set Multiply"
    };
  }, [mode, normalNumber, multiplyNumber, multiplier, setNumbers, pricePerUnit, betType, payoutRate, language, requiredDigits]);

  // Handlers
  const handleAddNumbers = () => {
    if (currentParsedNumbers.length === 0) {
      toast({
        title: language === "th" ? "กรุณาใส่เลข" : "Please enter numbers",
        description: language === "th" 
          ? `ต้องเป็นเลข ${requiredDigits} ตัว คั่นด้วย , หรือ เว้นวรรค`
          : `Must be ${requiredDigits} digits, separated by comma or space`,
        variant: "destructive"
      });
      return;
    }

    // Add unique numbers
    const newNumbers = Array.from(new Set([...setNumbers, ...currentParsedNumbers]));
    setSetNumbers(newNumbers);
    setSetInput("");
    
    toast({
      title: language === "th" ? "เพิ่มเลขแล้ว" : "Numbers added",
      description: `+${currentParsedNumbers.length} ${language === "th" ? "เลข" : "numbers"}`
    });
  };

  const handleRemoveNumber = (num: string) => {
    setSetNumbers(prev => prev.filter(n => n !== num));
  };

  const handleClearAll = () => {
    setSetNumbers([]);
    setSetInput("");
    setNormalNumber("");
    setMultiplyNumber("");
    setMultiplier(1);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: language === "th" ? "กรุณาเข้าสู่ระบบ" : "Please login",
        variant: "destructive"
      });
      setLocation("/login");
      return;
    }

    if (!result.isValid || result.totalAmount <= 0) {
      toast({
        title: language === "th" ? "ข้อมูลไม่ครบ" : "Missing information",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(pricePerUnit) || 0;

    if (mode === "normal") {
      addItem({
        lotteryType,
        betType,
        numbers: normalNumber,
        amount: price,
        potentialWin: price * payoutRate
      });
    } else if (mode === "multiply") {
      // Add multiplied items
      for (let i = 0; i < multiplier; i++) {
        addItem({
          lotteryType,
          betType,
          numbers: multiplyNumber,
          amount: price,
          potentialWin: price * payoutRate,
          isSet: true,
          setIndex: i + 1
        });
      }
    } else {
      // Set mode - add all numbers
      setNumbers.forEach((num, idx) => {
        addItem({
          lotteryType,
          betType,
          numbers: num,
          amount: price,
          potentialWin: price * payoutRate,
          isSet: true,
          setIndex: idx + 1
        });
      });
    }

    toast({
      title: language === "th" ? "เพิ่มลงตะกร้าแล้ว" : "Added to cart",
      description: result.displayText
    });

    handleClearAll();
  };

  // Mode config
  const modeConfig = {
    normal: { 
      th: "ปกติ", 
      en: "Normal",
      icon: Hash,
      color: "blue",
      desc: { 
        th: "แทงเลขเดียว ไม่คูณ ไม่แตกชุด", 
        en: "Single number, no multiply" 
      }
    },
    multiply: { 
      th: "คูณ", 
      en: "Multiply",
      icon: Zap,
      color: "amber",
      desc: { 
        th: "เลขเดียว คูณจำนวนไม้", 
        en: "Single number × multiplier" 
      }
    },
    set: { 
      th: "คูณชุด", 
      en: "Set Multiply",
      icon: Package,
      color: "green",
      desc: { 
        th: "หลายเลขในชุด เงิน × จำนวนเลข", 
        en: "Multiple numbers, amount × count" 
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 md:p-6 border-b">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="p-3 bg-primary rounded-2xl shadow-lg">
            <Layers className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {language === "th" ? "หวยชุด" : "Set Lottery"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === "th" 
                ? "แทงแบบปกติ, คูณ, หรือคูณชุด" 
                : "Normal, Multiply, or Set betting"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Mode Selection Cards */}
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(modeConfig) as BetMode[]).map((m) => {
            const config = modeConfig[m];
            const Icon = config.icon;
            const isActive = mode === m;
            const colorClass = config.color === 'blue' ? 'blue' : config.color === 'amber' ? 'amber' : 'green';
            
            return (
              <Card 
                key={m}
                className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                  isActive 
                    ? `ring-2 ${colorClass === 'blue' ? 'ring-blue-500 bg-blue-500/10 border-blue-500/50' : colorClass === 'amber' ? 'ring-amber-500 bg-amber-500/10 border-amber-500/50' : 'ring-green-500 bg-green-500/10 border-green-500/50'}` 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => { setMode(m); handleClearAll(); }}
              >
                <CardContent className="p-4 text-center">
                  <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                    isActive 
                      ? colorClass === 'blue' ? 'bg-blue-500 text-white' : colorClass === 'amber' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
                      : 'bg-muted'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className={`font-bold ${
                    isActive 
                      ? colorClass === 'blue' ? 'text-blue-600 dark:text-blue-400' : colorClass === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
                      : ''
                  }`}>
                    {config[language]}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 hidden sm:block">
                    {config.desc[language]}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left: Input Section */}
          <div className="lg:col-span-3 space-y-4">
            {/* Settings Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {language === "th" ? "ตั้งค่า" : "Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">{language === "th" ? "ประเภทหวย" : "Lottery"}</Label>
                    <Select value={lotteryType} onValueChange={(v) => setLotteryType(v as LotteryType)}>
                      <SelectTrigger className="h-9">
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
                    <Label className="text-xs">{language === "th" ? "ประเภทแทง" : "Bet Type"}</Label>
                    <Select value={betType} onValueChange={(v) => { setBetType(v as SetBetType); handleClearAll(); }}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {setBetTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {betTypeNames[type][language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">
                    {language === "th" ? "ราคาต่อเลข (บาท)" : "Price per Number (THB)"}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="1"
                      value={pricePerUnit}
                      onChange={(e) => setPricePerUnit(e.target.value)}
                      className="pl-10 h-9"
                      placeholder="10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mode Input Card */}
            <Card className={`border-2 ${
              mode === 'normal' ? 'border-blue-500/30 bg-blue-500/5' :
              mode === 'multiply' ? 'border-amber-500/30 bg-amber-500/5' :
              'border-green-500/30 bg-green-500/5'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {mode === "normal" && <Hash className="h-5 w-5 text-blue-500" />}
                  {mode === "multiply" && <Zap className="h-5 w-5 text-amber-500" />}
                  {mode === "set" && <Package className="h-5 w-5 text-green-500" />}
                  {modeConfig[mode][language]}
                </CardTitle>
                <CardDescription>
                  {modeConfig[mode].desc[language]}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ===== NORMAL MODE ===== */}
                {mode === "normal" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        {language === "th" ? `ใส่เลข ${requiredDigits} ตัว` : `Enter ${requiredDigits} digits`}
                      </Label>
                      <Input
                        type="text"
                        maxLength={requiredDigits}
                        value={normalNumber}
                        onChange={(e) => setNormalNumber(e.target.value.replace(/\D/g, "").slice(0, requiredDigits))}
                        placeholder={requiredDigits === 2 ? "12" : "123"}
                        className="text-center text-4xl font-mono tracking-[0.5em] h-20 border-2"
                      />
                    </div>
                    
                    {normalNumber.length === requiredDigits && (
                      <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/40">
                        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                          <CheckCircle2 className="h-5 w-5" />
                          <p className="font-semibold text-lg">{result.displayText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== MULTIPLY MODE ===== */}
                {mode === "multiply" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        {language === "th" ? `ใส่เลข ${requiredDigits} ตัว` : `Enter ${requiredDigits} digits`}
                      </Label>
                      <Input
                        type="text"
                        maxLength={requiredDigits}
                        value={multiplyNumber}
                        onChange={(e) => setMultiplyNumber(e.target.value.replace(/\D/g, "").slice(0, requiredDigits))}
                        placeholder={requiredDigits === 2 ? "12" : "123"}
                        className="text-center text-4xl font-mono tracking-[0.5em] h-20 border-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === "th" ? "จำนวนไม้ (×)" : "Multiplier (×)"}</Label>
                      <div className="flex items-center gap-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 rounded-full"
                          onClick={() => setMultiplier(Math.max(1, multiplier - 1))}
                          disabled={multiplier <= 1}
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-5xl font-bold text-amber-500">×{multiplier}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 rounded-full"
                          onClick={() => setMultiplier(multiplier + 1)}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex justify-center gap-2">
                        {[2, 3, 5, 10, 20].map((n) => (
                          <Button
                            key={n}
                            variant={multiplier === n ? "default" : "outline"}
                            size="sm"
                            className="min-w-[50px]"
                            onClick={() => setMultiplier(n)}
                          >
                            ×{n}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {multiplyNumber.length === requiredDigits && (
                      <div className="p-4 bg-amber-500/20 rounded-xl border border-amber-500/40">
                        <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                          <CheckCircle2 className="h-5 w-5" />
                          <p className="font-semibold text-lg">{result.displayText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== SET MODE ===== */}
                {mode === "set" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        {language === "th" 
                          ? `ใส่เลข ${requiredDigits} ตัว หลายเลข (คั่นด้วย , หรือ เว้นวรรค)` 
                          : `Enter ${requiredDigits}-digit numbers (comma/space separated)`}
                      </Label>
                      <Textarea
                        value={setInput}
                        onChange={(e) => setSetInput(e.target.value)}
                        placeholder={requiredDigits === 2 ? "12, 34, 56, 78, 90" : "123, 456, 789, 012"}
                        className="font-mono text-lg min-h-[80px] border-2"
                      />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {currentParsedNumbers.length > 0 ? (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {currentParsedNumbers.length} {language === "th" ? "เลขถูกต้อง" : "valid"}
                            </Badge>
                          ) : setInput.length > 0 ? (
                            <Badge variant="secondary" className="bg-red-500/20 text-red-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {language === "th" ? "ไม่มีเลขที่ถูกต้อง" : "No valid numbers"}
                            </Badge>
                          ) : null}
                        </div>
                        <Button 
                          onClick={handleAddNumbers} 
                          size="sm" 
                          className="gap-2"
                          disabled={currentParsedNumbers.length === 0}
                        >
                          <Plus className="h-4 w-4" />
                          {language === "th" ? "เพิ่มเลข" : "Add Numbers"}
                        </Button>
                      </div>
                    </div>

                    {/* Numbers List */}
                    {setNumbers.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>{language === "th" ? "เลขในชุด" : "Numbers in Set"}</Label>
                          <Badge className="bg-green-500">
                            {setNumbers.length} {language === "th" ? "ชุด" : "sets"}
                          </Badge>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30 max-h-[150px] overflow-y-auto">
                          <div className="flex flex-wrap gap-2">
                            {setNumbers.map((num, idx) => (
                              <Badge 
                                key={idx} 
                                variant="secondary"
                                className="font-mono text-base py-1.5 px-3 bg-white dark:bg-gray-800 border gap-2 group"
                              >
                                {num}
                                <button
                                  onClick={() => handleRemoveNumber(num)}
                                  className="opacity-50 hover:opacity-100 hover:text-red-500 transition-opacity"
                                >
                                  <XIcon className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {setNumbers.length > 0 && (
                      <div className="p-4 bg-green-500/20 rounded-xl border border-green-500/40">
                        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-5 w-5" />
                          <p className="font-semibold text-lg">{result.displayText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Clear Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClearAll}
                  disabled={mode === "normal" ? !normalNumber : mode === "multiply" ? !multiplyNumber : setNumbers.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === "th" ? "ล้างทั้งหมด" : "Clear All"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="sticky top-4 shadow-xl border-2">
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  {language === "th" ? "สรุปยอด" : "Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{language === "th" ? "รูปแบบ" : "Mode"}</span>
                    <Badge className={`${
                      mode === 'normal' ? 'bg-blue-500' :
                      mode === 'multiply' ? 'bg-amber-500' :
                      'bg-green-500'
                    }`}>
                      {modeConfig[mode][language]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "th" ? "ประเภท" : "Bet Type"}</span>
                    <span className="font-medium">{betTypeNames[betType][language]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "th" ? "จำนวนเลข" : "Numbers"}</span>
                    <span className="font-bold text-lg">{result.totalNumbers}</span>
                  </div>
                  {mode === "multiply" && multiplier > 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === "th" ? "จำนวนไม้" : "Multiplier"}</span>
                      <span className="font-bold text-lg text-amber-500">×{multiplier}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Total Amount */}
                <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/30">
                  <p className="text-sm text-center text-muted-foreground mb-1">
                    {language === "th" ? "ยอดรวมทั้งหมด" : "Total Amount"}
                  </p>
                  <p className="text-4xl font-bold text-center text-primary">
                    {result.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-center text-muted-foreground">
                    {language === "th" ? "บาท" : "THB"}
                  </p>
                </div>

                {/* Potential Win */}
                {result.potentialWin > 0 && (
                  <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-xl border border-yellow-500/30">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Gift className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-sm text-muted-foreground">
                        {language === "th" ? "ถ้าถูก (ต่อเลข)" : "Win per number"}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-center text-yellow-600 dark:text-yellow-400">
                      {result.potentialWin.toLocaleString()} ฿
                    </p>
                    <p className="text-xs text-center text-muted-foreground mt-1">
                      {language === "th" ? `อัตราจ่าย ×${payoutRate}` : `Payout ×${payoutRate}`}
                    </p>
                  </div>
                )}

                {/* Add to Cart Button */}
                <Button
                  className="w-full h-14 text-lg font-bold shadow-lg"
                  onClick={handleAddToCart}
                  disabled={!result.isValid || result.totalAmount <= 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {language === "th" ? "เพิ่มลงตะกร้า" : "Add to Cart"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-muted/50 to-muted/20 border-2">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-4 flex-1">
                <p className="font-bold text-foreground">
                  {language === "th" ? "📖 คำแนะนำการใช้งาน" : "📖 How to Use"}
                </p>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Normal */}
                  <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-blue-500 rounded-lg">
                        <Hash className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {language === "th" ? "ปกติ" : "Normal"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === "th" 
                        ? "แทงเลขเดียว ไม่คูณ ไม่แตกชุด เงินเท่าที่กรอก"
                        : "Single number, amount as entered"}
                    </p>
                    <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                      <p className="text-xs font-mono">
                        {language === "th" 
                          ? "ตัวอย่าง: 123 = 10 บาท"
                          : "Ex: 123 = 10 THB"}
                      </p>
                    </div>
                  </div>

                  {/* Multiply */}
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-amber-500 rounded-lg">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {language === "th" ? "คูณ" : "Multiply"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === "th" 
                        ? "เลขเดียว นำไปคูณเงินแทง (เพิ่มไม้)"
                        : "Single number × multiplier"}
                    </p>
                    <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                      <p className="text-xs font-mono">
                        {language === "th" 
                          ? "ตัวอย่าง: 123 ×3 = 30 บาท"
                          : "Ex: 123 ×3 = 30 THB"}
                      </p>
                    </div>
                  </div>

                  {/* Set */}
                  <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-green-500 rounded-lg">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {language === "th" ? "คูณชุด" : "Set Multiply"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === "th" 
                        ? "หลายเลขในชุด เงินคูณตามจำนวนเลข"
                        : "Multiple numbers × count"}
                    </p>
                    <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                      <p className="text-xs font-mono">
                        {language === "th" 
                          ? "ตัวอย่าง: 3 เลข ×10 = 30 บาท"
                          : "Ex: 3 nos ×10 = 30 THB"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold">
                          {language === "th" ? "แบบ" : "Mode"}
                        </th>
                        <th className="text-left py-2 font-semibold">
                          {language === "th" ? "ใช้เมื่อ" : "Use When"}
                        </th>
                        <th className="text-left py-2 font-semibold">
                          {language === "th" ? "สูตร" : "Formula"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-dashed">
                        <td className="py-2 text-blue-600 font-medium">{language === "th" ? "ปกติ" : "Normal"}</td>
                        <td className="py-2">{language === "th" ? "เลขเดียว ปกติ" : "Single number"}</td>
                        <td className="py-2 font-mono">{language === "th" ? "ราคา" : "Price"}</td>
                      </tr>
                      <tr className="border-b border-dashed">
                        <td className="py-2 text-amber-600 font-medium">{language === "th" ? "คูณ" : "Multiply"}</td>
                        <td className="py-2">{language === "th" ? "มีเครื่องหมาย ×" : "Has × symbol"}</td>
                        <td className="py-2 font-mono">{language === "th" ? "ราคา × ไม้" : "Price × Mult"}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-green-600 font-medium">{language === "th" ? "คูณชุด" : "Set"}</td>
                        <td className="py-2">{language === "th" ? "หลายเลขใน 1 ชุด" : "Multiple in set"}</td>
                        <td className="py-2 font-mono">{language === "th" ? "ราคา × จำนวนเลข" : "Price × Count"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
