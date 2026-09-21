import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Minus, X, CreditCard, ArrowDownRight, ArrowUpRight, 
  Calendar, Check, AlertCircle, ShoppingBag, Utensils, Zap
} from 'lucide-react';
import { 
  CATEGORIAS_ENTRADA, CATEGORIA_ENTRADA_PADRAO,
  CATEGORIAS_SAIDA, CATEGORIA_SAIDA_PADRAO 
} from '../../utils/constants';
import { useDateChips } from '../../hooks/useDateChips';
import { useCreditCards } from '../../hooks/useCreditCards';
import { gerarLancamentosParcelados, projetarDataVencimentoCartao } from '../../utils/cashflow';
import { gerarId, formatarBRL } from '../../utils/formatters';

const ICONES_CATEGORIAS = {
  'Alimentação': '🍽️',
  'Mercado': '🛒',
  'Transporte': '🚗',
  'Saúde': '🏥',
  'Educação': '📚',
  'Comunicação': '📱',
  'Compras': '🛍️',
  'Serviços': '⚙️',
  'Transferências/Pagamentos pessoais': '💸',
  'Outros': '📦',
  'Não identificado': '🏷️',
  'Salário': '💼',
  'Dividendos': '📈',
  'Rendimentos': '🌱',
  'Estorno/Devolução': '↩️'
};

export function TransactionModal({
  isOpen,
  onClose,
  initialType = 'saida', // 'entrada' | 'saida'
  onAddIncome,
  onAddExpense,
  saidas = []
}) {
  const [tipo, setTipo] = useState(initialType);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState(initialType === 'entrada' ? CATEGORIA_ENTRADA_PADRAO : 'Alimentação');
  const [detalhamento, setDetalhamento] = useState('');
  const [isDelivery, setIsDelivery] = useState(false);

  // Modalidades de Saída
  const [formaPagamento, setFormaPagamento] = useState('pix_debito_dinheiro');
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [isParcelado, setIsParcelado] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState(3);
  const [parcelaAtual, setParcelaAtual] = useState(1);
  const [tipoValorParcelado, setTipoValorParcelado] = useState('total'); // 'total' | 'parcela'
  const [isFaturaTotal, setIsFaturaTotal] = useState(false);
  const [cartaoSelecionadoUid, setCartaoSelecionadoUid] = useState('');

  const dateChips = useDateChips();
  const { cartoes, cartaoAtivo } = useCreditCards();
  const valorInputRef = useRef(null);

  // Sincroniza tipo inicial ao abrir
  useEffect(() => {
    if (isOpen) {
      setTipo(initialType);
      setCategoria(initialType === 'entrada' ? CATEGORIA_ENTRADA_PADRAO : 'Alimentação');
      setTimeout(() => valorInputRef.current?.focus(), 150);
    }
  }, [isOpen, initialType]);

  // Se trocar tipo, ajusta categoria padrão
  const handleTrocarTipo = (novoTipo) => {
    setTipo(novoTipo);
    if (novoTipo === 'entrada') {
      setCategoria(CATEGORIA_ENTRADA_PADRAO);
      setIsParcelado(false);
      setIsFaturaTotal(false);
      setIsRecorrente(false);
    } else {
      setCategoria('Alimentação');
    }
  };

  const isCartao = formaPagamento === 'cartao_credito';

  const cartaoEfetivo = useMemo(() => {
    if (cartoes.length === 0) return null;
    return cartoes.find(c => c.uid === cartaoSelecionadoUid) || cartaoAtivo || cartoes[0];
  }, [cartoes, cartaoSelecionadoUid, cartaoAtivo]);

  const mesAlvo = useMemo(() => {
    return (dateChips.dataEfetiva || '').slice(0, 7);
  }, [dateChips.dataEfetiva]);

  // Fatura existente se for fatura fechada
  const faturaExistente = useMemo(() => {
    if (!isFaturaTotal || !isCartao) return null;
    return saidas.find(s => {
      if (!s.isFaturaTotal) return false;
      const mesItem = (s.data_pagamento || s.data || '').slice(0, 7);
      if (mesItem !== mesAlvo) return false;
      if (cartaoEfetivo && s.cartaoUid) return s.cartaoUid === cartaoEfetivo.uid;
      if (cartaoEfetivo && s.cartaoNome) {
        const nomeEfetivo = (cartaoEfetivo.apelido || cartaoEfetivo.cartaoNome || '').toLowerCase();
        return (s.cartaoNome || '').toLowerCase() === nomeEfetivo;
      }
      return !cartaoEfetivo && !s.cartaoUid;
    });
  }, [saidas, isFaturaTotal, isCartao, mesAlvo, cartaoEfetivo]);

  useEffect(() => {
    if (isFaturaTotal && faturaExistente) {
      setValor(String(faturaExistente.valor));
      if (faturaExistente.descricao && !descricao.trim()) {
        setDescricao(faturaExistente.descricao);
      }
    }
  }, [isFaturaTotal, faturaExistente]);

  // Submissão do Formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseFloat(valor);
    if (!num || num <= 0) return;

    if (tipo === 'entrada') {
      onAddIncome({
        id: gerarId(),
        descricao: descricao.trim() || 'Entrada',
        valor: num,
        categoria,
        data: dateChips.dataEfetiva
      });
    } else {
      if (categoria === 'Outros' && !detalhamento.trim()) return;

      const diaVenc = cartaoEfetivo?.diaVencimento || 10;
      const dataTransacao = dateChips.dataEfetiva;
      const dataPagamentoInicial = isCartao
        ? projetarDataVencimentoCartao(dataTransacao, diaVenc, 0)
        : dataTransacao;

      const cartaoInfo = cartaoEfetivo ? {
        cartaoUid: cartaoEfetivo.uid,
        cartaoNome: cartaoEfetivo.apelido || cartaoEfetivo.cartaoNome,
        bancoNome: cartaoEfetivo.bancoNome
      } : {};

      if (isCartao && isFaturaTotal) {
        const nomePadrao = cartaoEfetivo 
          ? `Fatura ${cartaoEfetivo.apelido || cartaoEfetivo.cartaoNome}` 
          : 'Fatura do Cartão de Crédito';

        const novoItem = {
          id: faturaExistente ? faturaExistente.id : gerarId(),
          descricao: descricao.trim() || nomePadrao,
          valor: num,
          categoria: 'Fatura de Cartão',
          data: dataTransacao,
          data_pagamento: dataPagamentoInicial,
          forma_pagamento: 'cartao_credito',
          dia_vencimento: diaVenc,
          mes_fatura: dataPagamentoInicial.slice(0, 7),
          frequencia: 'unico',
          recorrente: false,
          isFaturaTotal: true,
          ...cartaoInfo
        };
        onAddExpense(novoItem);
      } else if (isCartao && isParcelado) {
        const parcelas = gerarLancamentosParcelados({
          descricao: descricao.trim() || 'Despesa Parcelada',
          valorTotal: tipoValorParcelado === 'total' ? num : (num * qtdParcelas),
          valorPorParcela: tipoValorParcelado === 'parcela' ? num : null,
          categoria,
          dataBase: dataTransacao,
          formaPagamento,
          diaVencimento: diaVenc,
          quantidadeParcelas: qtdParcelas,
          parcelaInicial: parcelaAtual,
          detalhamento: categoria === 'Outros' ? detalhamento.trim() : '',
          conveniencia: categoria === 'Alimentação' ? isDelivery : false,
          ...cartaoInfo
        });
        onAddExpense(parcelas);
      } else {
        const novoItem = {
          id: gerarId(),
          descricao: descricao.trim() || 'Saída',
          valor: num,
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
          Object.assign(novoItem, cartaoInfo);
        }

        if (categoria === 'Outros' && detalhamento.trim()) {
          novoItem.detalhamento = detalhamento.trim();
        }

        if (categoria === 'Alimentação') {
          novoItem.conveniencia = isDelivery;
        }

        onAddExpense(novoItem);
      }
    }

    // Reset
    setValor('');
    setDescricao('');
    setDetalhamento('');
    setIsDelivery(false);
    setIsParcelado(false);
    setIsFaturaTotal(false);
    setIsRecorrente(false);
    dateChips.resetar();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="glass-panel max-w-xl w-full p-6 sm:p-7 rounded-[32px] border border-slate-200/90 dark:border-white/10 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal com Seletor Entrada / Saída (Estilo Imagens de Referência) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
          {/* Seletor de Tipo Pílula */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-white/[0.06] rounded-2xl border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => handleTrocarTipo('entrada')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                tipo === 'entrada'
                  ? 'bg-white text-emerald-700 shadow-md dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Nova Entrada</span>
            </button>
            <button
              type="button"
              onClick={() => handleTrocarTipo('saida')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                tipo === 'saida'
                  ? 'bg-white text-rose-700 shadow-md dark:bg-rose-500/20 dark:text-rose-300'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Minus className="w-4 h-4" />
              <span>Nova Saída</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Destaque Numérico Grande: R$ Valor (Inspirado na Tela 3 - Send Money / Add Money) */}
          <div className="text-center py-2 space-y-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
              Quantia do Lançamento
            </label>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-2xl sm:text-3xl font-black font-num-primary ${
                tipo === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {tipo === 'entrada' ? '+ R$' : '− R$'}
              </span>
              <input
                ref={valorInputRef}
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className={`text-3xl sm:text-4xl lg:text-5xl font-black font-num-primary bg-transparent outline-none w-48 sm:w-64 text-center tracking-tight ${
                  tipo === 'entrada' 
                    ? 'text-emerald-600 dark:text-emerald-400 placeholder:text-emerald-300/40' 
                    : 'text-rose-600 dark:text-rose-400 placeholder:text-rose-300/40'
                }`}
                required
              />
            </div>
          </div>

          {/* Descrição do Lançamento */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Descrição
            </label>
            <input
              type="text"
              placeholder={tipo === 'entrada' ? 'Ex.: Salário, Rendimentos, Bônus' : 'Ex.: Supermercado, Netflix, Aluguel'}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="glass-input w-full px-4 py-3 text-sm font-medium"
            />
          </div>

          {/* Seleção de Categorias em Pílulas */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Categoria
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA).map((cat) => {
                const isSelected = categoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoria(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? tipo === 'entrada'
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-md dark:bg-emerald-500/30 dark:border-emerald-400/50'
                          : 'bg-rose-500 text-white border-rose-600 shadow-md dark:bg-rose-500/30 dark:border-rose-400/50'
                        : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <span>{ICONES_CATEGORIAS[cat] || '🏷️'}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detalhamento se Outros */}
          {tipo === 'saida' && categoria === 'Outros' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Detalhamento Obrigatório
              </label>
              <input
                type="text"
                placeholder="Especifique a despesa..."
                value={detalhamento}
                onChange={(e) => setDetalhamento(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 text-sm"
                required
              />
            </div>
          )}

          {/* Opção Delivery vs Mercado se Alimentação */}
          {tipo === 'saida' && categoria === 'Alimentação' && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tipo de Alimentação
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsDelivery(false)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    !isDelivery 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300' 
                      : 'text-slate-500 border-transparent'
                  }`}
                >
                  🛒 Mercado
                </button>
                <button
                  type="button"
                  onClick={() => setIsDelivery(true)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isDelivery 
                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300' 
                      : 'text-slate-500 border-transparent'
                  }`}
                >
                  🛵 Delivery
                </button>
              </div>
            </div>
          )}

          {/* Opções Avançadas de Pagamento para Saídas */}
          {tipo === 'saida' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Forma de Pagamento
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFormaPagamento('pix_debito_dinheiro');
                      setIsParcelado(false);
                      setIsFaturaTotal(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formaPagamento === 'pix_debito_dinheiro'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                        : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    ⚡ PIX / Débito
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormaPagamento('cartao_credito')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formaPagamento === 'cartao_credito'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                        : 'bg-transparent text-slate-500 border-transparent hover:text-rose-500'
                    }`}
                  >
                    💳 Cartão de Crédito
                  </button>
                </div>
              </div>

              {/* Se for Cartão de Crédito */}
              {isCartao && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                  {/* Seletor do Cartão */}
                  {cartoes.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase text-slate-500">
                        Cartão Utilizado
                      </label>
                      <select
                        value={cartaoSelecionadoUid || (cartaoEfetivo ? cartaoEfetivo.uid : '')}
                        onChange={(e) => setCartaoSelecionadoUid(e.target.value)}
                        className="glass-input w-full px-3 py-2 text-xs font-bold cursor-pointer"
                      >
                        {cartoes.map(c => (
                          <option key={c.uid} value={c.uid}>
                            {c.apelido || c.cartaoNome} ({c.bancoNome}) - Venc. dia {c.diaVencimento}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Alternador de Modalidade do Cartão */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setIsParcelado(false);
                        setIsFaturaTotal(false);
                        setIsRecorrente(false);
                      }}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        !isParcelado && !isFaturaTotal && !isRecorrente
                          ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-500/20 dark:border-rose-400 dark:text-rose-300'
                          : 'border-slate-200 dark:border-white/10 text-slate-500'
                      }`}
                    >
                      À Vista
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsParcelado(true);
                        setIsFaturaTotal(false);
                        setIsRecorrente(false);
                      }}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isParcelado
                          ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/20 dark:border-amber-400 dark:text-amber-300'
                          : 'border-slate-200 dark:border-white/10 text-slate-500'
                      }`}
                    >
                      Parcelado
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecorrente(!isRecorrente);
                        setIsParcelado(false);
                        setIsFaturaTotal(false);
                      }}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isRecorrente
                          ? 'bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-500/20 dark:border-purple-400 dark:text-purple-300'
                          : 'border-slate-200 dark:border-white/10 text-slate-500'
                      }`}
                    >
                      Assinatura
                    </button>
                  </div>

                  {/* Campos de Parcelamento */}
                  {isParcelado && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-300 mb-1">
                          Nº de Parcelas
                        </label>
                        <select
                          value={qtdParcelas}
                          onChange={(e) => setQtdParcelas(parseInt(e.target.value, 10))}
                          className="glass-input w-full p-1.5 text-xs font-mono font-bold"
                        >
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24, 36, 48].map(n => (
                            <option key={n} value={n}>{n}x</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-300 mb-1">
                          Parcela Atual
                        </label>
                        <select
                          value={parcelaAtual}
                          onChange={(e) => setParcelaAtual(parseInt(e.target.value, 10))}
                          className="glass-input w-full p-1.5 text-xs font-mono font-bold"
                        >
                          {Array.from({ length: qtdParcelas }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>Parcela {n}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-300 mb-1">
                          Tipo do Valor
                        </label>
                        <select
                          value={tipoValorParcelado}
                          onChange={(e) => setTipoValorParcelado(e.target.value)}
                          className="glass-input w-full p-1.5 text-xs font-bold"
                        >
                          <option value="total">Valor Total</option>
                          <option value="parcela">Por Parcela</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Seleção de Data Rápida (Hoje, Ontem, Manual) */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Data da Operação</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => dateChips.setOpcao('hoje')}
                className={`px-3 py-1 rounded-xl font-bold border transition-all cursor-pointer ${
                  dateChips.opcao === 'hoje'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => dateChips.setOpcao('ontem')}
                className={`px-3 py-1 rounded-xl font-bold border transition-all cursor-pointer ${
                  dateChips.opcao === 'ontem'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
              >
                Ontem
              </button>
              <button
                type="button"
                onClick={() => dateChips.setOpcao('manual')}
                className={`px-3 py-1 rounded-xl font-bold border transition-all cursor-pointer ${
                  dateChips.opcao === 'manual'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
              >
                Manual
              </button>
            </div>
          </div>

          {dateChips.opcao === 'manual' && (
            <input
              type="date"
              value={dateChips.dataManual}
              onChange={(e) => dateChips.setDataManual(e.target.value)}
              className="glass-input w-full px-3 py-2 text-xs font-mono font-bold"
            />
          )}

          {/* Botão de Confirmação na Base */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!valor || parseFloat(valor) <= 0}
              className={`w-full py-4 rounded-2xl text-sm font-black tracking-wide shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 active:scale-[0.98] ${
                tipo === 'entrada'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-500/25'
              }`}
            >
              {tipo === 'entrada' ? (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Confirmar Entrada (+ R$ {valor ? formatarBRL(valor) : '0,00'})</span>
                </>
              ) : (
                <>
                  <Minus className="w-5 h-5" />
                  <span>Confirmar Saída (− R$ {valor ? formatarBRL(valor) : '0,00'})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
