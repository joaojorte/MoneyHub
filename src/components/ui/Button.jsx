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
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-glow-income',
    expense: 'bg-rose-500 hover:bg-rose-600 text-white shadow-glow-expense',
    brand: 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-sm',
    secondary: 'bg-surface-active hover:bg-white/[0.12] text-slate-200 border border-border-subtle',
    ghost: 'bg-transparent hover:bg-white/[0.06] text-slate-400 hover:text-white',
    link: 'bg-transparent text-slate-400 hover:text-white underline underline-offset-2 p-0'
  };

  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-xs',
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
