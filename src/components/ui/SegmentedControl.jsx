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
    default: 'bg-white/[0.10] text-white border-white/20 shadow-[0_0_14px_rgba(255,255,255,0.15)]',
    income: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-[0_0_18px_rgba(16,185,129,0.3)]',
    expense: 'bg-rose-500/20 text-rose-300 border-rose-400/40 shadow-[0_0_18px_rgba(244,63,94,0.3)]',
    brand: 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_18px_rgba(245,158,11,0.3)]'
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase select-none">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1 p-1 bg-[#04070F]/70 backdrop-blur-md rounded-full border border-white/[0.08] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex-1 py-1.5 px-3.5 text-xs font-semibold rounded-full transition-all duration-200 
                flex items-center justify-center gap-1.5 select-none border
                ${isSelected 
                  ? `${accentStyles[accent] || accentStyles.default} font-bold`
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}`}
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
