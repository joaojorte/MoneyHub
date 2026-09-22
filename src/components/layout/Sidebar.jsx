import React from 'react';
import { LayoutDashboard, Calculator, TrendingUp } from 'lucide-react';

export function Sidebar({ activeTab, onSelectTab }) {
  const navItems = [
    {
      id: 'calculadora',
      label: 'Lançamentos',
      subtitle: 'Entradas, Saídas & Fluxo',
      icon: Calculator,
      activeColor: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      subtitle: 'Visão Geral & Cartões',
      icon: LayoutDashboard,
      activeColor: 'bg-[#0e4b6c] text-white shadow-lg shadow-[#0e4b6c]/30'
    },
    {
      id: 'investimentos',
      label: 'Investimentos',
      subtitle: 'Patrimônio & Juros',
      icon: TrendingUp,
      activeColor: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
    }
  ];

  return (
    <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 sticky top-24 self-start flex flex-col justify-between p-4 sm:p-5 glass-panel rounded-[28px] border-slate-200/90 dark:border-white/[0.08] shadow-md bg-white/70 dark:bg-[#060911]/80 backdrop-blur-xl">
      <div className="space-y-6">
        {/* Título de Navegação */}
        <div className="px-2 pt-1 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navegação Principal
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Lista de Abas / Hubs verticais */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left font-bold transition-all duration-200 cursor-pointer select-none group ${
                  isActive
                    ? `${item.activeColor} scale-[1.02]`
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 group-hover:scale-110 group-hover:text-slate-800 dark:group-hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block text-sm sm:text-base font-extrabold tracking-tight truncate leading-tight">
                    {item.label}
                  </span>
                  <span
                    className={`block text-[11px] font-medium truncate mt-0.5 ${
                      isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {item.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
