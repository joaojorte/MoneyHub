import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight rounded-full transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold shadow-[0_0_24px_rgba(16,185,129,0.45)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] border border-emerald-300/30',
    expense: 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-extrabold shadow-[0_0_24px_rgba(244,63,94,0.45)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] border border-rose-300/30',
    brand: 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-extrabold shadow-[0_0_24px_rgba(245,158,11,0.45)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] border border-amber-200/40',
    secondary: 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] hover:border-white/[0.16] backdrop-blur-md',
    ghost: 'bg-transparent hover:bg-white/[0.06] text-slate-400 hover:text-white border border-transparent hover:border-white/[0.08]',
    link: 'bg-transparent text-slate-400 hover:text-white underline underline-offset-2 p-0'
  };

  const sizes = {
    sm: 'px-3.5 py-1 text-xs',
    md: 'px-4.5 py-2 text-xs',
    lg: 'px-6 py-2.5 text-sm'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
