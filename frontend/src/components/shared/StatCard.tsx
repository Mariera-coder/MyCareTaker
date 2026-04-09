import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  backgroundColor = "bg-sky-700",
  textColor = "text-white",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "min-h-[120px] rounded-xl p-5 shadow-sm",
        backgroundColor,
        textColor,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{title}</p>
      <p className="mt-3 text-[30px] font-bold leading-none">{value}</p>
      {subtitle ? <p className="mt-3 text-xs opacity-85">{subtitle}</p> : null}
    </div>
  );
}
