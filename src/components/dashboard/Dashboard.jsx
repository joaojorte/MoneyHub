import React, { useState, useMemo } from 'react';
import { formatarBRL, formatarMesAno, obterDataHojeISO } from '../../utils/formatters';

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
  'Não identificado': '#64748B'
};

const CORES_FALLBACK = [
  '#EA580C', '#0284C7', '#D97706', '#059669', '#6366F1',
  '#E11D48', '#0D9488', '#F97316', '#4F46E5', '#DB2777'
];

export function Dashboard({ entradas = [], saidas = [], calc }) {
  // 1. Mês de Referência
  const mesesDisponiveis = useMemo(() => {
    const mesesSet = new Set();
    const mesAtual = obterDataHojeISO().slice(0, 7);
    mesesSet.add(mesAtual);

    entradas.forEach(item => {
      const d = item.data_pagamento || item.data;
      if (d && d.length >= 7) mesesSet.add(d.slice(0, 7));
    });

    saidas.forEach(item => {
      const d = item.data_pagamento || item.data;
      if (d && d.length >= 7) mesesSet.add(d.slice(0, 7));
    });

    return Array.from(mesesSet).sort((a, b) => b.localeCompare(a));
  }, [entradas, saidas]);

  const [mesSelecionado, setMesSelecionado] = useState(() => {
    return mesesDisponiveis[0] || obterDataHojeISO().slice(0, 7);
  });

  // Filtro de lançamentos por mês
  const entradasMes = useMemo(() => {
    return entradas.filter(item => {
      const d = item.data_pagamento || item.data || '';
      return d.startsWith(mesSelecionado);
    });
  }, [entradas, mesSelecionado]);

  const saidasMes = useMemo(() => {
    return saidas.filter(item => {
      const d = item.data_pagamento || item.data || '';
      return d.startsWith(mesSelecionado) || item.recorrente === true;
    });
  }, [saidas, mesSelecionado]);

  const totalEntradasMes = useMemo(() => {
    return entradasMes.reduce((acc, cur) => acc + (parseFloat(cur.valor) || 0), 0);
  }, [entradasMes]);

  const totalSaidasMes = useMemo(() => {
    return saidasMes.reduce((acc, cur) => acc + (parseFloat(cur.valor) || 0), 0);
  }, [saidasMes]);

  const saldoMes = totalEntradasMes - totalSaidasMes;

  // Agrupamento por Categoria para o Gráfico de Rosca
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

  // Controles da Projeção de Juros Compostos
  const [taxaMensal, setTaxaMensal] = useState('0.8');
  const [anosProjecao, setAnosProjecao] = useState('10');
  const [aporteFuturoManual, setAporteFuturoManual] = useState(() => {
    if (calc?.investimentoRecomendado && calc.investimentoRecomendado > 0) {
      return calc.investimentoRecomendado.toFixed(2);
    }
    return '500.00';
  });

  const pvAtual = calc?.totalInvestidoAcumulado || 0;
  const numAportes = calc?.historicoInvestimentos?.length || 0;

  // Simulação ano a ano
  const projecao = useMemo(() => {
    const pv = pvAtual;
    const taxa = (parseFloat(taxaMensal) || 0) / 100;
    const anos = Math.max(1, Math.min(50, parseInt(anosProjecao, 10) || 10));
    const pmt = Math.max(0, parseFloat(aporteFuturoManual) || 0);
    const totalMeses = anos * 12;

    let montante = pv;
    let totalInvestidoAcumulado = pv;

    const serieAnos = [
      {
        anoLabel: 'Início',
        anoNum: 0,
        totalAportado: pv,
        jurosAcumulados: 0,
        patrimonioFinal: pv
      }
    ];

    for (let mes = 1; mes <= totalMeses; mes++) {
      montante = montante * (1 + taxa) + pmt;
      totalInvestidoAcumulado += pmt;

      if (mes % 12 === 0 || mes === totalMeses) {
        const anoNum = Math.floor(mes / 12);
        const juros = Math.max(0, montante - totalInvestidoAcumulado);
        serieAnos.push({
          anoLabel: `Ano ${anoNum}`,
          anoNum,
          totalAportado: totalInvestidoAcumulado,
          jurosAcumulados: juros,
          patrimonioFinal: montante
        });
      }
    }

    const totalAportadoFuturo = pmt * totalMeses;
    const patrimonioFinal = montante;
    const totalJuros = Math.max(0, patrimonioFinal - (pv + totalAportadoFuturo));

    return {
      serieAnos,
      totalAportadoFuturo: pv + totalAportadoFuturo,
      patrimonioFinal,
      totalJuros,
      anos,
      pmt
    };
  }, [pvAtual, taxaMensal, anosProjecao, aporteFuturoManual]);

  // Donut SVG Slices Calculation
  const donutSlices = useMemo(() => {
    const raio = 58;
    const circunferencia = 2 * Math.PI * raio;
    let offsetAcumulado = 0;

    return categoriasAgrupadas.map(item => {
      const proporcao = totalCategorias > 0 ? item.valor / totalCategorias : 0;
      const strokeDash = proporcao * circunferencia;
      const slice = {
        ...item,
        strokeDasharray: `${strokeDash} ${circunferencia}`,
        strokeDashoffset: -offsetAcumulado
      };
      offsetAcumulado += strokeDash;
      return slice;
    });
  }, [categoriasAgrupadas, totalCategorias]);

  const maxPatrimonio = useMemo(() => {
    return Math.max(...projecao.serieAnos.map(p => p.patrimonioFinal), 1);
  }, [projecao.serieAnos]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Barra de Filtro e Título do Mês */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0C1326]/70 border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Dashboard Analítico</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 font-mono font-medium">
              Tempo Real
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fluxo de caixa, despesas por categoria e simulador de patrimônio
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="filtro-mes" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Mês de Referência:
          </label>
          <select
            id="filtro-mes"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:border-slate-400 dark:focus:border-amber-400/50 transition-colors"
          >
            {mesesDisponiveis.map((m) => (
              <option key={m} value={m} className="bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100">
                {formatarMesAno(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de Resumo Mensal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-50/80 via-white to-white dark:from-emerald-500/[0.08] dark:via-[#0C1326]/70 dark:to-[#0C1326]/60 border border-emerald-200 dark:border-emerald-500/25 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(52,211,153,0.2),0_16px_36px_-6px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Entradas ({formatarMesAno(mesSelecionado).split(' de ')[0]})
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-700 dark:text-emerald-400">
            R$ {formatarBRL(totalEntradasMes)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400/80 font-medium mt-1">
            {entradasMes.length} lançamento(s)
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-rose-50/80 via-white to-white dark:from-rose-500/[0.08] dark:via-[#0C1326]/70 dark:to-[#0C1326]/60 border border-rose-200 dark:border-rose-500/25 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(251,113,133,0.2),0_16px_36px_-6px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Saídas ({formatarMesAno(mesSelecionado).split(' de ')[0]})
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-rose-700 dark:text-rose-400">
            R$ {formatarBRL(totalSaidasMes)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400/80 font-medium mt-1">
            {saidasMes.length} lançamento(s)
          </div>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl backdrop-blur-xl border shadow-sm dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.6)] ${
          saldoMes >= 0
            ? 'bg-gradient-to-b from-amber-50/80 via-white to-white dark:from-amber-500/[0.08] dark:via-[#0C1326]/70 dark:to-[#0C1326]/60 border-amber-200 dark:border-amber-500/25'
            : 'bg-gradient-to-b from-rose-50/80 via-white to-white dark:from-rose-500/[0.08] dark:via-[#0C1326]/70 dark:to-[#0C1326]/60 border-rose-200 dark:border-rose-500/25'
        }`}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Saldo do Mês
          </div>
          <div className={`text-2xl sm:text-3xl font-mono font-bold ${
            saldoMes >= 0
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-rose-700 dark:text-rose-400'
          }`}>
            R$ {formatarBRL(saldoMes)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400/80 font-medium mt-1">
            {saldoMes >= 0 ? 'Superávit no período' : 'Déficit no período'}
          </div>
        </div>
      </div>

      {/* Grid de Gráficos: Fluxo de Caixa e Despesas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gráfico de Fluxo de Caixa */}
        <section className="p-5 rounded-2xl bg-white dark:bg-[#0C1326]/70 border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Fluxo de Caixa</h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Entradas vs. Saídas em {formatarMesAno(mesSelecionado)}</span>
              </div>
              {totalEntradasMes > 0 && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  saldoMes >= 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30'
                }`}>
                  Margem: {((saldoMes / totalEntradasMes) * 100).toFixed(1)}%
                </span>
              )}
            </div>

            {totalEntradasMes === 0 && totalSaidasMes === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                Nenhum lançamento registrado neste mês.
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {/* Barra de Entradas */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      Entradas
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      R$ {formatarBRL(totalEntradasMes)}
                    </span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 dark:bg-white/[0.04] rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/[0.05]">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(8, (totalEntradasMes / Math.max(totalEntradasMes, totalSaidasMes)) * 100))}%`
                      }}
                    />
                  </div>
                </div>

                {/* Barra de Saídas */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 dark:bg-rose-400" />
                      Saídas
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      R$ {formatarBRL(totalSaidasMes)}
                    </span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 dark:bg-white/[0.04] rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/[0.05]">
                    <div
                      className="h-full bg-rose-600 dark:bg-rose-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(8, (totalSaidasMes / Math.max(totalEntradasMes, totalSaidasMes)) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Economia Líquida:</span>
            <span className={`font-mono font-bold ${saldoMes >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              R$ {formatarBRL(saldoMes)}
            </span>
          </div>
        </section>

        {/* Gráfico de Despesas por Categoria */}
        <section className="p-5 rounded-2xl bg-white dark:bg-[#0C1326]/70 border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Despesas por Categoria</h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Distribuição das saídas no mês selecionado</span>
          </div>

          {categoriasAgrupadas.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-medium">
              Nenhuma saída registrada neste mês.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* SVG Donut */}
              <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r="58"
                    className="stroke-slate-200 dark:stroke-white/[0.05]"
                    strokeWidth="14"
                    fill="none"
                  />
                  {donutSlices.map((slice, i) => (
                    <circle
                      key={i}
                      cx="70"
                      cy="70"
                      r="58"
                      stroke={slice.cor}
                      strokeWidth="14"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-700 hover:opacity-90"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Total</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                    R$ {formatarBRL(totalCategorias).split(',')[0]}
                  </span>
                </div>
              </div>

              {/* Lista de Categorias */}
              <div className="w-full space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {categoriasAgrupadas.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04]">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.cor }} />
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[130px]">{cat.nome}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono flex-shrink-0">
                      <span className="text-slate-800 dark:text-slate-200">R$ {formatarBRL(cat.valor)}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-white/[0.04] px-1.5 py-0.5 rounded font-bold">
                        {cat.porcentagem.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Projeção de Patrimônio / Juros Compostos */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0C1326]/70 border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Projeção de Patrimônio</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 font-mono">
                Juros Compostos
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulador com base no seu patrimônio real e estimativa de aportes futuros
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Patrimônio Base:</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
              R$ {formatarBRL(pvAtual)} ({numAportes} aportes)
            </span>
          </div>
        </div>

        {/* Inputs de Configuração da Projeção */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Taxa Mensal (% a.m.)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={taxaMensal}
                onChange={(e) => setTaxaMensal(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono font-semibold bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-amber-400/50"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 dark:text-slate-500 font-mono">% a.m.</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Prazo da Projeção
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="50"
                value={anosProjecao}
                onChange={(e) => setAnosProjecao(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono font-semibold bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-amber-400/50"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 dark:text-slate-500 font-mono">anos</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Aporte Futuro Mensal (R$/mês)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 dark:text-slate-500 font-mono">R$</span>
              <input
                type="number"
                step="50"
                min="0"
                value={aporteFuturoManual}
                onChange={(e) => setAporteFuturoManual(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs font-mono font-semibold bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-amber-400/50"
              />
            </div>
          </div>
        </div>

        {/* Resumo da Projeção */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
              Total Aportado Futuro
            </span>
            <span className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200">
              R$ {formatarBRL(projecao.totalAportadoFuturo)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
              Juros Compostos Ganhos
            </span>
            <span className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400">
              R$ {formatarBRL(projecao.totalJuros)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-500/10 dark:to-sky-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block mb-0.5">
              Patrimônio Final Estimado
            </span>
            <span className="text-xl font-mono font-bold text-emerald-800 dark:text-emerald-300">
              R$ {formatarBRL(projecao.patrimonioFinal)}
            </span>
          </div>
        </div>

        {/* Gráfico Visual de Barras Empilhadas Ano a Ano */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Evolução do Patrimônio no Tempo</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#6366F1]" />
                Total Aportado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#059669]" />
                Juros Compostos
              </span>
            </div>
          </div>

          <div className="h-56 w-full flex items-end gap-2 pt-6 pb-2 px-2 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] rounded-xl overflow-x-auto">
            {projecao.serieAnos.map((item, idx) => {
              const alturaTotalPct = (item.patrimonioFinal / maxPatrimonio) * 100;
              const pctAportado = item.patrimonioFinal > 0 ? (item.totalAportado / item.patrimonioFinal) * 100 : 100;
              const pctJuros = 100 - pctAportado;

              return (
                <div key={idx} className="flex-1 min-w-[48px] flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip ao passar o mouse */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white dark:bg-[#111827] text-[10px] font-mono p-1.5 rounded-lg border border-slate-700 dark:border-white/10 shadow-xl pointer-events-none z-20 whitespace-nowrap">
                    <div>{item.anoLabel}: R$ {formatarBRL(item.patrimonioFinal)}</div>
                    <div className="text-emerald-400">Juros: R$ {formatarBRL(item.jurosAcumulados)}</div>
                  </div>

                  {/* Barra Empilhada */}
                  <div
                    className="w-full max-w-[32px] rounded-t-lg overflow-hidden flex flex-col justify-end transition-all duration-500 shadow-sm group-hover:brightness-105"
                    style={{ height: `${Math.max(12, alturaTotalPct)}%` }}
                  >
                    {/* Parte de Cima: Juros (Verde) */}
                    <div
                      className="w-full bg-[#059669] transition-all"
                      style={{ height: `${pctJuros}%` }}
                    />
                    {/* Parte de Baixo: Aportes (Roxo) */}
                    <div
                      className="w-full bg-[#6366F1] transition-all"
                      style={{ height: `${pctAportado}%` }}
                    />
                  </div>

                  {/* Rótulo do Ano */}
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-2 font-mono">
                    {item.anoLabel.replace('Ano ', 'A')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
