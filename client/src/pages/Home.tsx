import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LotteryTypeCard } from "@/components/LotteryTypeCard";
import { BetTypeSelector } from "@/components/BetTypeSelector";
import { NumberInput } from "@/components/NumberInput";
import { AmountInput } from "@/components/AmountInput";
import { BlockedNumbersDisplay } from "@/components/BlockedNumbersDisplay";
import { useI18n } from "@/lib/i18n";
import { useCart, useBlockedNumbers } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import type { BlockedNumber } from "@shared/schema";
import { 
  lotteryTypes, 
  type LotteryType, 
  type BetType,
  lotteryTypeNames,
  betTypeNames,
  payoutRates
} from "@shared/schema";
import { 
  Calculator, 
  ShoppingCart, 
  Clock,
  Star,
  Sparkles,
  ChevronRight
} from "lucide-react";

const lotteryDrawTimes: Partial<Record<LotteryType, string>> = {
  THAI_GOV: "1, 16 ทุกเดือน 15:00",
  THAI_STOCK: "ทุกวัน 12:00, 16:30",
  STOCK_NIKKEI: "จ-ศ 15:30",
  STOCK_DOW: "จ-ศ 05:30",
  STOCK_FTSE: "จ-ศ 00:30",
  STOCK_DAX: "จ-ศ 01:00",
  LAO: "จ-ส 20:30",
  HANOI: "ทุกวัน 18:30",
  MALAYSIA: "พ, ส, อา 19:00",
  SINGAPORE: "จ, พ 18:00",
  KENO: "ทุก 5 นาที"
};

export default function Home() {
  const { language, t } = useI18n();
  const { addItem } = useCart();
  const { isBlocked, setBlockedNumbers } = useBlockedNumbers();
  const { toast } = useToast();

  const [selectedLottery, setSelectedLottery] = useState<LotteryType | null>(null);
  const [selectedBetType, setSelectedBetType] = useState<BetType | null>(null);
  const [numbers, setNumbers] = useState<string[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("lottery");

  const { data: blockedData } = useQuery<BlockedNumber[]>({
    queryKey: ["/api/blocked-numbers"],
    staleTime: 30000,
  });

  useEffect(() => {
    if (blockedData) {
      setBlockedNumbers(blockedData);
    }
  }, [blockedData, setBlockedNumbers]);

  const handleAddToCart = () => {
    if (!selectedLottery || !selectedBetType || numbers.length === 0 || amount <= 0) {
      toast({
        title: language === "th" ? "ข้อมูลไม่ครบ" : "Missing information",
        description: language === "th" 
          ? "กรุณาเลือกหวย ประเภทการแทง เลข และจำนวนเงิน" 
          : "Please select lottery type, bet type, numbers, and amount",
        variant: "destructive"
      });
      return;
    }

    const hasBlocked = numbers.some(num => isBlocked(selectedLottery, num, selectedBetType));
    if (hasBlocked) {
      toast({
        title: t("home.blockedWarning"),
        variant: "destructive"
      });
      return;
    }

    numbers.forEach(num => {
      addItem({
        lotteryType: selectedLottery,
        betType: selectedBetType,
        numbers: num,
        amount
      });
    });

    toast({
      title: language === "th" ? "เพิ่มในตะกร้าแล้ว" : "Added to cart",
      description: `${numbers.length} ${language === "th" ? "รายการ" : "items"}`
    });

    setNumbers([]);
  };

  const potentialWin = selectedBetType 
    ? amount * payoutRates[selectedBetType] * Math.max(1, numbers.length)
    : 0;

  const goToNextTab = () => {
    if (activeTab === "lottery" && selectedLottery) setActiveTab("bet");
    else if (activeTab === "bet" && selectedBetType) setActiveTab("number");
    else if (activeTab === "number" && numbers.length > 0) setActiveTab("amount");
  };

  return (
    <div className="min-h-full">
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 md:p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              {language === "th" ? "เครื่องคิดเลขแทงหวย" : "Lottery Betting Calculator"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === "th" 
                ? "เลือกหวย → เลือกประเภท → กรอกเลข → ใส่จำนวนเงิน" 
                : "Select lottery → Choose bet type → Enter numbers → Set amount"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="lottery" className="text-xs md:text-sm">
                  <span className="hidden md:inline">{t("home.selectLottery")}</span>
                  <span className="md:hidden">1. หวย</span>
                </TabsTrigger>
                <TabsTrigger value="bet" disabled={!selectedLottery} className="text-xs md:text-sm">
                  <span className="hidden md:inline">{t("home.selectBetType")}</span>
                  <span className="md:hidden">2. แทง</span>
                </TabsTrigger>
                <TabsTrigger value="number" disabled={!selectedBetType} className="text-xs md:text-sm">
                  <span className="hidden md:inline">{t("home.enterNumber")}</span>
                  <span className="md:hidden">3. เลข</span>
                </TabsTrigger>
                <TabsTrigger value="amount" disabled={numbers.length === 0} className="text-xs md:text-sm">
                  <span className="hidden md:inline">{t("home.enterAmount")}</span>
                  <span className="md:hidden">4. เงิน</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lottery" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      {t("home.selectLottery")}
                    </CardTitle>
                    <CardDescription>
                      {language === "th" 
                        ? "เลือกประเภทหวยที่ต้องการแทง" 
                        : "Choose the lottery you want to bet on"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[400px]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2">
                        {lotteryTypes.map((type) => (
                          <LotteryTypeCard
                            key={type}
                            type={type}
                            isSelected={selectedLottery === type}
                            onClick={() => {
                              setSelectedLottery(type);
                              setSelectedBetType(null);
                              setNumbers([]);
                            }}
                            drawTime={lotteryDrawTimes[type]}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                    {selectedLottery && (
                      <Button 
                        className="w-full mt-4" 
                        onClick={goToNextTab}
                        data-testid="button-next-step-lottery"
                      >
                        {language === "th" ? "ถัดไป" : "Next"}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bet" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {t("home.selectBetType")}
                    </CardTitle>
                    <CardDescription>
                      {selectedLottery && lotteryTypeNames[selectedLottery][language]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BetTypeSelector
                      selectedType={selectedBetType}
                      onSelect={(type) => {
                        setSelectedBetType(type);
                        setNumbers([]);
                      }}
                      lotteryType={selectedLottery}
                    />
                    {selectedBetType && (
                      <Button 
                        className="w-full mt-4" 
                        onClick={goToNextTab}
                        data-testid="button-next-step-bet"
                      >
                        {language === "th" ? "ถัดไป" : "Next"}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {selectedLottery && (
                  <BlockedNumbersDisplay lotteryType={selectedLottery} />
                )}
              </TabsContent>

              <TabsContent value="number" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-primary" />
                      {t("home.enterNumber")}
                    </CardTitle>
                    <CardDescription>
                      {selectedBetType && betTypeNames[selectedBetType][language]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NumberInput
                      lotteryType={selectedLottery}
                      betType={selectedBetType}
                      numbers={numbers}
                      onNumbersChange={setNumbers}
                    />
                    {numbers.length > 0 && (
                      <Button 
                        className="w-full mt-4" 
                        onClick={goToNextTab}
                        data-testid="button-next-step-number"
                      >
                        {language === "th" ? "ถัดไป" : "Next"}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="amount" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      {t("home.enterAmount")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AmountInput
                      amount={amount}
                      onAmountChange={setAmount}
                      betType={selectedBetType}
                      numbersCount={numbers.length}
                    />
                    
                    <Button
                      className="w-full h-12 text-lg"
                      onClick={handleAddToCart}
                      disabled={!selectedLottery || !selectedBetType || numbers.length === 0 || amount <= 0}
                      data-testid="button-add-to-cart"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {t("home.addToCart")}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card className="sticky top-4 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {language === "th" ? "สรุปรายการ" : "Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === "th" ? "ประเภทหวย" : "Lottery"}
                    </span>
                    <span className="font-medium">
                      {selectedLottery 
                        ? lotteryTypeNames[selectedLottery][language] 
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === "th" ? "รูปแบบ" : "Bet Type"}
                    </span>
                    <span className="font-medium">
                      {selectedBetType 
                        ? betTypeNames[selectedBetType][language] 
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === "th" ? "จำนวนเลข" : "Numbers"}
                    </span>
                    <span className="font-medium">{numbers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === "th" ? "เงินต่อเลข" : "Per Number"}
                    </span>
                    <span className="font-medium">
                      {amount.toLocaleString()} {t("common.baht")}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === "th" ? "ยอดรวม" : "Total"}
                    </span>
                    <span className="font-bold text-lg">
                      {(amount * Math.max(1, numbers.length)).toLocaleString()} {t("common.baht")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("home.potentialWin")}</span>
                    <span className="font-bold text-xl text-primary">
                      {potentialWin.toLocaleString()} {t("common.baht")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {numbers.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {language === "th" ? "เลขที่เลือก" : "Selected Numbers"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {numbers.map((num, idx) => (
                      <div 
                        key={idx}
                        className="bg-primary/10 text-primary font-mono font-bold px-3 py-1.5 rounded-lg text-lg tracking-widest"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
