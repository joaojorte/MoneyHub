import React, { useState } from 'react';
import { CATEGORIAS_SAIDA, CATEGORIA_SAIDA_PADRAO } from '../../utils/constants';
import { SegmentedControl } from '../ui/SegmentedControl';
import { DateChips } from '../ui/DateChips';
import { DueDateBadge } from '../ui/DueDateBadge';
import { Button } from '../ui/Button';
import { useDateChips } from '../../hooks/useDateChips';
import { useCreditCardDue } from '../../hooks/useCreditCardDue';
import { gerarLancamentosParcelados, projetarDataVencimentoCartao } from '../../utils/cashflow';
import { gerarId } from '../../utils/formatters';

export function ExpenseForm({ onAddExpense }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('Alimentação');
  const [detalhamento, setDetalhamento] = useState('');
  const [isDelivery, setIsDelivery] = useState(false);
  
  // Forma de Pagamento e Frequência
  const [formaPagamento, setFormaPagamento] = useState('pix_debito_dinheiro');
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [isParcelado, setIsParcelado] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState(3);

  // Hooks dedicados
  const dateChips = useDateChips();
  const cardDue = useCreditCardDue();

  const isCartao = formaPagamento === 'cartao_credito';

  const handleSubmit = (e) => {
    e.preventDefault();
    const numValor = parseFloat(valor);
    if (!numValor || numValor <= 0) return;

    if (categoria === 'Outros' && !detalhamento.trim()) return;

    let diaVenc = 10;
    if (isCartao) {
      diaVenc = cardDue.salvarDia(cardDue.inputDia || cardDue.diaVencimento);
    }

    const dataTransacao = dateChips.dataEfetiva;
    const dataPagamentoInicial = isCartao
      ? projetarDataVencimentoCartao(dataTransacao, diaVenc, 0)
      : dataTransacao;

    if (isCartao && isParcelado) {
      // Gera parcelas individuais com projeção no fluxo de caixa
      const parcelas = gerarLancamentosParcelados({
        descricao: descricao.trim() || 'Despesa Parcelada',
        valorTotal: numValor,
        categoria,
        dataBase: dataTransacao,
        formaPagamento,
        diaVencimento: diaVenc,
        quantidadeParcelas: qtdParcelas,
        detalhamento: categoria === 'Outros' ? detalhamento.trim() : '',
        conveniencia: categoria === 'Alimentação' ? isDelivery : false
      });
      onAddExpense(parcelas);
    } else {
      // Lançamento individual (Único ou Recorrente / Assinatura)
      const novoItem = {
        id: gerarId(),
        descricao: descricao.trim() || 'Saída',
        valor: numValor,
        categoria,
        data: dataTransacao,
        data_pagamento: dataPagamentoInicial,
        forma_pagamento: formaPagamento,
        frequencia: isRecorrente ? 'fixo' : 'unico',
        recorrente: isRecorrente
      };

      if (isCartao) {
        novoItem.dia_vencimento = diaVenc;
        novoItem.mes_fatura = dataPagamentoInicial.slice(0, 7);
      }

      if (categoria === 'Outros' && detalhamento.trim()) {
        novoItem.detalhamento = detalhamento.trim();
      }

      if (categoria === 'Alimentação') {
        novoItem.conveniencia = isDelivery;
      }

      onAddExpense(novoItem);
    }

    // Reset para o estado padrão limpo
    setDescricao('');
    setValor('');
    setCategoria(CATEGORIA_SAIDA_PADRAO);
    setDetalhamento('');
    setIsDelivery(false);
    setIsParcelado(false);
    setIsRecorrente(false);
    setFormaPagamento('pix_debito_dinheiro');
    dateChips.resetar();
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-4 sm:p-5 space-y-4 border-rose-200 dark:border-rose-500/20 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(251,113,133,0.15),0_16px_36px_-6px_rgba(0,0,0,0.55)]">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
        <h2 className="text-sm font-semibold tracking-wide text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-400/40 flex items-center justify-center text-xs font-bold leading-none text-rose-700 dark:text-rose-300">−</span>
          <span>Nova Saída</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Descrição (ex.: Gasto com cinema, Supermercado)"
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
          className="glass-input px-3.5 py-2.5 text-sm font-mono font-bold tabular-nums tracking-tight text-rose-600 dark:text-rose-300 placeholder:text-slate-400 dark:placeholder:text-slate-600"
          required
        />
      </div>

      {/* Segmented Chips de Categoria em Formato de Pílula */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIAS_SAIDA.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoria(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 select-none border ${
              categoria === cat 
                ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-400/40 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] hover:bg-slate-200/60 dark:hover:bg-white/[0.06]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Condicional: Outros -> Detalhamento */}
      {categoria === 'Outros' && (
        <input
          type="text"
          placeholder="Especifique a saída (obrigatório)"
          value={detalhamento}
          onChange={(e) => setDetalhamento(e.target.value)}
          className="glass-input w-full px-3.5 py-2 text-xs border-amber-300 dark:border-amber-500/30"
          required
          autoFocus
        />
      )}

      {/* Condicional: Alimentação -> Mercado vs Delivery */}
      {categoria === 'Alimentação' && (
        <SegmentedControl
          label="Modalidade de Alimentação"
          value={isDelivery ? 'delivery' : 'mercado'}
          onChange={(v) => setIsDelivery(v === 'delivery')}
          accent="brand"
          options={[
            { value: 'mercado', label: 'Mercado', icon: '🛒' },
            { value: 'delivery', label: 'Pronto / Delivery', icon: '🛵' }
          ]}
        />
      )}

      {/* Forma de Pagamento */}
      <SegmentedControl
        label="Forma de Pagamento"
        value={formaPagamento}
        onChange={(v) => {
          setFormaPagamento(v);
          if (v !== 'cartao_credito') setIsParcelado(false);
        }}
        accent={isCartao ? 'expense' : 'income'}
        options={[
          { value: 'pix_debito_dinheiro', label: 'PIX / Débito', icon: '⚡' },
          { value: 'cartao_credito', label: 'Cartão de Crédito', icon: '💳' }
        ]}
      />

      {/* Toggles discretos de Frequência em formato de pílula */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setIsRecorrente(!isRecorrente);
            if (!isRecorrente) setIsParcelado(false);
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all select-none ${
            isRecorrente 
              ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-400/40 font-bold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/[0.02] hover:bg-slate-200/60 dark:hover:bg-white/[0.05]'
          }`}
        >
          🔁 Tornar Recorrente (Assinatura)
        </button>

        {isCartao && (
          <button
            type="button"
            onClick={() => {
              setIsParcelado(!isParcelado);
              if (!isParcelado) setIsRecorrente(false);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all select-none ${
              isParcelado 
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/[0.02] hover:bg-slate-200/60 dark:hover:bg-white/[0.05]'
            }`}
          >
            💳 Parcelar
          </button>
        )}
      </div>

      {/* Bloco Condicional de Cartão (Vencimento & Parcelas) */}
      {isCartao && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <DueDateBadge
            diaVencimento={cardDue.diaVencimento}
            modoEdicao={cardDue.modoEdicao}
            onAbrirEdicao={cardDue.abrirEdicao}
            inputDia={cardDue.inputDia}
            onInputDiaChange={cardDue.setInputDia}
            onSalvar={cardDue.salvarDia}
          />

          {isParcelado && (
            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-slate-50 dark:bg-[#04070F]/70 backdrop-blur-md border border-amber-200 dark:border-amber-400/30 rounded-full">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Parcelamento:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="2"
                  max="72"
                  value={qtdParcelas}
                  onChange={(e) => setQtdParcelas(Math.max(2, parseInt(e.target.value, 10) || 2))}
                  className="w-12 text-center font-mono font-bold text-sm bg-white dark:bg-black/60 border border-slate-300 dark:border-white/20 rounded-full py-0.5 text-amber-700 dark:text-amber-300 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400/80">x</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barra de Ações Inferior */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
        <DateChips
          opcao={dateChips.opcao}
          onSelectOpcao={dateChips.setOpcao}
          dataManual={dateChips.dataManual}
          onDataManualChange={dateChips.setDataManual}
          accent="expense"
        />
        <Button type="submit" variant="expense" size="md">
          + Incluir Saída
        </Button>
      </div>
    </form>
  );
}
