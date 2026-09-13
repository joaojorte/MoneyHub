import React, { useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useFinancialCalculator } from './hooks/useFinancialCalculator';
import { StatCard } from './components/ui/StatCard';
import { IncomeForm } from './components/calculator/IncomeForm';
import { ExpenseForm } from './components/calculator/ExpenseForm';
import { SlidersSection } from './components/calculator/SlidersSection';
import { DistributionBar } from './components/calculator/DistributionBar';
import { TransactionList } from './components/history/TransactionList';
import { Dashboard } from './components/dashboard/Dashboard';
import { formatarBRL } from './utils/formatters';

export function App() {
  const [activeTab, setActiveTab] = useState('calculadora'); // 'calculadora' | 'dashboard'

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
    <div className="min-h-screen text-slate-100 selection:bg-rose-500/20 relative overflow-x-hidden">
      {/* Luzes ambiente de fundo (Glow Orbs) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[600px] left-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header com Glassmorphism Ultra-Refinado */}
      <header className="sticky top-0 z-50 bg-[#060911]/80 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <h1
              onClick={() => setActiveTab('calculadora')}
              className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-1.5 cursor-pointer select-none"
            >
              <span>Money</span>
              <span className="text-amber-400 drop-shadow-[0_0_14px_rgba(245,158,11,0.5)]">Hub</span>
            </h1>

            {/* Navegação entre Módulos */}
            <nav className="flex items-center p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('calculadora')}
                className={`px-3 sm:px-4 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === 'calculadora'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Calculadora
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 sm:px-4 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dashboard
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono">
            {usuario ? (
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <span className={`w-2 h-2 rounded-full ${statusSincronizacao === 'salvando' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} />
                <span className="truncate max-w-[130px] text-slate-300 font-semibold">{usuario.email}</span>
                {statusSincronizacao === 'salvando' && (
                  <span className="text-[10px] text-amber-300 font-bold animate-pulse hidden sm:inline">(salvando...)</span>
                )}
                {statusSincronizacao === 'salvo' && (
                  <span className="text-[10px] text-emerald-400 font-bold hidden sm:inline">✓</span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                <span className="font-semibold text-slate-300">Modo Local</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'calculadora' ? (
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
        ) : (
          <Dashboard entradas={entradas} saidas={saidas} calc={calc} />
        )}
      </main>
    </div>
  );
}
export default App;

