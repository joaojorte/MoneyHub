import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'default',
  className = ''
}) {
  const accentGlow = {
    income: 'border-emerald-500/20 hover:border-emerald-500/40',
    expense: 'border-rose-500/20 hover:border-rose-500/40',
    brand: 'border-amber-500/20 hover:border-amber-500/40',
    default: 'border-border-subtle hover:border-border-hover'
  };

  const textAccent = {
    income: 'text-emerald-400',
    expense: 'text-rose-400',
    brand: 'text-amber-400',
    default: 'text-white'
  };

  return (
    <div className={`glass-panel p-4 flex flex-col justify-between transition-all duration-200 ${accentGlow[accent] || accentGlow.default} ${className}`}>
      <div className="flex items-center justify-between text-slate-400 mb-1">
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
        {icon && <span className="text-base leading-none">{icon}</span>}
      </div>
      <div className={`text-xl sm:text-2xl font-mono font-bold tabular-nums tracking-tight ${textAccent[accent] || textAccent.default}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px] text-slate-500 font-medium mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
}
