import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, ArrowRight } from "lucide-react";

export default function Login() {
  const { language, t } = useI18n();
  const { setUser } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (username && password.length >= 4) {
      setUser({
        id: Date.now().toString(),
        username,
        password: "",
        balance: 10000,
        referralCode: `QNQ${Date.now().toString(36).toUpperCase()}`,
        referredBy: null,
        affiliateEarnings: 0,
        createdAt: new Date().toISOString()
      });
      toast({
        title: language === "th" ? "เข้าสู่ระบบสำเร็จ" : "Login successful"
      });
      setLocation("/");
    } else {
      toast({
        title: language === "th" ? "ข้อมูลไม่ถูกต้อง" : "Invalid credentials",
        variant: "destructive"
      });
    }

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
            <CardTitle className="text-2xl">{t("nav.login")}</CardTitle>
            <CardDescription>
              {language === "th" 
                ? "เข้าสู่ระบบเพื่อเริ่มแทงหวย" 
                : "Login to start betting"}
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
                  data-testid="input-username"
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
                  data-testid="input-password"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (language === "th" ? "กำลังเข้าสู่ระบบ..." : "Logging in...") : t("nav.login")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            {language === "th" ? "ยังไม่มีบัญชี?" : "Don't have an account?"}
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/register" data-testid="link-register">
              {t("nav.register")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
