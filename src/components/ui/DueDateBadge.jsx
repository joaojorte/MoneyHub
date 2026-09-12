import React from 'react';
import { CreditCard, Edit2, Check } from 'lucide-react';

export function DueDateBadge({
  diaVencimento,
  modoEdicao,
  onAbrirEdicao,
  inputDia,
  onInputDiaChange,
  onSalvar
}) {
  if (!modoEdicao) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[#04070F]/70 backdrop-blur-md border border-rose-500/20 shadow-[0_0_16px_rgba(244,63,94,0.15)] rounded-full select-none">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <CreditCard className="w-3.5 h-3.5 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <span>
            Vencimento da fatura: <strong className="font-mono font-bold text-rose-300 tabular-nums">dia {diaVencimento}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={onAbrirEdicao}
          className="text-[11px] font-semibold text-rose-300/80 hover:text-white flex items-center gap-1 transition-colors px-2.5 py-0.5 rounded-full hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30"
          title="Alterar dia de vencimento fixo"
        >
          <Edit2 className="w-3 h-3" />
          <span>Editar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 px-3.5 py-1.5 bg-[#04070F]/80 backdrop-blur-md border border-rose-400/40 shadow-[0_0_18px_rgba(244,63,94,0.25)] rounded-full">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        <span>📅</span>
        <span>Dia do Vencimento:</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500 font-semibold">Dia</span>
        <input
          type="number"
          min="1"
          max="31"
          value={inputDia}
          onChange={(e) => onInputDiaChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSalvar(inputDia);
            }
          }}
          placeholder="10"
          className="w-12 text-center font-mono font-bold text-sm bg-black/60 border border-white/20 rounded-full py-0.5 text-white focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30"
          autoFocus
        />
        <button
          type="button"
          onClick={() => onSalvar(inputDia)}
          className="p-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-full transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          title="Salvar dia de vencimento"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
