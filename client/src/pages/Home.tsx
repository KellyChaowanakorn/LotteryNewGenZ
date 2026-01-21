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
import { 
  lotteryTypes,
  betTypes,
  type LotteryType, 
  type BetType,
  lotteryTypeNames,
  lotteryDrawTimes,
  betTypeNames,
  payoutRates
} from "@shared/schema";
import { Calculator, ShoppingCart, Clock, Star, Sparkles, ChevronRight } from "lucide-react";

// API Response type (from database)
interface BlockedNumberAPI {
  id: number;
  lotteryType: string;
  number: string;
  betType: string | null;
  isActive: number;
  createdAt: number;
}

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

  // FIX 1: Use proper API response type instead of BlockedNumber
  const { data: blockedData } = useQuery<BlockedNumberAPI[]>({
    queryKey: ["/api/blocked-numbers"],
    staleTime: 30000,
  });

  useEffect(() => {
    if (blockedData) {
      // Convert API response to BlockedNumberDTO format expected by store
      const validLotteryTypes: readonly string[] = lotteryTypes;
      const validBetTypes: readonly string[] = betTypes;
      
      const converted = blockedData
        .filter(item => validLotteryTypes.includes(item.lotteryType))
        .map(item => ({
          lotteryType: item.lotteryType as LotteryType,
          number: item.number,
          betType: item.betType && validBetTypes.includes(item.betType) 
            ? (item.betType as BetType) 
            : null,
          isActive: item.isActive === 1, // Convert number to boolean
        }));
      
      setBlockedNumbers(converted);
    }
  }, [blockedData, setBlockedNumbers]);

  const handleAddToCart = () => {
    if (!selectedLottery || !selectedBetType || numbers.length === 0 || amount <= 0) {
      toast({ title: language === "th" ? "ข้อมูลไม่ครบ" : "Missing information", variant: "destructive" });
      return;
    }
    if (numbers.some(num => isBlocked(selectedLottery, num, selectedBetType))) {
      toast({ title: t("home.blockedWarning"), variant: "destructive" });
      return;
    }
    
    // FIX 2: Include potentialWin in addItem call
    const payoutRate = payoutRates[selectedBetType];
    numbers.forEach(num => addItem({ 
      lotteryType: selectedLottery, 
      betType: selectedBetType, 
      numbers: num, 
      amount,
      potentialWin: amount * payoutRate
    }));
    
    toast({ title: language === "th" ? "เพิ่มในตะกร้าแล้ว" : "Added to cart" });
    setNumbers([]);
  };

  const potentialWin = selectedBetType ? amount * payoutRates[selectedBetType] * Math.max(1, numbers.length) : 0;

  const goToNextTab = () => {
    if (activeTab === "lottery" && selectedLottery) setActiveTab("bet");
    else if (activeTab === "bet" && selectedBetType) setActiveTab("number");
    else if (activeTab === "number" && numbers.length > 0) setActiveTab("amount");
  };

  return (
    <div className="min-h-full">
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 md:p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl"><Calculator className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{language === "th" ? "เครื่องคิดเลขแทงหวย" : "Lottery Calculator"}</h1>
            <p className="text-sm text-muted-foreground">{language === "th" ? "หวย 6 ประเภท: รัฐบาล, หุ้นไทย, นิเคอิ, ฮั่งเส็ง, ดาวโจนส์, มาเลย์" : "6 Types: Thai Gov, SET, Nikkei, HSI, Dow, Malaysia"}</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="lottery">1. หวย</TabsTrigger>
                <TabsTrigger value="bet" disabled={!selectedLottery}>2. แทง</TabsTrigger>
                <TabsTrigger value="number" disabled={!selectedBetType}>3. เลข</TabsTrigger>
                <TabsTrigger value="amount" disabled={numbers.length === 0}>4. เงิน</TabsTrigger>
              </TabsList>

              <TabsContent value="lottery">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-primary" />{t("home.selectLottery")}</CardTitle>
                    <CardDescription>{language === "th" ? "เลือกหวย 6 ประเภท" : "Select from 6 lottery types"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[400px]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {lotteryTypes.map((type) => (
                          <LotteryTypeCard
                            key={type}
                            type={type}
                            isSelected={selectedLottery === type}
                            onClick={() => { setSelectedLottery(type); setSelectedBetType(null); setNumbers([]); }}
                            drawTime={lotteryDrawTimes[type][language]}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                    {selectedLottery && <Button className="w-full mt-4" onClick={goToNextTab}>{language === "th" ? "ถัดไป" : "Next"}<ChevronRight className="h-4 w-4 ml-1" /></Button>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bet">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />{t("home.selectBetType")}</CardTitle>
                    <CardDescription>{selectedLottery && lotteryTypeNames[selectedLottery][language]}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BetTypeSelector selectedType={selectedBetType} onSelect={(type) => { setSelectedBetType(type); setNumbers([]); }} lotteryType={selectedLottery} />
                    {selectedBetType && <Button className="w-full mt-4" onClick={goToNextTab}>{language === "th" ? "ถัดไป" : "Next"}<ChevronRight className="h-4 w-4 ml-1" /></Button>}
                  </CardContent>
                </Card>
                {selectedLottery && <BlockedNumbersDisplay lotteryType={selectedLottery} />}
              </TabsContent>

              <TabsContent value="number">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" />{t("home.enterNumber")}</CardTitle>
                    <CardDescription>{selectedBetType && betTypeNames[selectedBetType][language]}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NumberInput lotteryType={selectedLottery} betType={selectedBetType} numbers={numbers} onNumbersChange={setNumbers} />
                    {numbers.length > 0 && <Button className="w-full mt-4" onClick={goToNextTab}>{language === "th" ? "ถัดไป" : "Next"}<ChevronRight className="h-4 w-4 ml-1" /></Button>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="amount">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" />{t("home.enterAmount")}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <AmountInput amount={amount} onAmountChange={setAmount} betType={selectedBetType} numbersCount={numbers.length} />
                    <Button className="w-full h-12 text-lg" onClick={handleAddToCart} disabled={!selectedLottery || !selectedBetType || numbers.length === 0 || amount <= 0}>
                      <ShoppingCart className="h-5 w-5 mr-2" />{t("home.addToCart")}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card className="sticky top-4 bg-gradient-to-br from-card to-primary/5 border-primary/20">
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />{language === "th" ? "สรุปรายการ" : "Summary"}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{language === "th" ? "ประเภทหวย" : "Lottery"}</span><span className="font-medium">{selectedLottery ? lotteryTypeNames[selectedLottery][language] : "-"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{language === "th" ? "รูปแบบ" : "Bet Type"}</span><span className="font-medium">{selectedBetType ? betTypeNames[selectedBetType][language] : "-"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{language === "th" ? "จำนวนเลข" : "Numbers"}</span><span className="font-medium">{numbers.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{language === "th" ? "เงินต่อเลข" : "Per Number"}</span><span className="font-medium">{amount.toLocaleString()} {t("common.baht")}</span></div>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">{language === "th" ? "ยอดรวม" : "Total"}</span><span className="font-bold text-lg">{(amount * Math.max(1, numbers.length)).toLocaleString()} {t("common.baht")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("home.potentialWin")}</span><span className="font-bold text-xl text-primary">{potentialWin.toLocaleString()} {t("common.baht")}</span></div>
                </div>
              </CardContent>
            </Card>
            {numbers.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{language === "th" ? "เลขที่เลือก" : "Selected Numbers"}</CardTitle></CardHeader>
                <CardContent><div className="flex flex-wrap gap-2">{numbers.map((num, idx) => <div key={idx} className="bg-primary/10 text-primary font-mono font-bold px-3 py-1.5 rounded-lg text-lg tracking-widest">{num}</div>)}</div></CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
