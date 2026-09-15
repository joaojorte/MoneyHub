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
    income: 'border-emerald-200 bg-gradient-to-b from-emerald-50/80 via-white to-white shadow-sm dark:border-emerald-500/25 dark:bg-gradient-to-b dark:from-emerald-500/[0.08] dark:via-[#0C1326]/70 dark:to-[#0C1326]/60 dark:shadow-[inset_0_1px_0_0_rgba(52,211,153,0.2),0_16px_36px_-6px_rgba(0,0,0,0.6)]',
    expense: 'border-rose-200 bg-gradient-to-b from-rose-50/80 via-white to-white shadow-sm dark:border-rose-500/25 dark:bg-gradient-to-b dark:from-rose-500/[0.08] dark:via-[#0C1326]/70 dark:to-[#0C1326]/60 dark:shadow-[inset_0_1px_0_0_rgba(251,113,133,0.2),0_16px_36px_-6px_rgba(0,0,0,0.6)]',
    brand: 'border-amber-200 bg-gradient-to-b from-amber-50/80 via-white to-white shadow-sm dark:border-amber-500/25 dark:bg-gradient-to-b dark:from-amber-500/[0.08] dark:via-[#0C1326]/70 dark:to-[#0C1326]/60 dark:shadow-[inset_0_1px_0_0_rgba(251,191,36,0.2),0_16px_36px_-6px_rgba(0,0,0,0.6)]',
    default: 'border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0C1326]/60 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-6px_rgba(0,0,0,0.6)]'
  };

  const textAccentStyles = {
    income: 'text-emerald-700 dark:text-emerald-400',
    expense: 'text-rose-700 dark:text-rose-400',
    brand: 'text-amber-700 dark:text-amber-400',
    default: 'text-slate-900 dark:text-white'
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl backdrop-blur-2xl border flex flex-col justify-between transition-all duration-300 group hover:-translate-y-0.5 ${accentCardStyles[accent] || accentCardStyles.default} ${className}`}>
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
          {title}
        </span>
        {icon && (
          <span className="text-base leading-none p-1.5 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
            {icon}
          </span>
        )}
      </div>
      <div className={`text-xl sm:text-2xl lg:text-3xl font-mono font-bold tabular-nums tracking-tight ${textAccentStyles[accent] || textAccentStyles.default}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1.5">
          {subtitle}
        </div>
      )}
    </div>
  );
}
