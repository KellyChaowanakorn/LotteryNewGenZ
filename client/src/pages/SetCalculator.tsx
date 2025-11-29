import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Calculator, Hash, DollarSign, Layers, Copy, Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalculationResult {
  sets: string[][];
  uniqueNumbers: string[];
  totalSets: number;
  totalAmount: number;
}

export default function SetCalculator() {
  const { language } = useI18n();
  const { toast } = useToast();
  const [numbersInput, setNumbersInput] = useState("");
  const [pricePerSet, setPricePerSet] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo<CalculationResult>(() => {
    if (!numbersInput.trim()) {
      return { sets: [], uniqueNumbers: [], totalSets: 0, totalAmount: 0 };
    }

    const lines = numbersInput.split(/\n/).filter(line => line.trim());
    const sets: string[][] = [];
    const allNumbers = new Set<string>();

    for (const line of lines) {
      const numbers = line
        .split(/[,\s]+/)
        .map(n => n.trim())
        .filter(n => /^\d+$/.test(n));
      
      if (numbers.length > 0) {
        sets.push(numbers);
        numbers.forEach(n => allNumbers.add(n));
      }
    }

    const price = parseFloat(pricePerSet) || 0;
    const uniqueNumbers = Array.from(allNumbers).sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      return a.localeCompare(b);
    });

    return {
      sets,
      uniqueNumbers,
      totalSets: sets.length,
      totalAmount: sets.length * price
    };
  }, [numbersInput, pricePerSet]);

  const handleClear = () => {
    setNumbersInput("");
    setPricePerSet("");
  };

  const handleCopyNumbers = async () => {
    if (result.uniqueNumbers.length === 0) return;
    
    try {
      await navigator.clipboard.writeText(result.uniqueNumbers.join(", "));
      setCopied(true);
      toast({
        title: language === "th" ? "คัดลอกแล้ว" : "Copied",
        description: language === "th" 
          ? `คัดลอก ${result.uniqueNumbers.length} เลข` 
          : `Copied ${result.uniqueNumbers.length} numbers`
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: language === "th" ? "ไม่สามารถคัดลอกได้" : "Failed to copy",
        variant: "destructive"
      });
    }
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
              ? "คำนวณจำนวนชุด เลขที่ครอบคลุม และยอดรวม" 
              : "Calculate sets, covered numbers, and total amount"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                {language === "th" ? "ใส่เลขชุด" : "Enter Number Sets"}
              </CardTitle>
              <CardDescription>
                {language === "th" 
                  ? "ใส่เลขแต่ละชุดคั่นด้วย , หรือ ช่องว่าง หรือขึ้นบรรทัดใหม่" 
                  : "Separate numbers with comma, space, or new line"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numbers">
                  {language === "th" ? "เลขชุด" : "Number Sets"}
                </Label>
                <Textarea
                  id="numbers"
                  placeholder={language === "th" 
                    ? "ตัวอย่าง:\n123, 456, 789\n111 222 333\n555\n666, 777" 
                    : "Example:\n123, 456, 789\n111 222 333\n555\n666, 777"}
                  value={numbersInput}
                  onChange={(e) => setNumbersInput(e.target.value)}
                  className="min-h-[200px] font-mono"
                  data-testid="textarea-numbers"
                />
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
                    min="0"
                    placeholder="0"
                    value={pricePerSet}
                    onChange={(e) => setPricePerSet(e.target.value)}
                    className="pl-10"
                    data-testid="input-price"
                  />
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleClear}
                data-testid="button-clear"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {language === "th" ? "ล้างข้อมูล" : "Clear"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                {language === "th" ? "ผลการคำนวณ" : "Calculation Result"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      {language === "th" ? "จำนวนชุด" : "Total Sets"}
                    </p>
                    <p className="text-3xl font-bold text-primary" data-testid="text-total-sets">
                      {result.totalSets}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-accent/50 border-accent">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      {language === "th" ? "เลขไม่ซ้ำ" : "Unique Numbers"}
                    </p>
                    <p className="text-3xl font-bold text-accent-foreground" data-testid="text-unique-count">
                      {result.uniqueNumbers.length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === "th" ? "ยอดรวมทั้งหมด" : "Total Amount"}
                  </p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-amount">
                    {result.totalAmount.toLocaleString()} ฿
                  </p>
                  {result.totalSets > 0 && pricePerSet && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.totalSets} {language === "th" ? "ชุด" : "sets"} × {parseFloat(pricePerSet).toLocaleString()} ฿
                    </p>
                  )}
                </CardContent>
              </Card>

              {result.uniqueNumbers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>
                      {language === "th" ? "เลขที่ครอบคลุม (ไม่ซ้ำ)" : "Covered Numbers (Unique)"}
                    </Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyNumbers}
                      data-testid="button-copy-numbers"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {language === "th" ? "คัดลอก" : "Copy"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-2 bg-muted/30 rounded-lg">
                    {result.uniqueNumbers.map((num, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="font-mono text-sm"
                        data-testid={`badge-number-${idx}`}
                      >
                        {num}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.sets.length > 0 && (
                <div className="space-y-3">
                  <Label>
                    {language === "th" ? "รายละเอียดแต่ละชุด" : "Set Details"}
                  </Label>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {result.sets.map((set, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
                        data-testid={`row-set-${idx}`}
                      >
                        <Badge variant="outline" className="shrink-0">
                          {language === "th" ? `ชุดที่ ${idx + 1}` : `Set ${idx + 1}`}
                        </Badge>
                        <span className="font-mono text-sm">
                          {set.join(", ")}
                        </span>
                        <span className="text-muted-foreground text-sm ml-auto">
                          ({set.length} {language === "th" ? "เลข" : "numbers"})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              {language === "th" 
                ? "💡 เคล็ดลับ: ใส่เลขแต่ละชุดในบรรทัดใหม่ หรือคั่นด้วยคอมม่า (,) หรือช่องว่าง ระบบจะคำนวณให้อัตโนมัติ" 
                : "💡 Tip: Enter each set on a new line, or separate with commas (,) or spaces. The system will calculate automatically."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
