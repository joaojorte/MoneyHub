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
    <li className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 shadow-sm dark:bg-black/40 dark:hover:bg-white/[0.05] backdrop-blur-xl rounded-2xl dark:border-white/[0.08] dark:shadow-none transition-all duration-200 group">
      <div className="flex flex-col gap-1.5 min-w-0 pr-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate max-w-[180px] sm:max-w-[280px]">
            {item.descricao ? item.descricao : <span className="text-slate-400 dark:text-slate-500 italic font-normal">(sem descrição)</span>}
          </span>

          {/* Tag de Categoria */}
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-white/[0.04] px-3 py-0.5 rounded-full border border-slate-200 dark:border-white/[0.06]">
            {item.categoria}
            {item.detalhamento ? ` · ${item.detalhamento}` : ''}
          </span>

          {/* Tag de Conveniência (Alimentação) */}
          {item.categoria === 'Alimentação' && item.conveniencia !== undefined && (
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              item.conveniencia 
                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/30'
            }`}>
              {item.conveniencia ? '🛵 Delivery' : '🛒 Mercado'}
            </span>
          )}

          {/* Tag de Pagamento */}
          {isSaida && (
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isCartao
                ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-400/30'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/30'
            }`}>
              {isCartao 
                ? (item.cartaoNome ? `💳 ${item.cartaoNome}` : `💳 Cartão${item.dia_vencimento ? ` (dia ${item.dia_vencimento})` : ''}`)
                : '⚡ PIX/Débito'}
            </span>
          )}

          {item.isFaturaTotal && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-400/40">
              📑 Fatura Consolidada
            </span>
          )}

          {/* Tag de Frequência */}
          {isRecorrente && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-400/30">
              🔁 Assinatura Fixa
            </span>
          )}

          {isParcelado && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30 font-mono">
              💳 Parcela {item.parcelaAtual}/{item.totalParcelas}
            </span>
          )}
        </div>

        {/* Linha de Datas */}
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
          {dataVenc && dataVenc !== dataCompra ? (
            <span>Compra: {dataCompra} · Venc.: <strong className="text-slate-700 dark:text-slate-300 font-bold">{dataVenc}</strong></span>
          ) : (
            <span>{dataCompra}</span>
          )}
        </div>
      </div>

      {/* Valor Tabular e Botão Remover */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`font-mono text-base sm:text-lg font-black tabular-nums tracking-tight ${
          isSaida 
            ? 'text-rose-600 dark:text-rose-400' 
            : 'text-emerald-600 dark:text-emerald-400'
        }`}>
          {isSaida ? '−' : '+'} R$ {formatarBRL(item.valor)}
        </span>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/15 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 transition-all text-base font-bold leading-none select-none"
          title="Remover lançamento"
          aria-label="Remover lançamento"
        >
          ×
        </button>
      </div>
    </li>
  );
}
