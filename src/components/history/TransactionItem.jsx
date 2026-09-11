import React from 'react';
import { formatarBRL, formatarDataBR } from '../../utils/formatters';

export function TransactionItem({ item, tipo = 'saida', onRemove }) {
  const isSaida = tipo === 'saida';
  const isCartao = item.forma_pagamento === 'cartao_credito';
  const isParcelado = item.frequencia === 'parcelado' || (item.totalParcelas && item.totalParcelas > 1);
  const isRecorrente = item.recorrente === true;

  const dataCompra = formatarDataBR(item.data);
  const dataVenc = item.data_pagamento ? formatarDataBR(item.data_pagamento) : '';

  return (
    <li className="flex items-center justify-between p-3 bg-surface-card hover:bg-surface-active rounded-xl border border-border-subtle transition-all duration-200 group">
      <div className="flex flex-col gap-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-[260px]">
            {item.descricao || '(sem descrição)'}
          </span>

          {/* Tag de Categoria */}
          <span className="text-[10px] font-semibold text-slate-400 bg-surface-inset px-2 py-0.5 rounded-full border border-border-subtle">
            {item.categoria}
            {item.detalhamento ? ` · ${item.detalhamento}` : ''}
          </span>

          {/* Tag de Conveniência (Alimentação) */}
          {item.categoria === 'Alimentação' && item.conveniencia !== undefined && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              item.conveniencia 
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              {item.conveniencia ? '🛵 Delivery' : '🛒 Mercado'}
            </span>
          )}

          {/* Tag de Pagamento */}
          {isSaida && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              isCartao
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              {isCartao ? `💳 Cartão${item.dia_vencimento ? ` (dia ${item.dia_vencimento})` : ''}` : '⚡ PIX/Débito'}
            </span>
          )}

          {/* Tag de Frequência */}
          {isRecorrente && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              🔁 Assinatura Fixa
            </span>
          )}

          {isParcelado && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              💳 Parcela {item.parcelaAtual}/{item.totalParcelas}
            </span>
          )}
        </div>

        {/* Linha de Datas */}
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
          {dataVenc && dataVenc !== dataCompra ? (
            <span>Compra: {dataCompra} · Venc.: <strong className="text-slate-400">{dataVenc}</strong></span>
          ) : (
            <span>{dataCompra}</span>
          )}
        </div>
      </div>

      {/* Valor e Botão Remover */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <span className={`font-mono text-xs sm:text-sm font-bold tabular-nums ${
          isSaida ? 'text-rose-400' : 'text-emerald-400'
        }`}>
          {isSaida ? '−' : '+'} R$ {formatarBRL(item.valor)}
        </span>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="w-6 h-6 flex items-center justify-center rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-sm font-bold leading-none"
          title="Remover lançamento"
          aria-label="Remover lançamento"
        >
          ×
        </button>
      </div>
    </li>
  );
}
