import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}

export function BrandLogo({ className, markClassName, textClassName }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#101820] text-white shadow-sm",
          markClassName,
        )}
        aria-hidden="true"
      >
        <Home className="h-5 w-5" strokeWidth={2.2} />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f2b84b]" />
      </span>
      <span className={cn("font-bold tracking-[0.08em] text-[#101820]", textClassName)}>INKAHOME</span>
    </span>
  );
}
