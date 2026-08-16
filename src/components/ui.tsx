"use client";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white/5 border border-white/10 backdrop-blur rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 text-emerald-950 font-bold shadow hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-100 font-semibold hover:bg-white/10 transition disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function OptionButton({
  selected,
  correct,
  showResult,
  onClick,
  children,
  disabled,
}: {
  selected: boolean;
  correct?: boolean;
  showResult?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  let cls = "border-white/10 bg-white/5 hover:bg-white/10";
  if (selected && !showResult) cls = "border-amber-300 bg-amber-300/20";
  if (showResult) {
    if (correct) cls = "border-emerald-400 bg-emerald-500/20 text-emerald-100";
    else if (selected) cls = "border-rose-400 bg-rose-500/20 text-rose-100";
    else cls = "border-white/5 bg-white/5 text-white/40";
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-3 rounded-xl border transition font-medium ${cls}`}
    >
      {children}
    </button>
  );
}

export function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    default: "bg-white/10 text-white/80 border-white/10",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/20",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${tones[tone] || tones.default}`}>
      {children}
    </span>
  );
}
