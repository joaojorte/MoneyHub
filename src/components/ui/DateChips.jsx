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
    income: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-glow-income',
    expense: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-glow-expense',
    brand: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  };

  const currentActive = activeStyles[accent] || activeStyles.expense;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex p-1 bg-surface-inset rounded-full border border-border-subtle gap-1">
        <button
          type="button"
          onClick={() => onSelectOpcao('hoje')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 border border-transparent ${
            opcao === 'hoje' ? currentActive : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Hoje
        </button>
        <button
          type="button"
          onClick={() => onSelectOpcao('ontem')}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 border border-transparent ${
            opcao === 'ontem' ? currentActive : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ontem
        </button>
        <button
          type="button"
          onClick={() => onSelectOpcao('outro')}
          className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all duration-200 border border-transparent ${
            opcao === 'outro' ? currentActive : 'text-slate-400 hover:text-slate-200'
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
          className="glass-input px-3 py-1 text-xs color-scheme-dark h-8"
          autoFocus
        />
      )}
    </div>
  );
}
