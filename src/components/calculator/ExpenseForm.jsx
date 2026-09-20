import React, { useState } from 'react';
import { CATEGORIAS_SAIDA, CATEGORIA_SAIDA_PADRAO } from '../../utils/constants';
import { SegmentedControl } from '../ui/SegmentedControl';
import { DateChips } from '../ui/DateChips';
import { Button } from '../ui/Button';
import { useDateChips } from '../../hooks/useDateChips';
import { useCreditCardDue } from '../../hooks/useCreditCardDue';
import { gerarLancamentosParcelados, projetarDataVencimentoCartao } from '../../utils/cashflow';
import { gerarId, formatarBRL } from '../../utils/formatters';

export function ExpenseForm({ onAddExpense }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('Alimentação');
  const [detalhamento, setDetalhamento] = useState('');
  const [isDelivery, setIsDelivery] = useState(false);
  
  // Forma de Pagamento e Modalidades do Cartão
  const [formaPagamento, setFormaPagamento] = useState('pix_debito_dinheiro');
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [isParcelado, setIsParcelado] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState(3);
  const [parcelaAtual, setParcelaAtual] = useState(1);
  const [tipoValorParcelado, setTipoValorParcelado] = useState('total'); // 'total' | 'parcela'
  const [isFaturaTotal, setIsFaturaTotal] = useState(false);

  // Hooks dedicados
  const dateChips = useDateChips();
  const cardDue = useCreditCardDue();

  const isCartao = formaPagamento === 'cartao_credito';

  const handleSubmit = (e) => {
    e.preventDefault();
    const numValor = parseFloat(valor);
    if (!numValor || numValor <= 0) return;

    if (categoria === 'Outros' && !detalhamento.trim()) return;

    const diaVenc = cardDue.diaVencimento || 10;
    const dataTransacao = dateChips.dataEfetiva;
    const dataPagamentoInicial = isCartao
      ? projetarDataVencimentoCartao(dataTransacao, diaVenc, 0)
      : dataTransacao;

    if (isCartao && isFaturaTotal) {
      // Lançamento do Valor Total Fechado da Fatura do Mês (Conciliação)
      const novoItem = {
        id: gerarId(),
        descricao: descricao.trim() || 'Fatura do Cartão de Crédito',
        valor: numValor,
        categoria: 'Fatura de Cartão',
        data: dataTransacao,
        data_pagamento: dataPagamentoInicial,
        forma_pagamento: 'cartao_credito',
        dia_vencimento: diaVenc,
        mes_fatura: dataPagamentoInicial.slice(0, 7),
        frequencia: 'unico',
        recorrente: false,
        isFaturaTotal: true
      };
      onAddExpense(novoItem);
    } else if (isCartao && isParcelado) {
      // Gera parcelas individuais com projeção no fluxo de caixa (inclusive em andamento)
      const parcelas = gerarLancamentosParcelados({
        descricao: descricao.trim() || 'Despesa Parcelada',
        valorTotal: tipoValorParcelado === 'total' ? numValor : (numValor * qtdParcelas),
        valorPorParcela: tipoValorParcelado === 'parcela' ? numValor : null,
        categoria,
        dataBase: dataTransacao,
        formaPagamento,
        diaVencimento: diaVenc,
        quantidadeParcelas: qtdParcelas,
        parcelaInicial: parcelaAtual,
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
    setParcelaAtual(1);
    setTipoValorParcelado('total');
    setIsFaturaTotal(false);
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
          placeholder={isFaturaTotal ? "Descrição (ex.: Fatura Cartão Nubank)" : "Descrição (ex.: Gasto com cinema, Supermercado)"}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="glass-input px-3.5 py-2.5 text-sm"
        />
        <input
          type="number"
          step="0.01"
          placeholder={isCartao && isParcelado && tipoValorParcelado === 'parcela' ? "R$ Valor da Parcela" : "R$ 0,00"}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="glass-input px-3.5 py-2.5 text-sm font-mono font-bold tabular-nums tracking-tight text-rose-600 dark:text-rose-300 placeholder:text-slate-400 dark:placeholder:text-slate-600"
          required
        />
      </div>

      {/* Segmented Chips de Categoria em Formato de Pílula */}
      {!isFaturaTotal && (
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
      )}

      {/* Condicional: Outros -> Detalhamento */}
      {categoria === 'Outros' && !isFaturaTotal && (
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
      {categoria === 'Alimentação' && !isFaturaTotal && (
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
          if (v !== 'cartao_credito') {
            setIsParcelado(false);
            setIsFaturaTotal(false);
          }
        }}
        accent={isCartao ? 'expense' : 'income'}
        options={[
          { value: 'pix_debito_dinheiro', label: 'PIX / Débito', icon: '⚡' },
          { value: 'cartao_credito', label: 'Cartão de Crédito', icon: '💳' }
        ]}
      />

      {/* Toggles discretos de Frequência e Modalidade de Cartão */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setIsRecorrente(!isRecorrente);
            if (!isRecorrente) {
              setIsParcelado(false);
              setIsFaturaTotal(false);
            }
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
          <>
            <button
              type="button"
              onClick={() => {
                setIsParcelado(!isParcelado);
                if (!isParcelado) {
                  setIsRecorrente(false);
                  setIsFaturaTotal(false);
                }
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all select-none ${
                isParcelado 
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/[0.02] hover:bg-slate-200/60 dark:hover:bg-white/[0.05]'
              }`}
            >
              💳 Parcelar Compra
            </button>

            <button
              type="button"
              onClick={() => {
                const novoEstado = !isFaturaTotal;
                setIsFaturaTotal(novoEstado);
                if (novoEstado) {
                  setIsParcelado(false);
                  setIsRecorrente(false);
                  if (!descricao.trim()) setDescricao('Fatura do Cartão de Crédito');
                }
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all select-none ${
                isFaturaTotal 
                  ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-400/40 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/[0.02] hover:bg-slate-200/60 dark:hover:bg-white/[0.05]'
              }`}
              title="Lançar o valor fechado da fatura para impacto de caixa e conciliar os gastos detalhados"
            >
              📑 Total da Fatura (Conciliação)
            </button>
          </>
        )}
      </div>

      {/* Banner Informativo quando Fatura Total está ativa */}
      {isCartao && isFaturaTotal && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50/80 to-amber-50/60 dark:from-rose-500/10 dark:to-amber-500/10 border border-rose-200 dark:border-rose-500/30 text-xs sm:text-sm text-slate-700 dark:text-slate-200 flex items-start gap-3">
          <span className="text-xl leading-none">📑</span>
          <div className="space-y-1">
            <span className="font-bold text-rose-700 dark:text-rose-300 block">Lançamento de Fatura Fechada:</span>
            <p className="text-slate-600 dark:text-slate-300">
              Este valor representará o compromisso real de caixa no mês. Os demais lançamentos de cartão de crédito servirão para <strong>conciliar e detalhar exatamente onde você gastou</strong>, sem duplicar o valor no seu saldo.
            </p>
          </div>
        </div>
      )}

      {/* Bloco Avançado de Parcelamento (Inclusive Parcelas em Andamento) */}
      {isCartao && isParcelado && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-amber-300/80 dark:border-amber-500/30 space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400">Configuração do Parcelamento</span>
              {parcelaAtual > 1 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-400/40">
                  Em andamento
                </span>
              )}
            </div>

            {/* Toggle: Valor Total vs Valor por Parcela */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-black/40 rounded-xl border border-slate-300/70 dark:border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setTipoValorParcelado('total')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  tipoValorParcelado === 'total'
                    ? 'bg-white dark:bg-amber-500/20 text-slate-900 dark:text-amber-300 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Valor Total
              </button>
              <button
                type="button"
                onClick={() => setTipoValorParcelado('parcela')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  tipoValorParcelado === 'parcela'
                    ? 'bg-white dark:bg-amber-500/20 text-slate-900 dark:text-amber-300 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Valor por Parcela
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Total de Parcelas */}
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Total de parcelas:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="2"
                  max="72"
                  value={qtdParcelas}
                  onChange={(e) => {
                    const v = Math.max(2, parseInt(e.target.value, 10) || 2);
                    setQtdParcelas(v);
                    if (parcelaAtual > v) setParcelaAtual(v);
                  }}
                  className="w-14 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-white/[0.05] border border-slate-300 dark:border-white/20 rounded-lg py-1 text-amber-700 dark:text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">x</span>
              </div>
            </div>

            {/* Parcela Atual que Vence Agora */}
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Parcela deste mês:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max={qtdParcelas}
                  value={parcelaAtual}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(qtdParcelas, parseInt(e.target.value, 10) || 1));
                    setParcelaAtual(v);
                  }}
                  className="w-14 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-white/[0.05] border border-slate-300 dark:border-white/20 rounded-lg py-1 text-amber-700 dark:text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <span className="text-xs font-semibold text-slate-400">de {qtdParcelas}</span>
              </div>
            </div>
          </div>

          {/* Resumo Dinâmico em Tempo Real */}
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium pt-1 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center gap-2">
            <span className="text-amber-500 font-bold text-base leading-none">ℹ️</span>
            <span>
              {parcelaAtual === 1 ? (
                <>
                  Serão geradas <strong>{qtdParcelas} parcelas</strong> de{' '}
                  <strong className="text-amber-700 dark:text-amber-400 font-mono">
                    R$ {formatarBRL(tipoValorParcelado === 'parcela' ? (parseFloat(valor) || 0) : ((parseFloat(valor) || 0) / qtdParcelas))}
                  </strong>{' '}
                  a partir deste mês.
                </>
              ) : (
                <>
                  Compra em andamento: gerando <strong>{qtdParcelas - parcelaAtual + 1} parcelas restantes</strong> (da <strong>{parcelaAtual}/{qtdParcelas}</strong> até <strong>{qtdParcelas}/{qtdParcelas}</strong>) de{' '}
                  <strong className="text-amber-700 dark:text-amber-400 font-mono">
                    R$ {formatarBRL(tipoValorParcelado === 'parcela' ? (parseFloat(valor) || 0) : ((parseFloat(valor) || 0) / qtdParcelas))}
                  </strong>{' '}
                  cada.
                </>
              )}
            </span>
          </div>
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
