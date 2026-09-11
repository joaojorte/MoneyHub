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
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 bg-surface-inset border border-border-subtle rounded-xl select-none">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <CreditCard className="w-4 h-4 text-rose-400" />
          <span>
            Vencimento: <strong className="font-mono text-rose-400 tabular-nums">dia {diaVencimento}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={onAbrirEdicao}
          className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-white/[0.06]"
          title="Alterar dia de vencimento fixo"
        >
          <Edit2 className="w-3 h-3" />
          <span>Editar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-surface-inset border border-rose-500/30 rounded-xl">
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
          className="w-12 text-center font-mono font-bold text-sm bg-black/40 border border-white/10 rounded-lg py-0.5 text-white focus:outline-none focus:border-rose-400"
          autoFocus
        />
        <button
          type="button"
          onClick={() => onSalvar(inputDia)}
          className="p-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg transition-colors"
          title="Salvar dia de vencimento"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
