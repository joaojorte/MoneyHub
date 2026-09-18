import React, { useState, useMemo, useEffect } from 'react';
import { CreditCard, Calendar, Wallet, AlertCircle, CheckCircle2, ChevronRight, Filter } from 'lucide-react';
import { formatarBRL, formatarDataBR, formatarMesAno, obterDataHojeISO } from '../../utils/formatters';
import { STORAGE_KEYS } from '../../utils/constants';

export function CreditCardDashboard({ saidas = [], onRemoveSaida }) {
  // Limite total configurável pelo usuário
  const [limiteTotal, setLimiteTotal] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.CARTAO_LIMITE_TOTAL);
      if (salvo !== null && salvo.trim() !== '') {
        const num = parseFloat(salvo);
        if (!isNaN(num) && num > 0) return num;
      }
    } catch (e) {}
    return 5000; // Padrão inicial
  });

  // Dia de vencimento padrão
  const [diaVencimento, setDiaVencimento] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.CARTAO_DIA_VENCIMENTO);
      if (salvo !== null && salvo.trim() !== '') {
        const num = parseInt(salvo, 10);
        if (!isNaN(num) && num >= 1 && num <= 31) return num;
      }
    } catch (e) {}
    return 10;
  });

  // Filtro de faturas: 'todas' | 'atual' | 'futuras'
  const [filtroStatus, setFiltroStatus] = useState('todas');

  const mesAtual = useMemo(() => obterDataHojeISO().slice(0, 7), []);

  const handleSalvarLimite = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setLimiteTotal(val);
      try {
        localStorage.setItem(STORAGE_KEYS.CARTAO_LIMITE_TOTAL, String(val));
      } catch (err) {}
    }
  };

  const handleSalvarDiaVencimento = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= 31) {
      setDiaVencimento(val);
      try {
        localStorage.setItem(STORAGE_KEYS.CARTAO_DIA_VENCIMENTO, String(val));
      } catch (err) {}
    }
  };

  // Filtra todas as transações de cartão de crédito
  const transacoesCartao = useMemo(() => {
    return saidas.filter(item => 
      item.forma_pagamento === 'cartao_credito' || 
      item.dia_vencimento !== undefined || 
      item.parcelaAtual !== undefined
    );
  }, [saidas]);

  // Agrupa transações por Fatura (Mês/Ano)
  const faturas = useMemo(() => {
    const mapa = {};

    transacoesCartao.forEach(item => {
      const dataRef = item.data_pagamento || item.data || '';
      const mesFatura = dataRef.length >= 7 ? dataRef.slice(0, 7) : mesAtual;

      if (!mapa[mesFatura]) {
        // Estima o vencimento a partir do dia configurado ou do primeiro item
        const dia = item.dia_vencimento || diaVencimento;
        mapa[mesFatura] = {
          mesFatura,
          diaVencimento: dia,
          dataVencimento: `${mesFatura}-${String(dia).padStart(2, '0')}`,
          itens: [],
          total: 0
        };
      }

      mapa[mesFatura].itens.push(item);
      mapa[mesFatura].total += (parseFloat(item.valor) || 0);
    });

    // Ordena as faturas cronologicamente
    const lista = Object.values(mapa).sort((a, b) => a.mesFatura.localeCompare(b.mesFatura));

    // Ordena os itens dentro de cada fatura (mais recentes primeiro)
    lista.forEach(f => {
      f.itens.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    });

    return lista;
  }, [transacoesCartao, mesAtual, diaVencimento]);

  // Fatura Atual
  const faturaAtual = useMemo(() => {
    return faturas.find(f => f.mesFatura === mesAtual) || { total: 0, itens: [] };
  }, [faturas, mesAtual]);

  // Total Comprometido (Fatura Atual + Faturas Futuras)
  const totalComprometido = useMemo(() => {
    return faturas
      .filter(f => f.mesFatura >= mesAtual)
      .reduce((acc, cur) => acc + cur.total, 0);
  }, [faturas, mesAtual]);

  // Limite Disponível
  const limiteDisponivel = Math.max(0, limiteTotal - totalComprometido);
  const percentualConsumo = limiteTotal > 0 
    ? Math.min(100, Math.round((totalComprometido / limiteTotal) * 100)) 
    : 0;

  // Cor do indicador de limite
  const corProgresso = useMemo(() => {
    if (percentualConsumo > 85) return 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]';
    if (percentualConsumo > 60) return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]';
    return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
  }, [percentualConsumo]);

  // Faturas filtradas para exibição no feed
  const faturasFiltradas = useMemo(() => {
    if (filtroStatus === 'atual') {
      return faturas.filter(f => f.mesFatura === mesAtual);
    }
    if (filtroStatus === 'futuras') {
      return faturas.filter(f => f.mesFatura > mesAtual);
    }
    return faturas;
  }, [faturas, filtroStatus, mesAtual]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header do Painel: Gestão e Configuração Rápida */}
      <section className="glass-panel p-5 sm:p-6 space-y-6 border-slate-200/90 dark:border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-400/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Gestão de Cartões</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 font-mono font-medium">
                  Exclusivo
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Controle de limites, faturas abertas e parcelas futuras em timeline limpa
              </p>
            </div>
          </div>

          {/* Controles Minimalistas de Limite e Vencimento */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]">
              <Wallet className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <label htmlFor="input-limite" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Limite Total:
              </label>
              <div className="flex items-center">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mr-1">R$</span>
                <input
                  id="input-limite"
                  type="number"
                  step="100"
                  min="0"
                  value={limiteTotal}
                  onChange={handleSalvarLimite}
                  className="w-24 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                  placeholder="5000"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]">
              <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <label htmlFor="input-dia-venc" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Dia Venc.:
              </label>
              <input
                id="input-dia-venc"
                type="number"
                min="1"
                max="31"
                value={diaVencimento}
                onChange={handleSalvarDiaVencimento}
                className="w-10 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white text-center focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Indicador de Progresso (Barra de Limite Total vs. Consumido) */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          <div className="flex flex-wrap items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span>Limite Consumido no Cartão:</span>
              <strong className="font-mono text-slate-900 dark:text-white tabular-nums">
                {percentualConsumo}%
              </strong>
            </span>
            <div className="flex items-center gap-3 font-mono font-semibold">
              <span className="text-rose-600 dark:text-rose-400">
                Comprometido: R$ {formatarBRL(totalComprometido)}
              </span>
              <span className="text-slate-400 dark:text-slate-500">|</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                Disponível: R$ {formatarBRL(limiteDisponivel)}
              </span>
            </div>
          </div>

          <div className="w-full h-3.5 bg-slate-100 dark:bg-[#04070F]/80 backdrop-blur-md rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/[0.08] shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ${corProgresso}`}
              style={{ width: `${Math.max(2, percentualConsumo)}%` }}
            />
          </div>
        </div>

        {/* 4 Cards Informativos Rápidos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05]">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-0.5">
              Fatura Atual ({formatarMesAno(mesAtual).split(' de ')[0]})
            </span>
            <span className="text-lg font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              R$ {formatarBRL(faturaAtual.total)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05]">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-0.5">
              Total Comprometido
            </span>
            <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              R$ {formatarBRL(totalComprometido)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05]">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-0.5">
              Limite Disponível
            </span>
            <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              R$ {formatarBRL(limiteDisponivel)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05]">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-0.5">
              Limite Cadastrado
            </span>
            <span className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              R$ {formatarBRL(limiteTotal)}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Timeline de Faturas (Feed Limpo) */}
      <section className="space-y-4">
        {/* Barra de Filtro de Faturas */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Linha do Tempo de Faturas</span>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-white/[0.05] px-2 py-0.5 rounded-full">
              {faturas.length} {faturas.length === 1 ? 'mês' : 'meses'}
            </span>
          </h3>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFiltroStatus('todas')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filtroStatus === 'todas'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-rose-500/20 dark:text-rose-300'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('atual')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filtroStatus === 'atual'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-rose-500/20 dark:text-rose-300'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Fatura Atual
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('futuras')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filtroStatus === 'futuras'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-rose-500/20 dark:text-rose-300'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Futuras
            </button>
          </div>
        </div>

        {/* Lista de Faturas ou Estado Vazio */}
        {faturasFiltradas.length === 0 ? (
          <div className="glass-panel p-10 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 text-xl">
              💳
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Nenhuma despesa de cartão encontrada
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Ao cadastrar saídas na aba Calculadora, selecione a opção "Cartão de Crédito" para que as compras e parcelamentos futuros sejam agrupados aqui automaticamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {faturasFiltradas.map((fatura) => {
              const isMesAtual = fatura.mesFatura === mesAtual;
              const isFutura = fatura.mesFatura > mesAtual;

              return (
                <div
                  key={fatura.mesFatura}
                  className={`glass-panel overflow-hidden border transition-all duration-200 ${
                    isMesAtual
                      ? 'border-rose-300 dark:border-rose-500/30 shadow-md'
                      : 'border-slate-200/80 dark:border-white/[0.08]'
                  }`}
                >
                  {/* Cabeçalho da Fatura */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        isMesAtual 
                          ? 'bg-amber-500 animate-pulse' 
                          : isFutura 
                          ? 'bg-indigo-500' 
                          : 'bg-slate-400'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Fatura de {formatarMesAno(fatura.mesFatura)}
                          </h4>
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            isMesAtual
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30'
                              : isFutura
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-400/30'
                              : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}>
                            {isMesAtual ? 'Fatura Atual' : isFutura ? 'Fatura Futura' : 'Fatura Fechada'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          Vencimento previsto: {formatarDataBR(fatura.dataVencimento)} · {fatura.itens.length} {fatura.itens.length === 1 ? 'lançamento' : 'lançamentos'}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Total da Fatura
                      </span>
                      <span className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                        R$ {formatarBRL(fatura.total)}
                      </span>
                    </div>
                  </div>

                  {/* Feed Limpo de Transações (Sem bordas pesadas) */}
                  <div className="p-2 sm:p-3 divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {fatura.itens.map((item) => {
                      const isParcelado = item.totalParcelas && item.totalParcelas > 1;
                      const dataCompra = formatarDataBR(item.data);

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-all duration-150 group"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-3">
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md">
                                  {item.descricao || '(sem descrição)'}
                                </span>

                                {/* Badge de Categoria */}
                                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/[0.06]">
                                  {item.categoria}
                                </span>

                                {/* Badge de Parcela */}
                                {isParcelado && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30 font-mono">
                                    {item.parcelaAtual}/{item.totalParcelas}
                                  </span>
                                )}

                                {item.conveniencia && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30">
                                    🛵 Delivery
                                  </span>
                                )}
                              </div>

                              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                Compra realizada em {dataCompra}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="font-mono text-sm sm:text-base font-bold tabular-nums text-rose-600 dark:text-rose-400">
                              − R$ {formatarBRL(item.valor)}
                            </span>

                            {onRemoveSaida && (
                              <button
                                type="button"
                                onClick={() => onRemoveSaida(item.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/15 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 transition-all text-base font-bold leading-none select-none"
                                title="Remover lançamento desta fatura"
                                aria-label="Remover lançamento"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
