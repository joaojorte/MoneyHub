import React from 'react';
import { TransactionItem } from './TransactionItem';

export function TransactionList({
  items = [],
  tipo = 'saida',
  titulo,
  onRemove,
  emptyMessage = 'Nenhum lançamento registrado.'
}) {
  return (
    <div className="glass-panel p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {titulo} ({items.length})
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-4 text-center">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
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
