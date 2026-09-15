import React from 'react';
import { Calendar } from 'lucide-react';

export function DateChips({
  opcao,
  onSelectOpcao,
  dataManual,
  onDataManualChange,
  accent = 'expense'
}) {
  const activeStyles = {
    income: 'bg-emerald-600 text-white shadow-sm border-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40 font-bold',
    expense: 'bg-rose-600 text-white shadow-sm border-rose-600 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-400/40 font-bold',
    brand: 'bg-amber-600 text-white shadow-sm border-amber-600 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40 font-bold'
  };

  const currentActive = activeStyles[accent] || activeStyles.expense;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex p-1 bg-slate-100 dark:bg-[#04070F]/70 backdrop-blur-md rounded-full border border-slate-200 dark:border-white/[0.08] shadow-inner gap-1">
        <button
          type="button"
          onClick={() => onSelectOpcao('hoje')}
          className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 border select-none ${
            opcao === 'hoje' ? currentActive : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
          }`}
        >
          Hoje
        </button>
        <button
          type="button"
          onClick={() => onSelectOpcao('ontem')}
          className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 border select-none ${
            opcao === 'ontem' ? currentActive : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
          }`}
        >
          Ontem
        </button>
        <button
          type="button"
          onClick={() => onSelectOpcao('outro')}
          className={`px-3.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all duration-200 border select-none ${
            opcao === 'outro' ? currentActive : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Outra Data</span>
        </button>
      </div>

      {opcao === 'outro' && (
        <input
          type="date"
          value={dataManual}
          onChange={(e) => onDataManualChange(e.target.value)}
          className="bg-white dark:bg-[#04070F]/80 backdrop-blur-md border border-slate-300 dark:border-white/20 rounded-full px-3.5 py-1 text-xs font-mono font-bold text-slate-800 dark:text-white shadow-sm focus:outline-none focus:border-slate-500 dark:focus:border-white/40 h-8"
          autoFocus
        />
      )}
    </div>
  );
}
