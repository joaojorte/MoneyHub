import React from 'react';

export function SegmentedControl({
  options = [],
  value,
  onChange,
  label,
  accent = 'default',
  className = ''
}) {
  const accentStyles = {
    default: 'bg-slate-800 text-white shadow-sm border border-white/10',
    income: 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-glow-income',
    expense: 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-glow-expense',
    brand: 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase select-none">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1 p-1 bg-surface-inset rounded-full border border-border-subtle">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-full transition-all duration-200 
                flex items-center justify-center gap-1.5 select-none
                ${isSelected 
                  ? (accentStyles[accent] || accentStyles.default)
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'}`}
            >
              {opt.icon && <span className="text-sm leading-none">{opt.icon}</span>}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
