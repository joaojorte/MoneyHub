import React, { useState, useMemo } from 'react';
import { 
  Plus, Minus, Wallet, TrendingUp, TrendingDown, 
  BarChart3, Layers, Calendar, ChevronLeft, ChevronRight, 
  Minimize2, ArrowUpRight, ArrowDownRight, Sparkles
} from 'lucide-react';
import { formatarBRL, formatarMesAno, obterDataHojeISO } from '../../utils/formatters';
import { TransactionModal } from './TransactionModal';
import { RecentTransactions } from './RecentTransactions';

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
  'Fatura a conciliar': '#E11D48',
  'Não identificado': '#64748B'
};

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
  'Fatura a conciliar': '📑',
  'Não identificado': '🏷️'
};

const CORES_FALLBACK = [
  '#EA580C', '#0284C7', '#D97706', '#059669', '#6366F1',
  '#E11D48', '#0D9488', '#F97316', '#4F46E5', '#DB2777'
];

export function UnifiedTransactionHub({
  entradas = [],
  saidas = [],
  addEntrada,
  removeEntrada,
  addSaida,
  removeSaida,
  calc,
  usuario
}) {
  // Controle do Modal de Lançamento
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoModal, setTipoModal] = useState('saida'); // 'entrada' | 'saida'

  const handleAbrirLancamento = (tipo) => {
    setTipoModal(tipo);
    setModalAberto(true);
  };

  const mesAtual = useMemo(() => obterDataHojeISO().slice(0, 7), []);

  // Mês em foco para os gráficos de gastos gerais (null = visão consolidada minimizada)
  const [mesFoco, setMesFoco] = useState(null);

  // Filtro de mês: saídas do mês em foco ou mês atual
  const mesAtivoGrafico = mesFoco || mesAtual;

  const saidasMes = useMemo(() => {
    return saidas.filter((item) => {
      const d = item.data_pagamento || item.data || '';
      return d.startsWith(mesAtivoGrafico) || item.recorrente === true;
    });
  }, [saidas, mesAtivoGrafico]);

  const totalSaidasMes = useMemo(() => {
    return saidasMes.reduce((acc, cur) => acc + (parseFloat(cur.valor) || 0), 0);
  }, [saidasMes]);

  const entradasMes = useMemo(() => {
    return entradas.filter((item) => {
      const d = item.data_pagamento || item.data || '';
      return d.startsWith(mesAtivoGrafico);
    });
  }, [entradas, mesAtivoGrafico]);

  const totalEntradasMes = useMemo(() => {
    return entradasMes.reduce((acc, cur) => acc + (parseFloat(cur.valor) || 0), 0);
  }, [entradasMes]);

  const saldoMes = totalEntradasMes - totalSaidasMes;

  // 1. Histórico e Projeção de Gastos Mensais (Regra: >= '2026-09' e parcelas futuras)
  const historicoGastosMensais = useMemo(() => {
    const mapaMeses = {};
    const MES_BASE = '2026-09';

    // Garante mês atual se for >= 2026-09, senão garante o MES_BASE
    const mesInicialValido = mesAtual >= MES_BASE ? mesAtual : MES_BASE;
    mapaMeses[mesInicialValido] = 0;

    // Adiciona meses com movimentação que sejam >= MES_BASE
    saidas.forEach(item => {
      const d = item.data_pagamento || item.data || '';
      if (d.length >= 7) {
        const ym = d.slice(0, 7);
        if (ym >= MES_BASE) {
          mapaMeses[ym] = 0;
        }
      }
    });

    if (mesFoco && mesFoco >= MES_BASE) {
      mapaMeses[mesFoco] = 0;
    }

    Object.keys(mapaMeses).forEach(mes => {
      const itensMes = saidas.filter(item => {
        const d = item.data_pagamento || item.data || '';
        if (mes > (mesAtual >= MES_BASE ? mesAtual : MES_BASE)) {
          return d.startsWith(mes);
        }
        return d.startsWith(mes) || item.recorrente === true;
      });

      const totalMes = itensMes.reduce((acc, item) => {
        return acc + (parseFloat(item.valor) || 0);
      }, 0);

      mapaMeses[mes] = totalMes;
    });

    const lista = Object.entries(mapaMeses)
      .filter(([mes]) => mes >= MES_BASE)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes, valor]) => {
        const nomesMes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const mesIndex = parseInt(mes.slice(5, 7), 10) - 1;
        return {
          mes,
          mesLabel: formatarMesAno(mes),
          mesCurto: nomesMes[mesIndex] || mes.slice(5, 7),
          valor
        };
      });

    const maxGasto = Math.max(...lista.map(i => i.valor), 1);
    const mediaGasto = lista.reduce((acc, i) => acc + i.valor, 0) / (lista.length || 1);

    return {
      lista,
      maxGasto,
      mediaGasto
    };
  }, [saidas, mesFoco, mesAtual]);

  const handleToggleMes = (mes) => {
    if (mesFoco === mes) {
      setMesFoco(null);
    } else {
      setMesFoco(mes);
    }
  };

  // 2. Gastos por Categoria (Barras Empilhadas na Vertical + Cartões)
  const { categoriasAgrupadas, totalCategorias } = useMemo(() => {
    const mapa = {};
    saidasMes.forEach(item => {
      const cat = item.categoria || 'Não identificado';
      const val = parseFloat(item.valor) || 0;
      mapa[cat] = (mapa[cat] || 0) + val;
    });

    const total = Object.values(mapa).reduce((a, b) => a + b, 0);
    const lista = Object.entries(mapa)
      .map(([nome, valor], idx) => ({
        nome,
        valor,
        porcentagem: total > 0 ? (valor / total) * 100 : 0,
        cor: CORES_CATEGORIAS[nome] || CORES_FALLBACK[idx % CORES_FALLBACK.length]
      }))
      .sort((a, b) => b.valor - a.valor);

    return { categoriasAgrupadas: lista, totalCategorias: total };
  }, [saidasMes]);

  const [categoriaHover, setCategoriaHover] = useState(null);

  return (
    <div className="space-y-7 animate-fadeIn pb-12">
      {/* 1. HERO SECTION: SALDO DISPONÍVEL & AÇÕES RÁPIDAS (Inspirado nas Imagens 1 e 2) */}
      <section className="glass-panel p-6 sm:p-8 rounded-[36px] border-slate-200/90 dark:border-white/[0.08] shadow-lg relative overflow-hidden bg-gradient-to-b from-white/90 via-white/60 to-slate-50/80 dark:from-[#0B1224]/90 dark:via-[#080D1A]/80 dark:to-[#04070F]/90">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Informações do Saldo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-secondary">
                Saldo Disponível
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                BRL (R$)
              </span>
            </div>

            {/* Grande valor em destaque com SF Pro Display / font-num-primary */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-400 dark:text-slate-500 font-num-primary">
                R$
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white font-num-primary tracking-tight">
                {formatarBRL(calc.sobraReal)}
              </h2>
            </div>

            {/* Métricas Resumidas em Pílulas */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-num-primary">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Receitas: R$ {formatarBRL(calc.totalEntradas)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold font-num-primary">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Despesas: R$ {formatarBRL(calc.totalSaidas)}</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold font-num-primary ${
                calc.totalEntradas >= calc.totalSaidas 
                  ? 'bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300' 
                  : 'bg-rose-100 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}>
                <span>Líquido: R$ {formatarBRL(calc.totalEntradas - calc.totalSaidas)}</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação Ágil (Inspirado nas Telas 1 e 2: + Add Money / ^ Send Money) */}
          <div className="flex sm:items-center gap-3.5 flex-col sm:flex-row">
            <button
              type="button"
              onClick={() => handleAbrirLancamento('entrada')}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-black shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Entrada</span>
            </button>

            <button
              type="button"
              onClick={() => handleAbrirLancamento('saida')}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 active:scale-95 text-white text-sm font-black shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Minus className="w-4 h-4" />
              <span>Nova Saída</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. DASHBOARD DE GASTOS GERAIS (Devolvido de Cartões para Lançamentos!) */}
      <section className="space-y-6">
        {/* GRÁFICO 1: GASTOS MENSAIS (Barras com zoom no mês e 2 casas decimais) */}
        <div className="glass-panel p-5 sm:p-7 rounded-[32px] border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                <span>Gastos Mensais</span>
              </h3>
              <p className="text-xs font-secondary text-slate-500 dark:text-slate-400">
                {mesFoco 
                  ? `Visualizando ${formatarMesAno(mesFoco)} ampliado. Clique na barra ou no botão para minimizar.`
                  : 'Histórico a partir de setembro/2026 e projeção de parcelas futuras. Clique em uma barra para ampliar.'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-secondary flex-wrap">
              {mesFoco ? (
                <button
                  type="button"
                  onClick={() => setMesFoco(null)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Minimizar e voltar a ver todas as barras"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Minimizar (Ver todas as barras)</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Média Mensal:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.05] px-3 py-1 rounded-full border border-slate-200 dark:border-white/[0.08] font-num-secondary">
                    R$ {formatarBRL(historicoGastosMensais.mediaGasto)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Renderização das Barras: MODO AMPLIADO vs MINIMIZADO */}
          {mesFoco ? (
            /* MODO AMPLIADO (1 mês focado) */
            <div className="pt-2 pb-1">
              <div className="flex items-center justify-between px-2 sm:px-8">
                <button
                  type="button"
                  onClick={() => {
                    const idx = historicoGastosMensais.lista.findIndex(i => i.mes === mesFoco);
                    if (idx > 0) setMesFoco(historicoGastosMensais.lista[idx - 1].mes);
                  }}
                  disabled={historicoGastosMensais.lista.findIndex(i => i.mes === mesFoco) <= 0}
                  className="p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {(() => {
                  const itemFoco = historicoGastosMensais.lista.find(i => i.mes === mesFoco) || {
                    mes: mesFoco,
                    mesLabel: formatarMesAno(mesFoco),
                    mesCurto: mesFoco.slice(5, 7),
                    valor: totalSaidasMes
                  };

                  return (
                    <div
                      onClick={() => setMesFoco(null)}
                      className="flex flex-col items-center justify-end h-48 sm:h-56 w-36 sm:w-44 cursor-pointer group select-none transition-all"
                      title="Clique novamente na barra para minimizar e voltar a ver todas as barras"
                    >
                      <div className="mb-2 text-center">
                        <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-num-primary block scale-110 drop-shadow-sm">
                          R$ {formatarBRL(itemFoco.valor)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-secondary block mt-0.5 group-hover:text-emerald-500 transition-colors">
                          (Clique para minimizar)
                        </span>
                      </div>

                      <div className="w-20 sm:w-24 h-36 sm:h-40 flex items-end justify-center">
                        <div className="w-full h-full rounded-2xl bg-gradient-to-t from-emerald-600 to-teal-400 shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-400/40 relative overflow-hidden transition-all duration-300 group-hover:scale-105" />
                      </div>

                      <div className="mt-2 text-center">
                        <span className="text-sm font-black uppercase text-emerald-600 dark:text-emerald-400 font-secondary block">
                          {itemFoco.mesCurto}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-secondary">
                          {itemFoco.mesLabel}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => {
                    const idx = historicoGastosMensais.lista.findIndex(i => i.mes === mesFoco);
                    if (idx >= 0 && idx < historicoGastosMensais.lista.length - 1) {
                      setMesFoco(historicoGastosMensais.lista[idx + 1].mes);
                    }
                  }}
                  disabled={historicoGastosMensais.lista.findIndex(i => i.mes === mesFoco) >= historicoGastosMensais.lista.length - 1}
                  className="p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Próximo mês"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* MODO MINIMIZADO (Todas as barras lado a lado a partir de Setembro) */
            <div className="pt-2 pb-1">
              <div className="flex items-end justify-around h-44 sm:h-52 px-2 gap-2 sm:gap-4 max-w-full overflow-x-auto">
                {historicoGastosMensais.lista.map((item) => {
                  const heightPct = historicoGastosMensais.maxGasto > 0 
                    ? Math.max(12, Math.round((item.valor / historicoGastosMensais.maxGasto) * 100))
                    : 12;

                  return (
                    <div
                      key={item.mes}
                      onClick={() => handleToggleMes(item.mes)}
                      className="flex-1 max-w-[80px] flex flex-col items-center justify-end h-full gap-2 cursor-pointer group select-none transition-all"
                      title={`${item.mesLabel}: R$ ${formatarBRL(item.valor)} (Clique para ampliar)`}
                    >
                      <span className="text-[10px] sm:text-xs font-bold transition-all truncate max-w-full text-center text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-num-primary group-hover:scale-105">
                        R$ {formatarBRL(item.valor)}
                      </span>

                      <div className="w-full max-w-[48px] h-full flex items-end justify-center">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full rounded-2xl transition-all duration-500 relative overflow-hidden bg-slate-200 hover:bg-gradient-to-t hover:from-emerald-600 hover:to-teal-400 dark:bg-white/[0.07] dark:hover:bg-gradient-to-t dark:hover:from-emerald-600 dark:hover:to-teal-400 group-hover:shadow-md group-hover:ring-2 group-hover:ring-emerald-400/30"
                        />
                      </div>

                      <span className="text-[11px] sm:text-xs font-bold uppercase transition-all font-secondary text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:font-black">
                        {item.mesCurto}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rodapé informativo do gráfico */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400 font-secondary">
                {mesFoco ? (
                  <>Mês em foco: <strong className="text-slate-900 dark:text-white capitalize">{formatarMesAno(mesFoco)}</strong></>
                ) : (
                  <>Visão consolidada: <strong className="text-slate-900 dark:text-white capitalize">Todos os Meses</strong></>
                )}
              </span>
              {mesFoco && (
                <button
                  type="button"
                  onClick={() => setMesFoco(null)}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  (minimizar)
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-num-primary">
                Receitas: R$ {formatarBRL(totalEntradasMes)}
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-bold font-num-primary">
                Despesas: R$ {formatarBRL(totalSaidasMes)}
              </span>
              <span className={`font-black font-num-primary ${saldoMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                Saldo: R$ {formatarBRL(saldoMes)}
              </span>
            </div>
          </div>
        </div>

        {/* GRÁFICO 2: GASTOS POR CATEGORIA (Barras empilhadas na vertical + cartões) */}
        <div className="glass-panel p-5 sm:p-7 rounded-[32px] border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <span>Gastos por Categoria</span>
              </h3>
              <p className="text-xs font-secondary text-slate-500 dark:text-slate-400">
                Gráfico de barras empilhadas na vertical com a distribuição proporcional das despesas.
              </p>
            </div>

            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.05] px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/[0.08] self-start sm:self-auto font-num-secondary">
              Total: R$ {formatarBRL(totalCategorias)}
            </span>
          </div>

          {totalCategorias === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-secondary">
              Nenhuma despesa registrada para {mesFoco ? formatarMesAno(mesFoco) : 'o período'}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Barra Empilhada Vertical */}
              <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col justify-between h-[250px] text-[10px] font-mono text-slate-400 dark:text-slate-500 select-none text-right py-1 font-num-secondary">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>

                  <div className="relative w-16 sm:w-20 h-[250px] rounded-2xl overflow-hidden bg-slate-200/60 dark:bg-white/[0.05] border border-slate-300/80 dark:border-white/10 shadow-inner flex flex-col-reverse">
                    {categoriasAgrupadas.map((cat) => {
                      const isHovered = categoriaHover === cat.nome;
                      const isAnyHovered = Boolean(categoriaHover);

                      return (
                        <div
                          key={cat.nome}
                          style={{ 
                            height: `${cat.porcentagem}%`, 
                            backgroundColor: cat.cor 
                          }}
                          onMouseEnter={() => setCategoriaHover(cat.nome)}
                          onMouseLeave={() => setCategoriaHover(null)}
                          className={`w-full transition-all duration-300 relative group cursor-pointer flex items-center justify-center border-t border-white/20 first:border-t-0 ${
                            isHovered 
                              ? 'brightness-125 z-10 scale-[1.03] shadow-md ring-2 ring-white/60' 
                              : isAnyHovered 
                                ? 'opacity-40' 
                                : 'hover:brightness-110'
                          }`}
                          title={`${cat.nome}: R$ ${formatarBRL(cat.valor)} (${cat.porcentagem.toFixed(1)}%)`}
                        >
                          {cat.porcentagem >= 12 && (
                            <span className="text-[11px] font-black text-white drop-shadow select-none font-num-secondary">
                              {cat.porcentagem.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-secondary block">
                    100% dos Gastos do Período
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 font-secondary">
                    {categoriasAgrupadas.length} categorias empilhadas
                  </span>
                </div>
              </div>

              {/* Cartões Detalhados por Categoria */}
              <div className="md:col-span-7 lg:col-span-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {categoriasAgrupadas.map((cat) => {
                    const isHovered = categoriaHover === cat.nome;

                    return (
                      <div
                        key={cat.nome}
                        onMouseEnter={() => setCategoriaHover(cat.nome)}
                        onMouseLeave={() => setCategoriaHover(null)}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                          isHovered
                            ? 'border-amber-400 dark:border-amber-400 bg-white dark:bg-white/[0.08] shadow-md scale-[1.02]'
                            : 'bg-slate-50/90 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-xs"
                              style={{ 
                                backgroundColor: `${cat.cor}20`,
                                border: `1px solid ${cat.cor}40`
                              }}
                            >
                              <span>{ICONES_CATEGORIAS[cat.nome] || '🏷️'}</span>
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                                {cat.nome}
                              </span>
                              <span className="block text-base font-black text-slate-900 dark:text-white mt-1 font-num-secondary">
                                R$ {formatarBRL(cat.valor)}
                              </span>
                            </div>
                          </div>

                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold border font-num-secondary flex-shrink-0 self-start"
                            style={{
                              backgroundColor: `${cat.cor}18`,
                              color: cat.cor,
                              borderColor: `${cat.cor}35`
                            }}
                          >
                            {cat.porcentagem.toFixed(1)}%
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-slate-200/70 dark:bg-white/[0.08] overflow-hidden mt-3">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${cat.porcentagem}%`,
                              backgroundColor: cat.cor
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. EXTRATO UNIFICADO DE TRANSAÇÕES (Inspirado nas Imagens 1 e 2) */}
      <section>
        <RecentTransactions
          entradas={entradas}
          saidas={saidas}
          onRemoveEntrada={removeEntrada}
          onRemoveSaida={removeSaida}
        />
      </section>

      {/* 4. MODAL DE LANÇAMENTO (Inspirado na Tela 3: Send Money / Add Money) */}
      <TransactionModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        initialType={tipoModal}
        onAddIncome={addEntrada}
        onAddExpense={addSaida}
        saidas={saidas}
      />
    </div>
  );
}
