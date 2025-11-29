import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, ArrowRight, Gift } from "lucide-react";

export default function Register() {
  const { language, t } = useI18n();
  const { setUser } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref);
    }
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: language === "th" ? "รหัสผ่านไม่ตรงกัน" : "Passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: language === "th" ? "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" : "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    setUser({
      id: Date.now().toString(),
      username,
      password: "",
      balance: 0,
      referralCode: `QNQ${Date.now().toString(36).toUpperCase()}`,
      referredBy: referralCode || null,
      affiliateEarnings: 0,
      createdAt: new Date().toISOString()
    });

    toast({
      title: language === "th" ? "สมัครสมาชิกสำเร็จ" : "Registration successful",
      description: language === "th" ? "ยินดีต้อนรับสู่ QNQ Lottery!" : "Welcome to QNQ Lottery!"
    });

    setLocation("/");
    setIsLoading(false);
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t("nav.register")}</CardTitle>
            <CardDescription>
              {language === "th" 
                ? "สร้างบัญชีใหม่เพื่อเริ่มแทงหวย" 
                : "Create a new account to start betting"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{language === "th" ? "ชื่อผู้ใช้" : "Username"}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={language === "th" ? "กรอกชื่อผู้ใช้" : "Enter username"}
                  className="pl-10"
                  required
                  minLength={3}
                  data-testid="input-reg-username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{language === "th" ? "รหัสผ่าน" : "Password"}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  minLength={6}
                  data-testid="input-reg-password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {language === "th" ? "ยืนยันรหัสผ่าน" : "Confirm Password"}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  data-testid="input-reg-confirm-password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral">
                {language === "th" ? "รหัสแนะนำ (ถ้ามี)" : "Referral Code (optional)"}
              </Label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="referral"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="QNQ12345"
                  className="pl-10 font-mono"
                  data-testid="input-referral-code"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isLoading}
              data-testid="button-register"
            >
              {isLoading ? (language === "th" ? "กำลังสมัคร..." : "Registering...") : t("nav.register")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            {language === "th" ? "มีบัญชีอยู่แล้ว?" : "Already have an account?"}
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login" data-testid="link-login">
              {t("nav.login")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
