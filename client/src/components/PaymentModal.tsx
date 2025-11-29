import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useCart, useUser } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Building2, QrCode, Upload, Check, Clock, Loader2 } from "lucide-react";
import { useState } from "react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
}

const bankAccount = {
  bankName: "กสิกรไทย",
  accountNumber: "123-4-56789-0",
  accountName: "QNQ Lottery Co., Ltd.",
  promptPayId: "0123456789"
};

export function PaymentModal({ isOpen, onClose, amount }: PaymentModalProps) {
  const { language, t } = useI18n();
  const { clearCart, items } = useCart();
  const { user } = useUser();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);

  const referenceNumber = `QNQ${Date.now().toString(36).toUpperCase()}`;

  const submitBetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bets", {
        userId: user?.id || "guest",
        items: items.map(item => ({
          lotteryType: item.lotteryType,
          betType: item.betType,
          numbers: item.numbers,
          amount: item.amount
        }))
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bets?userId=${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${user?.id}`] });
      clearCart();
      setSlipFile(null);
      onClose();
      toast({
        title: language === "th" ? "บันทึกรายการแทงสำเร็จ" : "Bets submitted successfully",
        description: language === "th" 
          ? "กรุณารอการตรวจสอบการชำระเงิน" 
          : "Please wait for payment verification"
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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!slipFile) {
      toast({
        title: language === "th" ? "กรุณาอัพโหลดสลิป" : "Please upload slip",
        variant: "destructive"
      });
      return;
    }

    submitBetsMutation.mutate();
  };

  const promptPayQrData = `00020101021129370016A000000677010111011300${bankAccount.promptPayId}5802TH53037646304`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t("payment.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                {language === "th" ? "ยอดที่ต้องชำระ" : "Amount to Pay"}
              </p>
              <p className="text-3xl font-bold text-primary">
                {amount.toLocaleString()} {t("common.baht")}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {t("payment.reference")}: {referenceNumber}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="promptpay">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="promptpay" className="gap-2">
                <QrCode className="h-4 w-4" />
                {t("payment.promptPay")}
              </TabsTrigger>
              <TabsTrigger value="bank" className="gap-2">
                <Building2 className="h-4 w-4" />
                {t("payment.bankTransfer")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="promptpay" className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG 
                  value={promptPayQrData}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("payment.scanQr")}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="font-mono font-bold">{bankAccount.promptPayId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(bankAccount.promptPayId, "promptpay")}
                  >
                    {copied === "promptpay" ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bank" className="space-y-3">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {language === "th" ? "ธนาคาร" : "Bank"}
                    </span>
                    <span className="font-semibold">{bankAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {language === "th" ? "เลขบัญชี" : "Account No."}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{bankAccount.accountNumber}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(bankAccount.accountNumber.replace(/-/g, ""), "account")}
                      >
                        {copied === "account" ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {language === "th" ? "ชื่อบัญชี" : "Account Name"}
                    </span>
                    <span className="font-semibold">{bankAccount.accountName}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="slip">{t("payment.uploadSlip")}</Label>
            <div className="relative">
              <Input
                id="slip"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
                data-testid="input-upload-slip"
              />
              {slipFile && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {slipFile.name}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!slipFile || submitBetsMutation.isPending}
            data-testid="button-confirm-payment"
          >
            {submitBetsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === "th" ? "กำลังบันทึก..." : "Saving..."}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {t("payment.confirm")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
