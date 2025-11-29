import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === "th" ? "en" : "th");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="relative"
      data-testid="button-language-toggle"
    >
      <Languages className="h-[1.2rem] w-[1.2rem]" />
      <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-primary text-primary-foreground rounded px-1">
        {language.toUpperCase()}
      </span>
    </Button>
  );
}
