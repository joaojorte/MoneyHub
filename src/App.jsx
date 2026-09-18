import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { useTransactions } from './hooks/useTransactions';
import { useFinancialCalculator } from './hooks/useFinancialCalculator';
import { useTheme } from './hooks/useTheme';
import { StatCard } from './components/ui/StatCard';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { IncomeForm } from './components/calculator/IncomeForm';
import { ExpenseForm } from './components/calculator/ExpenseForm';
import { SlidersSection } from './components/calculator/SlidersSection';
import { DistributionBar } from './components/calculator/DistributionBar';
import { TransactionList } from './components/history/TransactionList';
import { Dashboard } from './components/dashboard/Dashboard';
import { CreditCardDashboard } from './components/cards/CreditCardDashboard';
import { formatarBRL } from './utils/formatters';

export function App() {
  const [activeTab, setActiveTab] = useState('calculadora'); // 'calculadora' | 'dashboard' | 'cartoes'
  const { isDark, toggleTheme } = useTheme();

  const {
    entradas,
    saidas,
    addEntrada,
    removeEntrada,
    addSaida,
    removeSaida,
    usuario,
    statusSincronizacao
  } = useTransactions();

  const calc = useFinancialCalculator(entradas, saidas);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080D1A] text-slate-800 dark:text-slate-100 selection:bg-rose-500/20 relative overflow-x-hidden transition-colors duration-200">
      {/* Luzes ambiente de fundo discretas */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[600px] left-10 w-96 h-96 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#060911]/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <h1
              onClick={() => setActiveTab('calculadora')}
              className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span className="text-slate-900 dark:text-white">Money</span>
              <span className="text-amber-500 dark:text-amber-400">Hub</span>
            </h1>

            {/* Navegação entre Módulos */}
            <nav className="flex items-center p-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('calculadora')}
                className={`px-2.5 sm:px-3.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === 'calculadora'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300/80 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Calculadora
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`px-2.5 sm:px-3.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300/80 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cartoes')}
                className={`px-2.5 sm:px-3.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === 'cartoes'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300/80 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cartões</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 text-xs font-mono">
              {usuario ? (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${statusSincronizacao === 'salvando' ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 dark:bg-emerald-400'}`} />
                  <span className="truncate max-w-[130px] text-slate-700 dark:text-slate-300 font-semibold">{usuario.email}</span>
                  {statusSincronizacao === 'salvando' && (
                    <span className="text-[10px] text-amber-500 dark:text-amber-300 font-bold animate-pulse hidden sm:inline">(salvando...)</span>
                  )}
                  {statusSincronizacao === 'salvo' && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">✓</span>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-400 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Modo Local</span>
                </span>
              )}
            </div>

            {/* Botão de Toggle Claro / Escuro */}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'calculadora' && (
          <>
            {/* Métricas Principais */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                title="Saldo Disponível"
                value={`R$ ${formatarBRL(calc.sobraReal)}`}
                accent="brand"
              />
              <StatCard
                title="Total Entradas"
                value={`R$ ${formatarBRL(calc.totalEntradas)}`}
                subtitle={`${entradas.length} lançamento(s)`}
                accent="income"
              />
              <StatCard
                title="Total Saídas"
                value={`R$ ${formatarBRL(calc.totalSaidas)}`}
                subtitle={`${saidas.length} lançamento(s)`}
                accent="expense"
              />
              <StatCard
                title="Investimento Acumulado"
                value={`R$ ${formatarBRL(calc.totalInvestidoAcumulado)}`}
                subtitle={`${calc.historicoInvestimentos.length} aporte(s)`}
                accent="income"
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
          </>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard entradas={entradas} saidas={saidas} calc={calc} />
        )}

        {activeTab === 'cartoes' && (
          <CreditCardDashboard saidas={saidas} onRemoveSaida={removeSaida} />
        )}
      </main>
    </div>
  );
}
export default App;

