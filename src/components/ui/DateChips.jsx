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
    income: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-[0_0_18px_rgba(16,185,129,0.3)] font-bold',
    expense: 'bg-rose-500/20 text-rose-300 border-rose-400/40 shadow-[0_0_18px_rgba(244,63,94,0.3)] font-bold',
    brand: 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_18px_rgba(245,158,11,0.3)] font-bold'
  };

  const currentActive = activeStyles[accent] || activeStyles.expense;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex p-1 bg-[#04070F]/70 backdrop-blur-md rounded-full border border-white/[0.08] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] gap-1">
        <button
          type="button"
          onClick={() => onSelectOpcao('hoje')}
          className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 border select-none ${
            opcao === 'hoje' ? currentActive : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          Hoje
        </button>
        <button
          type="button"
          onClick={() => onSelectOpcao('ontem')}
          className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 border select-none ${
            opcao === 'ontem' ? currentActive : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          Ontem
        </button>
        <button
          type="button"
          onClick={() => onSelectOpcao('outro')}
          className={`px-3.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all duration-200 border select-none ${
            opcao === 'outro' ? currentActive : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
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
          className="bg-[#04070F]/80 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-1 text-xs font-mono font-bold text-white shadow-[0_0_12px_rgba(255,255,255,0.08)] focus:outline-none focus:border-white/40 h-8"
          autoFocus
        />
      )}
    </div>
  );
}
