import React from 'react';
import { formatarBRL } from '../../utils/formatters';

export function SlidersSection({
  percentualInvestimento,
  onInvestimentoChange,
  percentualReserva,
  onReservaChange,
  aporteExtra,
  onAporteExtraChange,
  investimentoRecomendado,
  reservaRecomendada
}) {
  return (
    <div className="glass-panel p-4 sm:p-5 space-y-5 border-sky-200 dark:border-sky-500/20 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(56,189,248,0.15),0_16px_36px_-6px_rgba(0,0,0,0.55)]">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
        <h2 className="text-sm font-semibold tracking-wide text-sky-700 dark:text-sky-400 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-500/20 border border-sky-300 dark:border-sky-400/40 flex items-center justify-center text-xs font-bold leading-none text-sky-700 dark:text-sky-300">⚙</span>
          <span>Planejamento & Alocação</span>
        </h2>
      </div>

      <div className="space-y-4">
        {/* Slider: Investimentos */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-700 dark:text-slate-300 font-medium">Investimentos:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold tabular-nums tracking-tight">
                R$ {formatarBRL(investimentoRecomendado)}
              </span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.05] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/[0.08] tabular-nums">
                {percentualInvestimento}%
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={percentualInvestimento}
            onChange={(e) => onInvestimentoChange(parseInt(e.target.value, 10) || 0)}
            className="w-full accent-emerald-600 dark:accent-emerald-400 bg-slate-200 dark:bg-[#04070F]/70 rounded-full h-2 cursor-pointer border border-slate-200 dark:border-white/[0.06]"
          />
        </div>

        {/* Slider: Reserva de Emergência */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-700 dark:text-slate-300 font-medium">Reserva de Emergência:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sky-700 dark:text-sky-400 font-bold tabular-nums tracking-tight">
                R$ {formatarBRL(reservaRecomendada)}
              </span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.05] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/[0.08] tabular-nums">
                {percentualReserva}%
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={percentualReserva}
            onChange={(e) => onReservaChange(parseInt(e.target.value, 10) || 0)}
            className="w-full accent-sky-600 dark:accent-sky-400 bg-slate-200 dark:bg-[#04070F]/70 rounded-full h-2 cursor-pointer border border-slate-200 dark:border-white/[0.06]"
          />
        </div>

        {/* Aporte Extra Opcional */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Aporte Extra / Injeção de Capital (R$):
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="R$ 0,00"
            value={aporteExtra}
            onChange={(e) => onAporteExtraChange(e.target.value)}
            className="glass-input w-full px-3.5 py-2 text-sm font-mono font-bold tabular-nums tracking-tight text-amber-700 dark:text-amber-300 placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
      </div>
    </div>
  );
}
