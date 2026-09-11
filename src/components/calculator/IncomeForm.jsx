import React, { useState } from 'react';
import { CATEGORIAS_ENTRADA, CATEGORIA_ENTRADA_PADRAO } from '../../utils/constants';
import { DateChips } from '../ui/DateChips';
import { Button } from '../ui/Button';
import { useDateChips } from '../../hooks/useDateChips';
import { gerarId } from '../../utils/formatters';

export function IncomeForm({ onAddIncome }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIA_ENTRADA_PADRAO);

  const dateChips = useDateChips();

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseFloat(valor);
    if (!num || num <= 0) return;

    onAddIncome({
      id: gerarId(),
      descricao: descricao.trim() || 'Entrada',
      valor: num,
      categoria,
      data: dateChips.dataEfetiva
    });

    setDescricao('');
    setValor('');
    setCategoria(CATEGORIA_ENTRADA_PADRAO);
    dateChips.resetar();
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <h2 className="text-sm font-semibold tracking-wide text-emerald-400 flex items-center gap-2">
          <span className="text-base font-bold">+</span> Nova Entrada
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Descrição (ex.: Salário, Rendimentos)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="glass-input px-3.5 py-2.5 text-sm"
        />
        <input
          type="number"
          step="0.01"
          placeholder="R$ 0,00"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="glass-input px-3.5 py-2.5 text-sm font-mono font-bold tabular-nums"
          required
        />
      </div>

      {/* Segmented Chips de Categoria */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIAS_ENTRADA.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoria(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 select-none ${
              categoria === cat 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glow-income'
                : 'text-slate-400 hover:text-white bg-surface-inset border border-transparent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Barra de Ações: Data rápida + Botão */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-subtle">
        <DateChips
          opcao={dateChips.opcao}
          onSelectOpcao={dateChips.setOpcao}
          dataManual={dateChips.dataManual}
          onDataManualChange={dateChips.setDataManual}
          accent="income"
        />
        <Button type="submit" variant="primary" size="md">
          + Incluir Entrada
        </Button>
      </div>
    </form>
  );
}
