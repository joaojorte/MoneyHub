import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, PieChart, ShieldCheck, Sparkles, Check, Trash2, ArrowUpRight, Calendar, Calculator } from 'lucide-react';
import { formatarBRL, formatarDataBR, obterDataHojeISO, gerarId } from '../../utils/formatters';
import { SlidersSection } from '../calculator/SlidersSection';
import { DistributionBar } from '../calculator/DistributionBar';

export function InvestmentsHub({ calc }) {
  // Controles da Projeção de Juros Compostos
  const [taxaMensal, setTaxaMensal] = useState('0.8');
  const [anosProjecao, setAnosProjecao] = useState('10');
  const [aporteFuturoManual, setAporteFuturoManual] = useState(() => {
    if (calc?.investimentoRecomendado && calc.investimentoRecomendado > 0) {
      return calc.investimentoRecomendado.toFixed(2);
    }
    return '500.00';
  });

  // Estado para confirmação visual de aporte efetivado
  const [aporteEfetivadoFeedback, setAporteEfetivadoFeedback] = useState(false);
  const [valorAporteManual, setValorAporteManual] = useState('');

  const pvAtual = calc?.totalInvestidoAcumulado || 0;
  const numAportes = calc?.historicoInvestimentos?.length || 0;

  // Simulação ano a ano de Juros Compostos
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

  const maxPatrimonio = useMemo(() => {
    return Math.max(...projecao.serieAnos.map(p => p.patrimonioFinal), 1);
  }, [projecao.serieAnos]);

  const handleEfetivarAporte = () => {
    const val = valorAporteManual !== '' 
      ? parseFloat(valorAporteManual) 
      : calc.investimentoRecomendado;

    if (!val || val <= 0) return;

    const ok = calc.efetivarAporte(val);
    if (ok) {
      setAporteEfetivadoFeedback(true);
      setValorAporteManual('');
      setTimeout(() => setAporteEfetivadoFeedback(false), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Cabeçalho da Hub de Investimentos */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <span>Hub de Investimentos & Patrimônio</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Planejamento estratégico de alocação 50/30/20, projeção de juros compostos e gestão de aportes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Foco no Longo Prazo</span>
          </span>
        </div>
      </div>

      {/* 4 Caixas de Métricas Principais de Investimento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/15 dark:to-teal-500/5 border border-emerald-200/80 dark:border-emerald-500/20 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Patrimônio Acumulado
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="font-mono text-xl sm:text-2xl lg:text-3xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums block">
            R$ {formatarBRL(calc.totalInvestidoAcumulado)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">
            {numAportes} {numAportes === 1 ? 'aporte realizado' : 'aportes realizados'}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Aporte Mensal Sugerido
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <span className="font-mono text-xl sm:text-2xl lg:text-3xl font-black text-amber-700 dark:text-amber-300 tabular-nums block">
            R$ {formatarBRL(calc.investimentoRecomendado)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">
            {calc.percentualInvestimento}% da base calculada
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Reserva de Emergência
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <span className="font-mono text-xl sm:text-2xl lg:text-3xl font-black text-sky-700 dark:text-sky-300 tabular-nums block">
            R$ {formatarBRL(calc.reservaRecomendada)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">
            {calc.percentualReserva}% da base calculada
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Livre / Estilo de Vida
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className="font-mono text-xl sm:text-2xl lg:text-3xl font-black text-purple-700 dark:text-purple-300 tabular-nums block">
            R$ {formatarBRL(calc.livreRecomendado)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">
            Disponível para lazer e gastos livres
          </span>
        </div>
      </div>

      {/* Grid Principal: Alocação Estratégica (Esquerda) vs Simulador de Juros Compostos (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Calibração de Sliders, Distribuição e Ação de Efetivar Aporte */}
        <div className="lg:col-span-5 space-y-6">
          <SlidersSection
            percentualInvestimento={calc.percentualInvestimento}
            onInvestimentoChange={calc.setPercentualInvestimento}
            percentualReserva={calc.percentualReserva}
            onReservaChange={calc.setPercentualReserva}
            aporteExtra={calc.aporteExtra}
            onAporteExtraChange={calc.setAporteExtra}
            investimentoRecomendado={calc.investimentoRecomendado}
            reservaRecomendada={calc.reservaRecomendada}
          />

          <DistributionBar
            investimentoRecomendado={calc.investimentoRecomendado}
            reservaRecomendada={calc.reservaRecomendada}
            livreRecomendado={calc.livreRecomendado}
            baseCalculo={calc.baseCalculo}
          />

          {/* Card de Ação: Efetivar Aporte Mensal no Patrimônio */}
          <div className="glass-panel p-5 rounded-2xl border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-500/[0.04] dark:to-transparent space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <span>💰</span>
                <span>Registrar Aporte no Patrimônio</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ao efetivar o aporte, o valor será contabilizado no seu <strong>Patrimônio Acumulado</strong> histórico e alimentará as simulações de crescimento.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Valor do Aporte a Registrar (deixe em branco para usar o recomendado):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder={`R$ ${formatarBRL(calc.investimentoRecomendado)}`}
                  value={valorAporteManual}
                  onChange={(e) => setValorAporteManual(e.target.value)}
                  className="glass-input flex-1 px-3.5 py-2.5 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400"
                />
                <button
                  type="button"
                  onClick={handleEfetivarAporte}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
                >
                  {aporteEfetivadoFeedback ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Registrado!</span>
                    </>
                  ) : (
                    <>
                      <span>+ Efetivar Aporte</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {aporteEfetivadoFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-100/90 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center animate-fadeIn flex items-center justify-center gap-2 border border-emerald-300 dark:border-emerald-500/30">
                <span>✓ Aporte registrado com sucesso no histórico de investimentos!</span>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Simulador de Juros Compostos & Curva de Crescimento */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border-slate-200/90 dark:border-white/[0.08] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-500" />
                  <span>Simulador de Juros Compostos</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Projeção do efeito exponencial dos juros sobre seu capital investido.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.05] px-3 py-1 rounded-full border border-slate-200 dark:border-white/[0.08] self-start sm:self-auto">
                Capital Atual: R$ {formatarBRL(pvAtual)}
              </span>
            </div>

            {/* Controles de Simulação */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Taxa Mensal Estimada (% a.m.)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="5.0"
                    value={taxaMensal}
                    onChange={(e) => setTaxaMensal(e.target.value)}
                    className="glass-input w-full px-3 py-1.5 text-sm font-mono font-bold text-amber-600 dark:text-amber-400"
                  />
                  <span className="text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Prazo da Projeção (Anos)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={anosProjecao}
                    onChange={(e) => setAnosProjecao(e.target.value)}
                    className="glass-input w-full px-3 py-1.5 text-sm font-mono font-bold text-sky-600 dark:text-sky-400"
                  />
                  <span className="text-xs font-bold text-slate-400">anos</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Aporte Mensal Recorrente (R$)
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={aporteFuturoManual}
                  onChange={(e) => setAporteFuturoManual(e.target.value)}
                  className="glass-input w-full px-3 py-1.5 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>

            {/* Três Métricas de Resultado da Projeção */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-1">
                  Patrimônio Final Estimado
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums block">
                  R$ {formatarBRL(projecao.patrimonioFinal)}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Após {projecao.anos} anos ({projecao.anos * 12} meses)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06]">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1">
                  Total Aportado do Bolso
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200 tabular-nums block">
                  R$ {formatarBRL(projecao.totalAportadoFuturo)}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Capital inicial + aportes mensais
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-1">
                  Total em Juros Ganhos
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums block">
                  R$ {formatarBRL(projecao.totalJuros)}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Rendimento gerado pelo tempo
                </span>
              </div>
            </div>

            {/* Gráfico de Evolução Patrimonial Ano a Ano */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Evolução do Patrimônio Ano a Ano
                </span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <span className="w-3 h-3 rounded-sm bg-slate-400 dark:bg-slate-600" />
                    <span>Aportado</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <span>Total com Juros</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {projecao.serieAnos.slice(1).map((item) => {
                  const pctTotal = (item.patrimonioFinal / maxPatrimonio) * 100;
                  const pctAportado = (item.totalAportado / maxPatrimonio) * 100;

                  return (
                    <div key={item.anoLabel} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{item.anoLabel}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 dark:text-slate-400">
                            Aportado: R$ {formatarBRL(item.totalAportado)}
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            Total: R$ {formatarBRL(item.patrimonioFinal)}
                          </span>
                        </div>
                      </div>

                      <div className="h-3.5 w-full bg-slate-200 dark:bg-black/50 rounded-full overflow-hidden flex p-0.5 border border-slate-300/80 dark:border-white/[0.08] relative">
                        {/* Barra Total com Juros */}
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(3, pctTotal))}%` }}
                        />
                        {/* Linha indicativa do Aportado */}
                        <div
                          className="absolute top-0 bottom-0 border-r-2 border-slate-900/60 dark:border-white/70"
                          style={{ left: `${Math.min(99, Math.max(2, pctAportado))}%` }}
                          title={`Aportado: R$ ${formatarBRL(item.totalAportado)}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Aportes Realizados */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border-slate-200/90 dark:border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>Histórico de Aportes Efetivados</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
              {calc.historicoInvestimentos?.length || 0}
            </span>
          </h3>

          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
            Total: R$ {formatarBRL(calc.totalInvestidoAcumulado)}
          </span>
        </div>

        {(!calc.historicoInvestimentos || calc.historicoInvestimentos.length === 0) ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
            Nenhum aporte registrado ainda. Use o botão "Efetivar Aporte" acima para registrar seus investimentos.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {calc.historicoInvestimentos.map((aporte) => (
              <div
                key={aporte.id}
                className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-3 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    {aporte.descricao || 'Aporte Mensal'}
                  </span>
                  <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatarDataBR(aporte.data)}
                  </span>
                </div>
                <span className="font-mono font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400 tabular-nums">
                  + R$ {formatarBRL(aporte.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
