import React from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 shadow-sm hover:shadow transition-all duration-200 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/20"
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 group-hover:-rotate-12" />
      )}
    </button>
  );
}
