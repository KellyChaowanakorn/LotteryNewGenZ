import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAdmin } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Lock, User } from "lucide-react";

export default function AdminLogin() {
  const { language, t } = useI18n();
  const { setAdminAuthenticated } = useAdmin();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/admin/login", { username, password });
      const data = await response.json();
      
      if (data.success) {
        setAdminAuthenticated(true);
        toast({
          title: language === "th" ? "เข้าสู่ระบบสำเร็จ" : "Login successful"
        });
        setLocation("/admin");
      } else {
        toast({
          title: language === "th" ? "ข้อมูลไม่ถูกต้อง" : "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: language === "th" ? "ข้อมูลไม่ถูกต้อง" : "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("admin.login")}</CardTitle>
          <CardDescription>
            {language === "th" 
              ? "เข้าสู่ระบบด้วยบัญชี Admin" 
              : "Login with your Admin account"}
          </CardDescription>
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
                  placeholder="admin"
                  className="pl-10"
                  required
                  data-testid="input-admin-username"
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
                  data-testid="input-admin-password"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-admin-login"
            >
              {isLoading ? (language === "th" ? "กำลังเข้าสู่ระบบ..." : "Logging in...") : t("nav.login")}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1">{language === "th" ? "สำหรับทดสอบ:" : "For testing:"}</p>
            <p>Username: admin</p>
            <p>Password: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
