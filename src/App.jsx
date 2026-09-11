import React from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useFinancialCalculator } from './hooks/useFinancialCalculator';
import { StatCard } from './components/ui/StatCard';
import { IncomeForm } from './components/calculator/IncomeForm';
import { ExpenseForm } from './components/calculator/ExpenseForm';
import { SlidersSection } from './components/calculator/SlidersSection';
import { DistributionBar } from './components/calculator/DistributionBar';
import { TransactionList } from './components/history/TransactionList';
import { formatarBRL } from './utils/formatters';

export function App() {
  const {
    entradas,
    saidas,
    addEntrada,
    removeEntrada,
    addSaida,
    removeSaida,
    usuario,
    statusSincronizacao,
    metricasConsumo
  } = useTransactions();

  const calc = useFinancialCalculator(entradas, saidas);

  return (
    <div className="min-h-screen bg-background text-slate-100 selection:bg-rose-500/20">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight">
              Money<span className="text-amber-400">Hub</span>
            </h1>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              React + Tailwind
            </span>
            <span className="hidden sm:inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              ⚡ DB Otimizado (~80B/input)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            {usuario ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className={`w-2 h-2 rounded-full ${statusSincronizacao === 'salvando' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="truncate max-w-[120px]">{usuario.email}</span>
                {statusSincronizacao === 'salvando' && (
                  <span className="text-[10px] text-amber-400 animate-pulse hidden sm:inline">(salvando...)</span>
                )}
                {statusSincronizacao === 'salvo' && (
                  <span className="text-[10px] text-emerald-400 hidden sm:inline">✓</span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Modo Local / Offline</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Métricas Principais (Dashboard de Topo) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Saldo Disponível"
            value={`R$ ${formatarBRL(calc.sobraReal)}`}
            subtitle="Receitas − Despesas no mês"
            accent="brand"
            icon="💰"
          />
          <StatCard
            title="Total Entradas"
            value={`R$ ${formatarBRL(calc.totalEntradas)}`}
            subtitle={`${entradas.length} lançamento(s)`}
            accent="income"
            icon="📈"
          />
          <StatCard
            title="Total Saídas"
            value={`R$ ${formatarBRL(calc.totalSaidas)}`}
            subtitle={`${saidas.length} lançamento(s)`}
            accent="expense"
            icon="📉"
          />
          <StatCard
            title="Investimento Acumulado"
            value={`R$ ${formatarBRL(calc.totalInvestidoAcumulado)}`}
            subtitle={`${calc.historicoInvestimentos.length} aporte(s)`}
            accent="income"
            icon="🛡️"
          />
        </section>

        {/* Formulários de Lançamento (Grid 2 colunas) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <IncomeForm onAddIncome={addEntrada} />
          <ExpenseForm onAddExpense={addSaida} />
        </section>

        {/* Planejamento, Sliders e Distribuição */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
        </section>

        {/* Históricos de Lançamentos */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TransactionList
            titulo="Extrato de Entradas"
            items={entradas}
            tipo="entrada"
            onRemove={removeEntrada}
            emptyMessage="Nenhuma entrada registrada ainda."
          />
          <TransactionList
            titulo="Extrato de Saídas"
            items={saidas}
            tipo="saida"
            onRemove={removeSaida}
            emptyMessage="Nenhuma saída registrada ainda."
          />
        </section>
      </main>
    </div>
  );
}
export default App;
