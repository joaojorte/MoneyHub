import React, { useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useFinancialCalculator } from './hooks/useFinancialCalculator';
import { useTheme } from './hooks/useTheme';
import { StatCard } from './components/ui/StatCard';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { IncomeForm } from './components/calculator/IncomeForm';
import { ExpenseForm } from './components/calculator/ExpenseForm';
import { TransactionList } from './components/history/TransactionList';
import { UnifiedDashboard } from './components/dashboard/UnifiedDashboard';
import { InvestmentsHub } from './components/investments/InvestmentsHub';
import { Sidebar } from './components/layout/Sidebar';
import { formatarBRL, formatarDataBR, obterDataHojeISO } from './utils/formatters';
import { LayoutDashboard, Calculator, TrendingUp } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'calculadora' | 'investimentos'
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

  // Data de hoje formatada por extenso para a saudação
  const hojeFormatado = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080D1A] text-slate-800 dark:text-slate-100 selection:bg-rose-500/20 relative overflow-x-hidden transition-colors duration-200">
      {/* Luzes ambiente de fundo discretas */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[600px] left-10 w-[500px] h-[500px] bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Global: Saudação na Esquerda e Logo no CANTO SUPERIOR DIREITO */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#060911]/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Saudação e Data no canto esquerdo (Conforme Modelo Behance ZIXO) */}
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Olá! Bem-vindo ao MoneyHub
              </h2>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 capitalize font-medium">
                {hojeFormatado}
              </span>
            </div>
          </div>

          {/* Abas Mobile (Apenas em telas pequenas) */}
          <div className="flex lg:hidden items-center p-1 bg-slate-100 dark:bg-white/[0.05] rounded-xl border border-slate-200 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow dark:bg-sky-500/20 dark:text-sky-300'
                  : 'text-slate-500'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calculadora')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'calculadora'
                  ? 'bg-white text-slate-900 shadow dark:bg-amber-500/20 dark:text-amber-300'
                  : 'text-slate-500'
              }`}
            >
              Calculadora
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('investimentos')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'investimentos'
                  ? 'bg-white text-slate-900 shadow dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'text-slate-500'
              }`}
            >
              Investimentos
            </button>
          </div>

          {/* LOGO NO CANTO SUPERIOR DIREITO (Conforme solicitado pelo usuário) */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <h1
              onClick={() => setActiveTab('dashboard')}
              className="text-2xl sm:text-3xl font-black tracking-tight flex items-center cursor-pointer select-none transition-transform hover:scale-105"
            >
              <span className="text-slate-900 dark:text-white">Money</span>
              <span className="text-amber-500 dark:text-amber-400">Hub</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Layout Principal: Sidebar à Esquerda e Conteúdo ao Centro/Direita */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 items-start">
        
        {/* NAVEGAÇÃO ENTRE HUBS NA ESQUERDA (Desktop Sidebar) */}
        <div className="hidden lg:block sticky top-28">
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            usuario={usuario}
            statusSincronizacao={statusSincronizacao}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
        </div>

        {/* WORKSPACE CENTRAL / PRINCIPAL */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          {/* HUB UNIFICADA: DASHBOARD & CARTÕES FUSIONADOS (MODEL.PDF) */}
          {activeTab === 'dashboard' && (
            <UnifiedDashboard
              entradas={entradas}
              saidas={saidas}
              calc={calc}
              onRemoveSaida={removeSaida}
            />
          )}

          {/* HUB CALCULADORA: LANÇAMENTOS E EXTRATOS */}
          {activeTab === 'calculadora' && (
            <div className="space-y-6 animate-fadeIn pb-10">
              {/* Métricas Resumidas da Calculadora */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
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
                  title="Resultado Líquido"
                  value={`R$ ${formatarBRL(calc.totalEntradas - calc.totalSaidas)}`}
                  subtitle="Receitas − Despesas"
                  accent={calc.totalEntradas >= calc.totalSaidas ? 'income' : 'expense'}
                />
              </section>

              {/* Formulários de Lançamento (Grid 2 colunas) */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <IncomeForm onAddIncome={addEntrada} />
                <ExpenseForm onAddExpense={addSaida} saidas={saidas} />
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
            </div>
          )}

          {/* HUB ESPECÍFICA DE INVESTIMENTOS */}
          {activeTab === 'investimentos' && (
            <InvestmentsHub calc={calc} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
