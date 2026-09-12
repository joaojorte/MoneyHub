import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'default',
  className = ''
}) {
  const accentCardStyles = {
    income: 'border-emerald-500/25 hover:border-emerald-400/40 bg-gradient-to-b from-emerald-500/[0.08] via-[#0C1326]/70 to-[#0C1326]/60 shadow-[inset_0_1px_0_0_rgba(52,211,153,0.2),0_16px_36px_-6px_rgba(0,0,0,0.6)]',
    expense: 'border-rose-500/25 hover:border-rose-400/40 bg-gradient-to-b from-rose-500/[0.08] via-[#0C1326]/70 to-[#0C1326]/60 shadow-[inset_0_1px_0_0_rgba(251,113,133,0.2),0_16px_36px_-6px_rgba(0,0,0,0.6)]',
    brand: 'border-amber-500/25 hover:border-amber-400/40 bg-gradient-to-b from-amber-500/[0.08] via-[#0C1326]/70 to-[#0C1326]/60 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.2),0_16px_36px_-6px_rgba(0,0,0,0.6)]',
    default: 'border-white/[0.08] hover:border-white/[0.16] bg-[#0C1326]/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-6px_rgba(0,0,0,0.6)]'
  };

  const textAccentStyles = {
    income: 'text-emerald-400 drop-shadow-[0_0_14px_rgba(16,185,129,0.45)]',
    expense: 'text-rose-400 drop-shadow-[0_0_14px_rgba(244,63,94,0.45)]',
    brand: 'text-amber-400 drop-shadow-[0_0_14px_rgba(245,158,11,0.45)]',
    default: 'text-white'
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl backdrop-blur-2xl border flex flex-col justify-between transition-all duration-300 group hover:-translate-y-0.5 ${accentCardStyles[accent] || accentCardStyles.default} ${className}`}>
      <div className="flex items-center justify-between text-slate-400 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
          {title}
        </span>
        {icon && (
          <span className="text-base leading-none p-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
            {icon}
          </span>
        )}
      </div>
      <div className={`text-xl sm:text-2xl lg:text-3xl font-mono font-bold tabular-nums tracking-tight ${textAccentStyles[accent] || textAccentStyles.default}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px] text-slate-400/80 font-medium mt-1.5">
          {subtitle}
        </div>
      )}
    </div>
  );
}
