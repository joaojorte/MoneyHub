import React from 'react';
import { TransactionItem } from './TransactionItem';

export function TransactionList({
  items = [],
  tipo = 'saida',
  titulo,
  onRemove,
  emptyMessage = 'Nenhum lançamento registrado.'
}) {
  const isSaida = tipo === 'saida';

  return (
    <div className="glass-panel p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isSaida ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`} />
          <span>{titulo}</span>
        </h3>
        <span className="text-[11px] font-mono font-bold text-slate-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 rounded-full tabular-nums">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center gap-1.5">
          <span className="text-xl opacity-40">📭</span>
          <p className="text-xs text-slate-500 italic">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {items.map((item) => (
            <TransactionItem
              key={item.id}
              item={item}
              tipo={tipo}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
