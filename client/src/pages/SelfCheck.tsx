import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function SelfCheck() {
  const { language } = useI18n();

  const handleOpenGLO = () => {
    window.open(
      "https://www.glo.or.th/mission/reward-payment/check-reward",
      "_blank"
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background p-6">
      <Card className="max-w-xl w-full shadow-2xl rounded-2xl">
        <CardContent className="p-10 text-center space-y-6">

          <div className="flex justify-center">
            <Trophy className="h-16 w-16 text-yellow-500 animate-bounce" />
          </div>

          <h1 className="text-3xl font-bold">
            {language === "th"
              ? "ตรวจรางวัลสลากกินแบ่งรัฐบาล"
              : "Check Government Lottery Results"}
          </h1>

          <p className="text-muted-foreground">
            {language === "th"
              ? "คลิกปุ่มด้านล่างเพื่อไปยังหน้าตรวจผลอย่างเป็นทางการ"
              : "Click the button below to visit the official lottery result checker"}
          </p>

          <Button
            onClick={handleOpenGLO}
            size="lg"
            className="w-full text-lg py-6 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold transition-all duration-300"
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            {language === "th"
              ? "ไปยังเว็บไซต์ GLO"
              : "Go to Official GLO Website"}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}