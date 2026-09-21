import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ArrowUpRight, ArrowDownRight, 
  Trash2, CreditCard, Zap, Calendar, Tag, ChevronDown
} from 'lucide-react';
import { formatarBRL, formatarDataBR } from '../../utils/formatters';

const ICONES_CATEGORIAS = {
  'Alimentação': '🍽️',
  'Mercado': '🛒',
  'Transporte': '🚗',
  'Saúde': '🏥',
  'Educação': '📚',
  'Comunicação': '📱',
  'Compras': '🛍️',
  'Serviços': '⚙️',
  'Transferências/Pagamentos pessoais': '💸',
  'Outros': '📦',
  'Não identificado': '🏷️',
  'Salário': '💼',
  'Dividendos': '📈',
  'Rendimentos': '🌱',
  'Estorno/Devolução': '↩️',
  'Fatura de Cartão': '📑'
};

const CORES_CATEGORIAS = {
  'Alimentação': '#EA580C',
  'Mercado': '#F97316',
  'Transporte': '#6366F1',
  'Saúde': '#059669',
  'Educação': '#0D9488',
  'Comunicação': '#D97706',
  'Compras': '#E11D48',
  'Serviços': '#0284C7',
  'Transferências/Pagamentos pessoais': '#4F46E5',
  'Outros': '#7C3AED',
  'Salário': '#059669',
  'Dividendos': '#0D9488',
  'Rendimentos': '#10B981',
  'Estorno/Devolução': '#6366F1'
};

export function RecentTransactions({
  entradas = [],
  saidas = [],
  onRemoveEntrada,
  onRemoveSaida
}) {
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'entradas' | 'saidas'
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  // Une entradas e saídas em um feed unificado cronológico
  const transacoesUnificadas = useMemo(() => {
    const listaEntradas = entradas.map(e => ({
      ...e,
      tipoOperacao: 'entrada',
      dataEfetivaOrdenacao: e.data_pagamento || e.data || ''
    }));

    const listaSaidas = saidas.map(s => ({
      ...s,
      tipoOperacao: 'saida',
      dataEfetivaOrdenacao: s.data_pagamento || s.data || ''
    }));

    const combinadas = [...listaEntradas, ...listaSaidas];

    // Ordenação decrescente: mais recentes primeiro
    return combinadas.sort((a, b) => {
      const dataDiff = b.dataEfetivaOrdenacao.localeCompare(a.dataEfetivaOrdenacao);
      if (dataDiff !== 0) return dataDiff;
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [entradas, saidas]);

  // Lista de categorias únicas para filtro rápido
  const categoriasDisponiveis = useMemo(() => {
    const set = new Set();
    transacoesUnificadas.forEach(t => {
      if (t.categoria) set.add(t.categoria);
    });
    return Array.from(set).sort();
  }, [transacoesUnificadas]);

  // Filtragem
  const transacoesFiltradas = useMemo(() => {
    return transacoesUnificadas.filter(t => {
      // Filtro de tipo
      if (filtroTipo === 'entradas' && t.tipoOperacao !== 'entrada') return false;
      if (filtroTipo === 'saidas' && t.tipoOperacao !== 'saida') return false;

      // Filtro de categoria
      if (filtroCategoria !== 'todas' && t.categoria !== filtroCategoria) return false;

      // Busca textual
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const desc = (t.descricao || '').toLowerCase();
        const cat = (t.categoria || '').toLowerCase();
        const det = (t.detalhamento || '').toLowerCase();
        const cartao = (t.cartaoNome || '').toLowerCase();
        return desc.includes(termo) || cat.includes(termo) || det.includes(termo) || cartao.includes(termo);
      }

      return true;
    });
  }, [transacoesUnificadas, filtroTipo, filtroCategoria, busca]);

  const handleRemover = (item) => {
    if (item.tipoOperacao === 'entrada') {
      onRemoveEntrada(item.id);
    } else {
      onRemoveSaida(item.id);
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-7 rounded-[32px] border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-5">
      {/* Topo do Extrato: Título + Filtros Ágeis (Inspirado nas Imagens 1 e 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Transações Recentes
            </h3>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/10 tabular-nums">
              {transacoesFiltradas.length} de {transacoesUnificadas.length}
            </span>
          </div>
          <p className="text-xs font-secondary text-slate-500 dark:text-slate-400 mt-0.5">
            Feed unificado de movimentações financeiras com entradas e saídas integradas.
          </p>
        </div>

        {/* Alternador de Filtro: Todos / Entradas / Saídas */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.05] rounded-2xl border border-slate-200 dark:border-white/10 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFiltroTipo('todos')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filtroTipo === 'todos'
                ? 'bg-white text-slate-900 shadow dark:bg-white/20 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('entradas')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filtroTipo === 'entradas'
                ? 'bg-white text-emerald-600 shadow dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            Entradas (+)
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('saidas')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filtroTipo === 'saidas'
                ? 'bg-white text-rose-600 shadow dark:bg-rose-500/20 dark:text-rose-300'
                : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            Saídas (−)
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtro de Categoria */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descrição, cartão ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="glass-input w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm font-medium"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        <div className="sm:col-span-4">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="glass-input w-full px-3 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <option value="todas">Todas as Categorias</option>
            {categoriasDisponiveis.map(c => (
              <option key={c} value={c}>
                {ICONES_CATEGORIAS[c] || '🏷️'} {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista Unificada de Transações (Estilo Revolut / Wise / Mockup Imagem 1 e 2) */}
      {transacoesFiltradas.length === 0 ? (
        <div className="py-14 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-2xl">
            📭
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhuma movimentação encontrada
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
            {busca || filtroCategoria !== 'todas' || filtroTipo !== 'todos'
              ? 'Tente ajustar os filtros ou a busca acima.'
              : 'Utilize os botões de ação "+ Nova Entrada" ou "− Nova Saída" para registrar sua primeira transação.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
          {transacoesFiltradas.map((item) => {
            const isEntrada = item.tipoOperacao === 'entrada';
            const isCartao = item.forma_pagamento === 'cartao_credito';
            const isParcelado = item.frequencia === 'parcelado' || (item.totalParcelas && item.totalParcelas > 1);
            const isRecorrente = item.recorrente === true;
            const dataCompra = formatarDataBR(item.data);
            const dataVenc = item.data_pagamento ? formatarDataBR(item.data_pagamento) : '';
            const icone = ICONES_CATEGORIAS[item.categoria] || (isEntrada ? '💰' : '🏷️');
            const corCategoria = CORES_CATEGORIAS[item.categoria] || (isEntrada ? '#10B981' : '#E11D48');

            return (
              <li
                key={item.id}
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white/70 dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-all duration-200 shadow-xs group"
              >
                {/* Lado Esquerdo: Ícone Redondo + Informações */}
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  {/* Ícone Redondo com estilo suave (Estilo Imagens 1 & 2) */}
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-xs"
                    style={{
                      backgroundColor: `${corCategoria}18`,
                      border: `1px solid ${corCategoria}35`
                    }}
                  >
                    <span>{icone}</span>
                  </div>

                  {/* Textos e Tags */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[320px]">
                        {item.descricao ? item.descricao : (item.categoria || 'Lançamento')}
                      </span>

                      {/* Tag da Categoria */}
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/[0.08]">
                        {item.categoria}
                        {item.detalhamento ? ` · ${item.detalhamento}` : ''}
                      </span>

                      {/* Tags Específicas de Saída */}
                      {!isEntrada && (
                        <>
                          {item.categoria === 'Alimentação' && item.conveniencia !== undefined && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.conveniencia 
                                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' 
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300'
                            }`}>
                              {item.conveniencia ? '🛵 Delivery' : '🛒 Mercado'}
                            </span>
                          )}

                          {isCartao ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-400/30">
                              {item.cartaoNome ? `💳 ${item.cartaoNome}` : '💳 Cartão de Crédito'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:border-white/10">
                              ⚡ PIX / Débito
                            </span>
                          )}

                          {isParcelado && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300">
                              {item.parcelaAtual}/{item.totalParcelas}
                            </span>
                          )}

                          {isRecorrente && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300">
                              🔁 Assinatura
                            </span>
                          )}

                          {item.isFaturaTotal && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/30 dark:text-rose-300">
                              📑 Fatura Consolidada
                            </span>
                          )}
                        </>
                      )}

                      {/* Tag de Entrada */}
                      {isEntrada && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300">
                          💰 Receita
                        </span>
                      )}
                    </div>

                    {/* Data da Transação */}
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{dataCompra}</span>
                      {dataVenc && dataVenc !== dataCompra && (
                        <span>
                          · Fatura: <strong className="text-slate-600 dark:text-slate-300">{dataVenc}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Valor Numérico em Destaque + Botão de Excluir */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-base sm:text-lg font-black font-num-primary tabular-nums tracking-tight ${
                    isEntrada 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {isEntrada ? '+ R$' : '− R$'} {formatarBRL(item.valor)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemover(item)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/15 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                    title="Remover transação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
