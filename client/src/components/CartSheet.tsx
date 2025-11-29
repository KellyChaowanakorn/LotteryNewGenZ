import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart, useUser } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { lotteryTypeNames, betTypeNames, payoutRates } from "@shared/schema";
import { ShoppingCart, Trash2, X, Wallet, CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "./PaymentModal";

export function CartSheet() {
  const { language, t } = useI18n();
  const { items, removeItem, clearCart, getTotal, getTotalPotentialWin } = useCart();
  const { user } = useUser();
  const { toast } = useToast();
  const [showPayment, setShowPayment] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const total = getTotal();
  const potentialWin = getTotalPotentialWin();
  const userBalance = user?.balance || 0;
  const hasEnoughBalance = userBalance >= total;

  const submitBetsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not logged in");
      
      const betItems = items.map(item => ({
        lotteryType: item.lotteryType,
        betType: item.betType,
        numbers: item.numbers,
        amount: item.amount
      }));
      
      const res = await apiRequest("POST", "/api/bets", { 
        userId: user.id,
        items: betItems 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      clearCart();
      setIsOpen(false);
      toast({
        title: language === "th" ? "ซื้อหวยสำเร็จ!" : "Bet placed successfully!",
        description: language === "th" 
          ? `ตัดเงินจากยอดคงเหลือ ${total.toLocaleString()} บาท` 
          : `${total.toLocaleString()} THB deducted from balance`
      });
    },
    onError: (error) => {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error occurred",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCheckout = () => {
    if (items.length === 0) return;
    
    if (!user?.id) {
      toast({
        title: language === "th" ? "กรุณาเข้าสู่ระบบ" : "Please login",
        variant: "destructive"
      });
      return;
    }

    if (hasEnoughBalance) {
      submitBetsMutation.mutate();
    } else {
      setShowPayment(true);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
            <ShoppingCart className="h-5 w-5" />
            {items.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {items.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t("cart.title")}
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
              <p>{t("cart.empty")}</p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 my-4 max-h-[50vh]">
                <div className="space-y-3 pr-4">
                  {items.map((item) => (
                    <Card key={item.id} className="relative">
                      <CardContent className="p-3">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="absolute top-2 right-2 p-1 hover:bg-destructive/20 rounded-full transition-colors"
                          data-testid={`button-remove-item-${item.id}`}
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                        <div className="space-y-1 pr-6">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {lotteryTypeNames[item.lotteryType][language]}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {betTypeNames[item.betType][language]}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xl font-bold font-mono tracking-widest">
                              {item.numbers}
                            </span>
                            <div className="text-right">
                              <p className="font-semibold">
                                {item.amount.toLocaleString()} {t("common.baht")}
                              </p>
                              <p className="text-xs text-primary">
                                {language === "th" ? "ชนะ" : "Win"}: {(item.amount * payoutRates[item.betType]).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              <div className="space-y-3 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("cart.total")}</span>
                  <span className="text-xl font-bold">
                    {total.toLocaleString()} {t("common.baht")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("home.potentialWin")}</span>
                  <span className="text-xl font-bold text-primary">
                    {potentialWin.toLocaleString()} {t("common.baht")}
                  </span>
                </div>
                {user && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Wallet className="h-4 w-4" />
                      {language === "th" ? "ยอดคงเหลือ" : "Balance"}
                    </span>
                    <span className={`text-lg font-semibold ${hasEnoughBalance ? "text-green-600" : "text-orange-500"}`}>
                      {userBalance.toLocaleString()} {t("common.baht")}
                    </span>
                  </div>
                )}
                {user && !hasEnoughBalance && total > 0 && (
                  <p className="text-sm text-orange-500 text-center">
                    {language === "th" 
                      ? `ยอดไม่เพียงพอ ต้องเติมอีก ${(total - userBalance).toLocaleString()} บาท`
                      : `Insufficient balance. Need ${(total - userBalance).toLocaleString()} THB more`
                    }
                  </p>
                )}
              </div>

              <SheetFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="flex-1"
                  data-testid="button-clear-cart"
                  disabled={submitBetsMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("cart.clear")}
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="flex-1"
                  disabled={submitBetsMutation.isPending}
                  data-testid="button-checkout"
                >
                  {submitBetsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === "th" ? "กำลังซื้อ..." : "Processing..."}
                    </>
                  ) : hasEnoughBalance ? (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      {language === "th" ? "ซื้อหวย" : "Buy Tickets"}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {language === "th" ? "เติมเงิน" : "Top Up"}
                    </>
                  )}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={total}
      />
    </>
  );
}
