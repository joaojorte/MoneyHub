import React from 'react';
import { formatarBRL } from '../../utils/formatters';

export function DistributionBar({
  investimentoRecomendado,
  reservaRecomendada,
  livreRecomendado,
  baseCalculo
}) {
  const total = Math.max(1, baseCalculo);
  const pctInvest = Math.round((investimentoRecomendado / total) * 100);
  const pctReserva = Math.round((reservaRecomendada / total) * 100);
  const pctLivre = Math.max(0, 100 - pctInvest - pctReserva);

  return (
    <div className="glass-panel p-4 sm:p-5 space-y-4 border-amber-500/20 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.15),0_16px_36px_-6px_rgba(0,0,0,0.55)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <h2 className="text-sm font-semibold tracking-wide text-amber-400 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">
          <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xs font-bold leading-none">%</span>
          <span>Distribuição do Saldo</span>
        </h2>
        <span className="text-xs font-mono font-bold text-amber-300/90 tabular-nums tracking-tight bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.08]">
          Total: R$ {formatarBRL(baseCalculo)}
        </span>
      </div>

      {/* Barra colorida arredondada contínua com efeito neon */}
      <div className="w-full h-3.5 bg-[#04070F]/80 backdrop-blur-md rounded-full overflow-hidden flex p-0.5 border border-white/[0.08] gap-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
        <div
          style={{ width: `${pctInvest}%` }}
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          title={`Investimentos: ${pctInvest}%`}
        />
        <div
          style={{ width: `${pctReserva}%` }}
          className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
          title={`Reserva: ${pctReserva}%`}
        />
        <div
          style={{ width: `${pctLivre}%` }}
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
          title={`Livre / Gastos: ${pctLivre}%`}
        />
      </div>

      {/* Legenda com valores tabulares e superfícies translúcidas */}
      <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
        <div className="p-2.5 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-md rounded-xl border border-emerald-500/20 shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
          <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Investimento</div>
          <div className="font-mono text-xs sm:text-sm font-bold text-emerald-300 tabular-nums tracking-tight mt-0.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
            R$ {formatarBRL(investimentoRecomendado)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono font-semibold mt-0.5">{pctInvest}%</div>
        </div>

        <div className="p-2.5 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-md rounded-xl border border-sky-500/20 shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
          <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Reserva</div>
          <div className="font-mono text-xs sm:text-sm font-bold text-sky-300 tabular-nums tracking-tight mt-0.5 drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">
            R$ {formatarBRL(reservaRecomendada)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono font-semibold mt-0.5">{pctReserva}%</div>
        </div>

        <div className="p-2.5 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-md rounded-xl border border-amber-500/20 shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
          <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Livre</div>
          <div className="font-mono text-xs sm:text-sm font-bold text-amber-300 tabular-nums tracking-tight mt-0.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
            R$ {formatarBRL(livreRecomendado)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono font-semibold mt-0.5">{pctLivre}%</div>
        </div>
      </div>
    </div>
  );
}
