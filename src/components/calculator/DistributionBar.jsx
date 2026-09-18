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
    <div className="glass-panel p-4 sm:p-5 space-y-4 border-amber-200 dark:border-amber-500/20 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(251,191,36,0.15),0_16px_36px_-6px_rgba(0,0,0,0.55)]">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
        <h2 className="text-sm font-semibold tracking-wide text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-400/40 flex items-center justify-center text-xs font-bold leading-none text-amber-700 dark:text-amber-300">%</span>
          <span>Distribuição do Saldo</span>
        </h2>
        <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300/90 tabular-nums tracking-tight bg-amber-50 dark:bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-white/[0.08]">
          Total: R$ {formatarBRL(baseCalculo)}
        </span>
      </div>

      {/* Barra colorida arredondada contínua */}
      <div className="w-full h-3.5 bg-slate-200 dark:bg-[#04070F]/80 backdrop-blur-md rounded-full overflow-hidden flex p-0.5 border border-slate-300/80 dark:border-white/[0.08] gap-1 shadow-inner">
        <div
          style={{ width: `${pctInvest}%` }}
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-500 dark:to-teal-400 rounded-full transition-all duration-300 shadow-sm"
          title={`Investimentos: ${pctInvest}%`}
        />
        <div
          style={{ width: `${pctReserva}%` }}
          className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-500 dark:to-cyan-400 rounded-full transition-all duration-300 shadow-sm"
          title={`Reserva: ${pctReserva}%`}
        />
        <div
          style={{ width: `${pctLivre}%` }}
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-500 dark:to-yellow-400 rounded-full transition-all duration-300 shadow-sm"
          title={`Livre / Gastos: ${pctLivre}%`}
        />
      </div>

      {/* Legenda com valores tabulares */}
      <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
        <div className="p-2.5 bg-emerald-50/70 dark:bg-white/[0.03] backdrop-blur-md rounded-xl border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
          <div className="text-xs uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">Investimento</div>
          <div className="font-mono text-sm sm:text-base font-black text-emerald-800 dark:text-emerald-300 tabular-nums tracking-tight mt-0.5">
            R$ {formatarBRL(investimentoRecomendado)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold mt-0.5">{pctInvest}%</div>
        </div>

        <div className="p-2.5 bg-sky-50/70 dark:bg-white/[0.03] backdrop-blur-md rounded-xl border border-sky-200 dark:border-sky-500/20 shadow-sm">
          <div className="text-xs uppercase font-bold text-sky-700 dark:text-sky-400 tracking-wider">Reserva</div>
          <div className="font-mono text-sm sm:text-base font-black text-sky-800 dark:text-sky-300 tabular-nums tracking-tight mt-0.5">
            R$ {formatarBRL(reservaRecomendada)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold mt-0.5">{pctReserva}%</div>
        </div>

        <div className="p-2.5 bg-amber-50/70 dark:bg-white/[0.03] backdrop-blur-md rounded-xl border border-amber-200 dark:border-amber-500/20 shadow-sm">
          <div className="text-xs uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider">Livre</div>
          <div className="font-mono text-sm sm:text-base font-black text-amber-800 dark:text-amber-300 tabular-nums tracking-tight mt-0.5">
            R$ {formatarBRL(livreRecomendado)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold mt-0.5">{pctLivre}%</div>
        </div>
      </div>
    </div>
  );
}
