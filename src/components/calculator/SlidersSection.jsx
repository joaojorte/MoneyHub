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
    <div className="glass-panel p-4 sm:p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <h2 className="text-sm font-semibold tracking-wide text-brand-cyan flex items-center gap-2">
          <span>⚙</span> Planejamento & Alocação
        </h2>
      </div>

      <div className="space-y-4">
        {/* Slider: Investimentos */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Investimentos:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-400 font-bold tabular-nums">
                R$ {formatarBRL(investimentoRecomendado)}
              </span>
              <span className="font-mono text-slate-400 bg-surface-inset px-2 py-0.5 rounded-full border border-border-subtle">
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
            className="w-full accent-emerald-400 bg-surface-inset rounded-lg h-2 cursor-pointer"
          />
        </div>

        {/* Slider: Reserva de Emergência */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Reserva de Emergência:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-brand-cyan font-bold tabular-nums">
                R$ {formatarBRL(reservaRecomendada)}
              </span>
              <span className="font-mono text-slate-400 bg-surface-inset px-2 py-0.5 rounded-full border border-border-subtle">
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
            className="w-full accent-sky-400 bg-surface-inset rounded-lg h-2 cursor-pointer"
          />
        </div>

        {/* Aporte Extra Opcional */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Aporte Extra / Injeção de Capital (R$):
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="R$ 0,00"
            value={aporteExtra}
            onChange={(e) => onAporteExtraChange(e.target.value)}
            className="glass-input w-full px-3.5 py-2 text-sm font-mono font-bold tabular-nums"
          />
        </div>
      </div>
    </div>
  );
}
