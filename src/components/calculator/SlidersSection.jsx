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
    <div className="glass-panel p-4 sm:p-5 space-y-5 border-sky-500/20 shadow-[inset_0_1px_0_0_rgba(56,189,248,0.15),0_16px_36px_-6px_rgba(0,0,0,0.55)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <h2 className="text-sm font-semibold tracking-wide text-sky-400 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]">
          <span className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-xs font-bold leading-none">⚙</span>
          <span>Planejamento & Alocação</span>
        </h2>
      </div>

      <div className="space-y-4">
        {/* Slider: Investimentos */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Investimentos:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-400 font-bold tabular-nums tracking-tight drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]">
                R$ {formatarBRL(investimentoRecomendado)}
              </span>
              <span className="font-mono text-xs font-bold text-slate-300 bg-white/[0.05] px-2.5 py-0.5 rounded-full border border-white/[0.08] tabular-nums">
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
            className="w-full accent-emerald-400 bg-[#04070F]/70 rounded-full h-2 cursor-pointer border border-white/[0.06]"
          />
        </div>

        {/* Slider: Reserva de Emergência */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Reserva de Emergência:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sky-400 font-bold tabular-nums tracking-tight drop-shadow-[0_0_10px_rgba(56,189,248,0.35)]">
                R$ {formatarBRL(reservaRecomendada)}
              </span>
              <span className="font-mono text-xs font-bold text-slate-300 bg-white/[0.05] px-2.5 py-0.5 rounded-full border border-white/[0.08] tabular-nums">
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
            className="w-full accent-sky-400 bg-[#04070F]/70 rounded-full h-2 cursor-pointer border border-white/[0.06]"
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
            className="glass-input w-full px-3.5 py-2 text-sm font-mono font-bold tabular-nums tracking-tight text-amber-300 placeholder:text-slate-600"
          />
        </div>
      </div>
    </div>
  );
}
