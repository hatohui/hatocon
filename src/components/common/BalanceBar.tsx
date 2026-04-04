import React from "react";

interface BalanceBarProps {
  label: string;
  used: number;
  total: number;
  colorClass: string;
}

const BalanceBar = ({
  label,
  used,
  total,
  colorClass,
}: BalanceBarProps): React.ReactElement => {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const remaining = Math.max(total - used, 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {remaining.toFixed(1)}
          <span className="text-muted-foreground font-normal">
            /{total} days left
          </span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default BalanceBar;
