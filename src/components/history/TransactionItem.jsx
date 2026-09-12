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
    <li className="flex items-center justify-between p-3.5 bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent hover:from-white/[0.07] hover:via-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.08] hover:border-white/[0.16] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-200 group">
      <div className="flex flex-col gap-1.5 min-w-0 pr-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate max-w-[180px] sm:max-w-[260px]">
            {item.descricao || '(sem descrição)'}
          </span>

          {/* Tag de Categoria */}
          <span className="text-[10px] font-semibold text-slate-400 bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
            {item.categoria}
            {item.detalhamento ? ` · ${item.detalhamento}` : ''}
          </span>

          {/* Tag de Conveniência (Alimentação) */}
          {item.categoria === 'Alimentação' && item.conveniencia !== undefined && (
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
              item.conveniencia 
                ? 'bg-amber-500/15 text-amber-300 border-amber-400/30' 
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
            }`}>
              {item.conveniencia ? '🛵 Delivery' : '🛒 Mercado'}
            </span>
          )}

          {/* Tag de Pagamento */}
          {isSaida && (
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
              isCartao
                ? 'bg-rose-500/15 text-rose-300 border-rose-400/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
            }`}>
              {isCartao ? `💳 Cartão${item.dia_vencimento ? ` (dia ${item.dia_vencimento})` : ''}` : '⚡ PIX/Débito'}
            </span>
          )}

          {/* Tag de Frequência */}
          {isRecorrente && (
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-400/30">
              🔁 Assinatura Fixa
            </span>
          )}

          {isParcelado && (
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
              💳 Parcela {item.parcelaAtual}/{item.totalParcelas}
            </span>
          )}
        </div>

        {/* Linha de Datas */}
        <div className="text-[11px] text-slate-400/70 flex items-center gap-1.5 font-mono">
          {dataVenc && dataVenc !== dataCompra ? (
            <span>Compra: {dataCompra} · Venc.: <strong className="text-slate-300 font-semibold">{dataVenc}</strong></span>
          ) : (
            <span>{dataCompra}</span>
          )}
        </div>
      </div>

      {/* Valor Tabular e Botão Remover */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`font-mono text-sm sm:text-base font-bold tabular-nums tracking-tight ${
          isSaida 
            ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.45)]' 
            : 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.45)]'
        }`}>
          {isSaida ? '−' : '+'} R$ {formatarBRL(item.valor)}
        </span>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all text-base font-bold leading-none select-none"
          title="Remover lançamento"
          aria-label="Remover lançamento"
        >
          ×
        </button>
      </div>
    </li>
  );
}
