import { Crown } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl"
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-amber-400 to-primary rounded-lg blur-sm opacity-50" />
        <div className="relative bg-gradient-to-br from-primary via-amber-400 to-primary p-1.5 rounded-lg">
          <Crown className={`${sizeClasses[size]} text-primary-foreground`} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span 
            className={`${textClasses[size]} font-extrabold tracking-tight`}
            style={{ fontFamily: "'Urbanist', sans-serif" }}
          >
            <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
              QNQ
            </span>
          </span>
          <span className="text-[10px] text-muted-foreground -mt-1 tracking-widest uppercase">
            Lottery
          </span>
        </div>
      )}
    </div>
  );
}
