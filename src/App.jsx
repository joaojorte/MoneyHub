import React, { useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useFinancialCalculator } from './hooks/useFinancialCalculator';
import { useTheme } from './hooks/useTheme';
import { StatCard } from './components/ui/StatCard';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { UnifiedTransactionHub } from './components/calculator/UnifiedTransactionHub';
import { UnifiedDashboard } from './components/dashboard/UnifiedDashboard';
import { InvestmentsHub } from './components/investments/InvestmentsHub';
import { Sidebar } from './components/layout/Sidebar';
import { formatarBRL } from './utils/formatters';
import { Cloud } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('calculadora'); // 'calculadora' (Lançamentos) | 'dashboard' | 'investimentos'
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
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[600px] left-10 w-[500px] h-[500px] bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Global: Logo APENAS no Canto Superior Esquerdo | Login e Modo de Página no Canto Superior Direito */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#060911]/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* CANTO SUPERIOR ESQUERDO: APENAS A LOGO (Conforme solicitado) */}
          <div className="flex items-center gap-3">
            <h1
              onClick={() => setActiveTab('calculadora')}
              className="text-2xl sm:text-3xl font-black tracking-tight flex items-center cursor-pointer select-none transition-transform hover:scale-105"
            >
              <span className="text-slate-900 dark:text-white">Money</span>
              <span className="text-amber-500 dark:text-amber-400">Hub</span>
            </h1>
          </div>

          {/* Abas Mobile (Lançamentos em 1º, Dashboard em 2º, Investimentos em 3º) */}
          <div className="flex lg:hidden items-center p-1 bg-slate-100 dark:bg-white/[0.05] rounded-xl border border-slate-200 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('calculadora')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'calculadora'
                  ? 'bg-white text-slate-900 shadow dark:bg-amber-500/20 dark:text-amber-300'
                  : 'text-slate-500'
              }`}
            >
              Lançamentos
            </button>
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

          {/* CANTO SUPERIOR DIREITO: INFORMAÇÕES DE LOGIN E MODO DA PÁGINA (CLARO/ESCURO) */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Informações de Login / E-mail */}
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-mono">
              {usuario ? (
                <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusSincronizacao === 'salvando' ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 dark:bg-emerald-400'}`} />
                  <span className="truncate max-w-[150px] sm:max-w-[200px] text-slate-700 dark:text-slate-300 font-semibold">{usuario.email}</span>
                  {statusSincronizacao === 'salvando' && (
                    <span className="text-xs text-amber-500 dark:text-amber-300 font-bold animate-pulse hidden sm:inline">(salvando...)</span>
                  )}
                  {statusSincronizacao === 'salvo' && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">✓</span>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                  <span className="font-semibold">Modo Local</span>
                </span>
              )}
            </div>

            {/* Modo da página (escuro/claro) */}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
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
              usuario={usuario}
              onRemoveSaida={removeSaida}
            />
          )}

          {/* HUB CALCULADORA: NOVO MODELO DE LANÇAMENTOS E DASHBOARDS GERAIS */}
          {activeTab === 'calculadora' && (
            <UnifiedTransactionHub
              entradas={entradas}
              saidas={saidas}
              addEntrada={addEntrada}
              removeEntrada={removeEntrada}
              addSaida={addSaida}
              removeSaida={removeSaida}
              calc={calc}
              usuario={usuario}
            />
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
