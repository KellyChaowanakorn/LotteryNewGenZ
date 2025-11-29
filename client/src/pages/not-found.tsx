import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  const { language } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <div className="space-y-2">
            <p className="text-7xl font-bold text-primary">404</p>
            <CardTitle className="text-2xl">
              {language === "th" ? "ไม่พบหน้านี้" : "Page Not Found"}
            </CardTitle>
            <CardDescription>
              {language === "th" 
                ? "หน้าที่คุณค้นหาไม่มีอยู่ หรือถูกย้ายไปแล้ว" 
                : "The page you're looking for doesn't exist or has been moved"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full gap-2" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              {language === "th" ? "กลับหน้าหลัก" : "Go Home"}
            </Link>
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            {language === "th" ? "ย้อนกลับ" : "Go Back"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
