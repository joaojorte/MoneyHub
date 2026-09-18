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
    default: 'bg-white text-slate-900 border-slate-300 shadow-sm dark:bg-white/[0.10] dark:text-white dark:border-white/20',
    income: 'bg-white text-emerald-700 border-emerald-300 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40',
    expense: 'bg-white text-rose-700 border-rose-300 shadow-sm dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-400/40',
    brand: 'bg-white text-amber-700 border-amber-300 shadow-sm dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40'
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase select-none">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-[#04070F]/70 backdrop-blur-md rounded-full border border-slate-200 dark:border-white/[0.08]">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex-1 py-2 px-4 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 
                flex items-center justify-center gap-1.5 select-none border
                ${isSelected 
                  ? `${accentStyles[accent] || accentStyles.default} font-bold`
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/[0.04]'}`}
            >
              {opt.icon && <span className="text-sm sm:text-base leading-none">{opt.icon}</span>}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
