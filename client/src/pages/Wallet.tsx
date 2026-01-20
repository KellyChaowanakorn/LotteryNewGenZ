import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QRCodeSVG } from "qrcode.react";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  Check,
  Building2,
  QrCode,
  CreditCard,
  Upload,
  Loader2,
  Coins
} from "lucide-react";
import type { User } from "@shared/schema";

const bankAccount = {
  bankName: "กสิกรไทย",
  accountNumber: "123-4-56789-0",
  accountName: "QNQ Lottery Co., Ltd.",
  promptPayId: "0123456789"
};

// Crypto wallet addresses - Replace with your actual addresses
const cryptoWallets = [
  {
    id: "usdt-trc20",
    name: "USDT",
    network: "TRC20",
    networkFull: "Tron Network",
    address: "TXrZ9BGmhMLN4ykrLBVN9LqFkJKVNhBcut",
    icon: "₮",
    color: "bg-emerald-500",
    minDeposit: 10,
  },
  {
    id: "usdt-erc20",
    name: "USDT",
    network: "ERC20",
    networkFull: "Ethereum Network",
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    icon: "₮",
    color: "bg-blue-500",
    minDeposit: 50,
  },
  {
    id: "usdc",
    name: "USDC",
    network: "ERC20",
    networkFull: "Ethereum Network",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    icon: "$",
    color: "bg-blue-600",
    minDeposit: 50,
  },
  {
    id: "btc",
    name: "BTC",
    network: "Bitcoin",
    networkFull: "Bitcoin Network",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    icon: "₿",
    color: "bg-orange-500",
    minDeposit: 0.0001,
  },
];

export default function WalletPage() {
  const { language, t } = useI18n();
  const { user, isAuthenticated } = useUser();
  const { toast } = useToast();

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [depositMethod, setDepositMethod] = useState<"fiat" | "crypto">("fiat");

  const quickAmounts = [100, 300, 500, 1000, 3000, 5000];

  const { data: userData, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
  });

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      const res = await apiRequest("POST", "/api/transactions", {
        userId: user?.id,
        type: "deposit",
        amount: data.amount,
        slipUrl: slipFile?.name || null
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${user?.id}`] });
      setDepositAmount("");
      setSlipFile(null);
      toast({
        title: language === "th" ? "ส่งคำขอฝากเงินแล้ว" : "Deposit request submitted",
        description: language === "th" ? "กรุณารอการตรวจสอบ 5-10 นาที" : "Please wait 5-10 minutes for verification"
      });
    },
    onError: () => {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error occurred",
        variant: "destructive"
      });
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; account: string }) => {
      const res = await apiRequest("POST", "/api/transactions", {
        userId: user?.id,
        type: "withdrawal",
        amount: -data.amount,
        slipUrl: null
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${user?.id}`] });
      setWithdrawAmount("");
      setWithdrawAccount("");
      toast({
        title: language === "th" ? "ส่งคำขอถอนเงินแล้ว" : "Withdrawal request submitted",
        description: language === "th" ? "จะโอนเงินภายใน 24 ชั่วโมง" : "Money will be transferred within 24 hours"
      });
    },
    onError: () => {
      toast({
        title: language === "th" ? "เกิดข้อผิดพลาด" : "Error occurred",
        variant: "destructive"
      });
    }
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast({
      title: language === "th" ? "คัดลอกแล้ว!" : "Copied!",
      description: text.slice(0, 20) + "...",
    });
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{language === "th" ? "กระเป๋าเงิน" : "Wallet"}</CardTitle>
            <CardDescription>
              {language === "th" 
                ? "เข้าสู่ระบบเพื่อฝาก-ถอนเงิน" 
                : "Login to deposit or withdraw"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <a href="/login">{t("nav.login")}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balance = userData?.balance || user?.balance || 0;

  const handleDeposit = () => {
    if (!depositAmount || !slipFile) {
      toast({
        title: language === "th" ? "กรุณากรอกข้อมูลให้ครบ" : "Please fill all fields",
        variant: "destructive"
      });
      return;
    }

    depositMutation.mutate({ amount: parseInt(depositAmount) });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || !withdrawAccount) {
      toast({
        title: language === "th" ? "กรุณากรอกข้อมูลให้ครบ" : "Please fill all fields",
        variant: "destructive"
      });
      return;
    }

    const amount = parseInt(withdrawAmount);
    if (amount > balance) {
      toast({
        title: language === "th" ? "ยอดเงินไม่เพียงพอ" : "Insufficient balance",
        variant: "destructive"
      });
      return;
    }

    withdrawMutation.mutate({ amount, account: withdrawAccount });
  };

  const promptPayQrData = `00020101021129370016A000000677010111011300${bankAccount.promptPayId}5802TH53037646304`;

  const selectedCryptoData = cryptoWallets.find(c => c.id === selectedCrypto);

  return (
    <div className="min-h-full">
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 md:p-6 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                {language === "th" ? "กระเป๋าเงิน" : "Wallet"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === "th" ? "ฝาก-ถอนเงิน" : "Deposit & Withdraw"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t("profile.balance")}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-primary">
                {balance.toLocaleString()} {t("common.baht")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <Tabs defaultValue="deposit" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" className="gap-2">
              <ArrowDownRight className="h-4 w-4" />
              {t("profile.deposit")}
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              {t("profile.withdraw")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            {/* Deposit Method Selector */}
            <div className="flex gap-2">
              <Button
                variant={depositMethod === "fiat" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => {
                  setDepositMethod("fiat");
                  setSelectedCrypto(null);
                }}
              >
                <Building2 className="h-4 w-4" />
                {language === "th" ? "โอนเงิน / พร้อมเพย์" : "Bank / PromptPay"}
              </Button>
              <Button
                variant={depositMethod === "crypto" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setDepositMethod("crypto")}
              >
                <Coins className="h-4 w-4" />
                {language === "th" ? "คริปโต" : "Crypto"}
              </Button>
            </div>

            {/* Fiat Deposit Section */}
            {depositMethod === "fiat" && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        {t("payment.promptPay")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-center p-4 bg-white rounded-lg">
                        <QRCodeSVG 
                          value={promptPayQrData}
                          size={180}
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
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {t("payment.bankTransfer")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            {language === "th" ? "ธนาคาร" : "Bank"}
                          </span>
                          <span className="font-semibold">{bankAccount.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {language === "th" ? "เลขบัญชี" : "Account"}
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
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            {language === "th" ? "ชื่อบัญชี" : "Name"}
                          </span>
                          <span className="font-semibold text-sm">{bankAccount.accountName}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {language === "th" ? "ยืนยันการฝากเงิน" : "Confirm Deposit"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>{language === "th" ? "จำนวนเงินที่โอน" : "Amount Transferred"}</Label>
                      <Input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0"
                        className="text-lg font-bold"
                        data-testid="input-deposit-amount"
                      />
                      <div className="flex flex-wrap gap-2">
                        {quickAmounts.map((amt) => (
                          <Button
                            key={amt}
                            variant="outline"
                            size="sm"
                            onClick={() => setDepositAmount(amt.toString())}
                          >
                            {amt.toLocaleString()}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("payment.uploadSlip")}</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                        data-testid="input-deposit-slip"
                      />
                      {slipFile && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          {slipFile.name}
                        </p>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleDeposit}
                      disabled={!depositAmount || !slipFile || depositMutation.isPending}
                      data-testid="button-submit-deposit"
                    >
                      {depositMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {language === "th" ? "ยืนยันการฝากเงิน" : "Submit Deposit"}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Crypto Deposit Section */}
            {depositMethod === "crypto" && (
              <>
                {/* Crypto Selection */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {cryptoWallets.map((crypto) => (
                    <Card
                      key={crypto.id}
                      className={`cursor-pointer transition-all hover:scale-[1.02] ${
                        selectedCrypto === crypto.id
                          ? "ring-2 ring-primary border-primary"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedCrypto(crypto.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 ${crypto.color} rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xl font-bold`}>
                          {crypto.icon}
                        </div>
                        <p className="font-bold">{crypto.name}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {crypto.network}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Selected Crypto Details */}
                {selectedCryptoData && (
                  <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div className={`w-8 h-8 ${selectedCryptoData.color} rounded-full flex items-center justify-center text-white font-bold`}>
                            {selectedCryptoData.icon}
                          </div>
                          {selectedCryptoData.name} ({selectedCryptoData.network})
                        </CardTitle>
                        <Badge variant="outline">{selectedCryptoData.networkFull}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* QR Code */}
                      <div className="flex justify-center p-4 bg-white rounded-lg">
                        <QRCodeSVG 
                          value={selectedCryptoData.address}
                          size={180}
                          level="H"
                          includeMargin
                        />
                      </div>

                      {/* Address */}
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">
                          {language === "th" ? "ที่อยู่กระเป๋า" : "Wallet Address"}
                        </Label>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <code className="flex-1 text-xs md:text-sm font-mono break-all">
                            {selectedCryptoData.address}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => copyToClipboard(selectedCryptoData.address, selectedCryptoData.id)}
                          >
                            {copied === selectedCryptoData.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Warning */}
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          ⚠️ {language === "th" 
                            ? `ส่งเฉพาะ ${selectedCryptoData.name} บนเครือข่าย ${selectedCryptoData.network} เท่านั้น! ฝากขั้นต่ำ ${selectedCryptoData.minDeposit} ${selectedCryptoData.name}`
                            : `Only send ${selectedCryptoData.name} on ${selectedCryptoData.network} network! Min deposit: ${selectedCryptoData.minDeposit} ${selectedCryptoData.name}`
                          }
                        </p>
                      </div>

                      {/* Confirm Section */}
                      <div className="space-y-3 pt-2 border-t border-border">
                        <div className="space-y-2">
                          <Label>{language === "th" ? "TxHash / หลักฐานการโอน" : "TxHash / Transfer Proof"}</Label>
                          <Input
                            placeholder={language === "th" ? "วาง TxHash หรืออัพโหลดสลิป" : "Paste TxHash or upload slip"}
                            className="font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === "th" ? "หรืออัพโหลดสลิป" : "Or upload screenshot"}</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                          />
                          {slipFile && (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              {slipFile.name}
                            </p>
                          )}
                        </div>
                        <Button className="w-full" disabled={depositMutation.isPending}>
                          {depositMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          {language === "th" ? "ยืนยันการฝาก Crypto" : "Confirm Crypto Deposit"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!selectedCrypto && (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>
                        {language === "th" 
                          ? "เลือกสกุลเงินคริปโตด้านบนเพื่อดูที่อยู่กระเป๋า"
                          : "Select a cryptocurrency above to view wallet address"
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {language === "th" ? "ถอนเงิน" : "Withdraw Money"}
                </CardTitle>
                <CardDescription>
                  {language === "th" 
                    ? `ยอดที่ถอนได้: ${balance.toLocaleString()} บาท`
                    : `Available: ${balance.toLocaleString()} THB`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === "th" ? "จำนวนเงินที่ถอน" : "Withdrawal Amount"}</Label>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0"
                    className="text-lg font-bold"
                    max={balance}
                    data-testid="input-withdraw-amount"
                  />
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((amt) => (
                      <Button
                        key={amt}
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(Math.min(amt, balance).toString())}
                        disabled={amt > balance}
                      >
                        {amt.toLocaleString()}
                      </Button>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setWithdrawAmount(balance.toString())}
                    >
                      {language === "th" ? "ถอนทั้งหมด" : "Max"}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "th" ? "เลขบัญชีรับเงิน" : "Bank Account"}</Label>
                  <Input
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    placeholder={language === "th" ? "กรอกเลขบัญชี" : "Enter account number"}
                    className="font-mono"
                    data-testid="input-withdraw-account"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || !withdrawAccount || parseInt(withdrawAmount) > balance || withdrawMutation.isPending}
                  data-testid="button-submit-withdraw"
                >
                  {withdrawMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                  )}
                  {language === "th" ? "ยืนยันการถอน" : "Submit Withdrawal"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
