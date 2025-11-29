import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n";
import { useBlockedNumbers } from "@/lib/store";
import type { LotteryType } from "@shared/schema";
import { betTypeNames } from "@shared/schema";
import { Ban } from "lucide-react";

interface BlockedNumbersDisplayProps {
  lotteryType: LotteryType | null;
}

export function BlockedNumbersDisplay({ lotteryType }: BlockedNumbersDisplayProps) {
  const { language, t } = useI18n();
  const { blockedNumbers } = useBlockedNumbers();

  const filteredNumbers = lotteryType
    ? blockedNumbers.filter((bn) => bn.lotteryType === lotteryType && bn.isActive)
    : [];

  if (filteredNumbers.length === 0) {
    return null;
  }

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-destructive">
          <Ban className="h-4 w-4" />
          {t("home.blockedNumbers")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-24">
          <div className="flex flex-wrap gap-1.5">
            {filteredNumbers.map((bn) => (
              <Badge
                key={bn.id}
                variant="destructive"
                className="text-xs font-mono"
              >
                {bn.number}
                {bn.betType && (
                  <span className="ml-1 opacity-70">
                    ({betTypeNames[bn.betType][language]})
                  </span>
                )}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
