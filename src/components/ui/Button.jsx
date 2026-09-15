import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center tracking-tight rounded-full transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 dark:font-extrabold dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-600 dark:border-emerald-300/30',
    expense: 'bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm dark:bg-rose-500 dark:hover:bg-rose-400 dark:text-white dark:font-extrabold dark:shadow-[0_0_20px_rgba(244,63,94,0.35)] border border-rose-600 dark:border-rose-300/30',
    brand: 'bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-slate-950 dark:font-extrabold dark:shadow-[0_0_20px_rgba(245,158,11,0.35)] border border-amber-500 dark:border-amber-200/40',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-slate-200 dark:border-white/[0.08] backdrop-blur-md',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent dark:hover:bg-white/[0.06] dark:text-slate-400 dark:hover:text-white',
    link: 'bg-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline underline-offset-2 p-0'
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
