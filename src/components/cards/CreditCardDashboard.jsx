import React, { useState, useMemo, useEffect } from 'react';
import { CreditCard, Calendar, Wallet, AlertCircle, CheckCircle2, ChevronRight, Filter, Plus, Check, Trash2, Sparkles, X, Edit3 } from 'lucide-react';
import { formatarBRL, formatarDataBR, formatarMesAno, obterDataHojeISO } from '../../utils/formatters';
import { STORAGE_KEYS } from '../../utils/constants';
import { mockCardsCatalog } from '../../data/cardsCatalog';

export function CreditCardDashboard({ saidas = [], onRemoveSaida }) {
  // Limite total configurável pelo usuário
  const [limiteTotal, setLimiteTotal] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.CARTAO_LIMITE_TOTAL);
      if (salvo !== null && salvo.trim() !== '') {
        const num = parseFloat(salvo);
        if (!isNaN(num) && num > 0) return num;
      }
    } catch (e) {}
    return 5000; // Padrão inicial
  });

  // Dia de vencimento padrão
  const [diaVencimento, setDiaVencimento] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.CARTAO_DIA_VENCIMENTO);
      if (salvo !== null && salvo.trim() !== '') {
        const num = parseInt(salvo, 10);
        if (!isNaN(num) && num >= 1 && num <= 31) return num;
      }
    } catch (e) {}
    return 10;
  });

  // Filtro de faturas: 'todas' | 'atual' | 'futuras'
  const [filtroStatus, setFiltroStatus] = useState('todas');

  const mesAtual = useMemo(() => obterDataHojeISO().slice(0, 7), []);

  // Estado do Modal de Questionário para Adicionar ou Editar Cartão
  const [modalAberto, setModalAberto] = useState(false);
  const [modoModal, setModoModal] = useState('adicionar'); // 'adicionar' | 'editar'
  const [cartaoEmEdicaoUid, setCartaoEmEdicaoUid] = useState(null);

  // Estados dos campos do Questionário (Filtro em Cascata e Atributos)
  const [modalBanco, setModalBanco] = useState('');
  const [modalCartaoId, setModalCartaoId] = useState('');
  const [modalLimite, setModalLimite] = useState(() => String(limiteTotal));
  const [modalDiaVenc, setModalDiaVenc] = useState(() => String(diaVencimento));
  const [modalApelido, setModalApelido] = useState('');

  // Cartões cadastrados pelo usuário e cartão ativo na carteira
  const [cartoesCadastrados, setCartoesCadastrados] = useState(() => {
    try {
      const salvo = localStorage.getItem('moneyhub_cartoes_cadastrados');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) {
          // Remove default-1 de testes anteriores para começar com tela limpa
          return parsed.filter(c => c.uid !== 'default-1');
        }
      }
    } catch (e) {}
    return [];
  });

  const [cartaoAtivoUid, setCartaoAtivoUid] = useState(() => {
    try {
      return localStorage.getItem('moneyhub_cartao_ativo_uid') || '';
    } catch (e) {}
    return '';
  });

  // Lista de modelos disponíveis em cascata para o banco selecionado no questionário
  const modalCartoesDisponiveis = useMemo(() => {
    if (!modalBanco || !mockCardsCatalog[modalBanco]) return [];
    return mockCardsCatalog[modalBanco].cartoes;
  }, [modalBanco]);

  // Cartão selecionado para o preview no Questionário
  const modalCartaoPreview = useMemo(() => {
    if (!modalCartaoId) return null;
    return modalCartoesDisponiveis.find((c) => c.id === modalCartaoId) || null;
  }, [modalCartoesDisponiveis, modalCartaoId]);

  // Cartão ativo na carteira
  const cartaoAtivo = useMemo(() => {
    if (cartoesCadastrados.length === 0) return null;
    return cartoesCadastrados.find((c) => c.uid === cartaoAtivoUid) || cartoesCadastrados[0] || null;
  }, [cartoesCadastrados, cartaoAtivoUid]);

  // Abertura do modal para Adicionar
  const handleAbrirModal = () => {
    setModoModal('adicionar');
    setCartaoEmEdicaoUid(null);
    setModalBanco('');
    setModalCartaoId('');
    setModalLimite(String(limiteTotal || 5000));
    setModalDiaVenc(String(diaVencimento || 10));
    setModalApelido('');
    setModalAberto(true);
  };

  // Abertura do modal para Editar
  const handleAbrirModalEdicao = (cartao) => {
    const alvo = cartao || cartaoAtivo;
    if (!alvo) return;
    setModoModal('editar');
    setCartaoEmEdicaoUid(alvo.uid);
    setModalBanco(alvo.bancoId || '');
    setModalCartaoId(alvo.cartaoId || '');
    setModalLimite(String(alvo.limite || limiteTotal || 5000));
    setModalDiaVenc(String(alvo.diaVencimento || diaVencimento || 10));
    setModalApelido(alvo.apelido || '');
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
  };

  const handleModalBancoChange = (e) => {
    setModalBanco(e.target.value);
    setModalCartaoId(''); // Reseta o segundo select de modelo
  };

  // Submissão do Questionário (Adicionar ou Editar)
  const handleSalvarCartaoQuestionario = (e) => {
    e.preventDefault();
    if (!modalBanco || !modalCartaoPreview) return;

    const limNum = parseFloat(modalLimite) || limiteTotal;
    const diaNum = parseInt(modalDiaVenc, 10) || diaVencimento;

    if (modoModal === 'editar' && cartaoEmEdicaoUid) {
      const novaLista = cartoesCadastrados.map((c) => {
        if (c.uid === cartaoEmEdicaoUid) {
          return {
            ...c,
            bancoId: modalBanco,
            bancoNome: mockCardsCatalog[modalBanco]?.nome || modalBanco,
            cartaoId: modalCartaoPreview.id,
            cartaoNome: modalCartaoPreview.nome,
            apelido: modalApelido.trim() || modalCartaoPreview.nome,
            imagePath: modalCartaoPreview.imagePath,
            limite: limNum,
            diaVencimento: diaNum,
          };
        }
        return c;
      });

      setCartoesCadastrados(novaLista);
      if (cartaoAtivoUid === cartaoEmEdicaoUid) {
        setLimiteTotal(limNum);
        setDiaVencimento(diaNum);
        try {
          localStorage.setItem(STORAGE_KEYS.CARTAO_LIMITE_TOTAL, String(limNum));
          localStorage.setItem(STORAGE_KEYS.CARTAO_DIA_VENCIMENTO, String(diaNum));
        } catch (err) {}
      }
      try {
        localStorage.setItem('moneyhub_cartoes_cadastrados', JSON.stringify(novaLista));
      } catch (err) {}
      setModalAberto(false);
      return;
    }

    // Modo Adicionar
    const novoUid = `card_${Date.now()}`;
    const novoCartao = {
      uid: novoUid,
      bancoId: modalBanco,
      bancoNome: mockCardsCatalog[modalBanco]?.nome || modalBanco,
      cartaoId: modalCartaoPreview.id,
      cartaoNome: modalCartaoPreview.nome,
      apelido: modalApelido.trim() || modalCartaoPreview.nome,
      imagePath: modalCartaoPreview.imagePath,
      limite: limNum,
      diaVencimento: diaNum,
      dataCadastro: new Date().toISOString()
    };

    const novaLista = [novoCartao, ...cartoesCadastrados.filter(c => c.cartaoId !== modalCartaoPreview.id)];
    setCartoesCadastrados(novaLista);
    setCartaoAtivoUid(novoUid);
    setLimiteTotal(limNum);
    setDiaVencimento(diaNum);

    try {
      localStorage.setItem('moneyhub_cartoes_cadastrados', JSON.stringify(novaLista));
      localStorage.setItem('moneyhub_cartao_ativo_uid', novoUid);
      localStorage.setItem(STORAGE_KEYS.CARTAO_LIMITE_TOTAL, String(limNum));
      localStorage.setItem(STORAGE_KEYS.CARTAO_DIA_VENCIMENTO, String(diaNum));
    } catch (err) {}

    setModalAberto(false);
  };

  // Remover cartão da carteira
  const handleRemoverCartao = (uidParaRemover) => {
    const novaLista = cartoesCadastrados.filter(c => c.uid !== uidParaRemover);
    setCartoesCadastrados(novaLista);
    if (cartaoAtivoUid === uidParaRemover) {
      setCartaoAtivoUid(novaLista.length > 0 ? novaLista[0].uid : '');
    }
    try {
      localStorage.setItem('moneyhub_cartoes_cadastrados', JSON.stringify(novaLista));
      if (cartaoAtivoUid === uidParaRemover) {
        localStorage.setItem('moneyhub_cartao_ativo_uid', novaLista.length > 0 ? novaLista[0].uid : '');
      }
    } catch (err) {}
  };

  // Tecla ESC para fechar modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalAberto) {
        setModalAberto(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalAberto]);

  const handleSalvarLimite = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setLimiteTotal(val);
      try {
        localStorage.setItem(STORAGE_KEYS.CARTAO_LIMITE_TOTAL, String(val));
      } catch (err) {}
    }
  };

  const handleSalvarDiaVencimento = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= 31) {
      setDiaVencimento(val);
      try {
        localStorage.setItem(STORAGE_KEYS.CARTAO_DIA_VENCIMENTO, String(val));
      } catch (err) {}
    }
  };

  // Filtra todas as transações de cartão de crédito
  const transacoesCartao = useMemo(() => {
    return saidas.filter(item => 
      item.forma_pagamento === 'cartao_credito' || 
      item.dia_vencimento !== undefined || 
      item.parcelaAtual !== undefined
    );
  }, [saidas]);

  // Agrupa transações por Fatura (Mês/Ano)
  const faturas = useMemo(() => {
    const mapa = {};

    transacoesCartao.forEach(item => {
      const dataRef = item.data_pagamento || item.data || '';
      const mesFatura = dataRef.length >= 7 ? dataRef.slice(0, 7) : mesAtual;

      if (!mapa[mesFatura]) {
        // Estima o vencimento a partir do dia configurado ou do primeiro item
        const dia = item.dia_vencimento || diaVencimento;
        mapa[mesFatura] = {
          mesFatura,
          diaVencimento: dia,
          dataVencimento: `${mesFatura}-${String(dia).padStart(2, '0')}`,
          itens: [],
          total: 0
        };
      }

      mapa[mesFatura].itens.push(item);
      mapa[mesFatura].total += (parseFloat(item.valor) || 0);
    });

    // Ordena as faturas cronologicamente
    const lista = Object.values(mapa).sort((a, b) => a.mesFatura.localeCompare(b.mesFatura));

    // Ordena os itens dentro de cada fatura (mais recentes primeiro)
    lista.forEach(f => {
      f.itens.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    });

    return lista;
  }, [transacoesCartao, mesAtual, diaVencimento]);

  // Fatura Atual
  const faturaAtual = useMemo(() => {
    return faturas.find(f => f.mesFatura === mesAtual) || { total: 0, itens: [] };
  }, [faturas, mesAtual]);

  // Total Comprometido (Fatura Atual + Faturas Futuras)
  const totalComprometido = useMemo(() => {
    return faturas
      .filter(f => f.mesFatura >= mesAtual)
      .reduce((acc, cur) => acc + cur.total, 0);
  }, [faturas, mesAtual]);

  // Limite Disponível
  const limiteDisponivel = Math.max(0, limiteTotal - totalComprometido);
  const percentualConsumo = limiteTotal > 0 
    ? Math.min(100, Math.round((totalComprometido / limiteTotal) * 100)) 
    : 0;

  // Cor do indicador de limite
  const corProgresso = useMemo(() => {
    if (percentualConsumo > 85) return 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]';
    if (percentualConsumo > 60) return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]';
    return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
  }, [percentualConsumo]);

  // Faturas filtradas para exibição no feed
  const faturasFiltradas = useMemo(() => {
    if (filtroStatus === 'atual') {
      return faturas.filter(f => f.mesFatura === mesAtual);
    }
    if (filtroStatus === 'futuras') {
      return faturas.filter(f => f.mesFatura > mesAtual);
    }
    return faturas;
  }, [faturas, filtroStatus, mesAtual]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Painel Unificado de Cartões (Substituição e Fusão de Gestão de Cartões com o Banner) */}
      {cartoesCadastrados.length === 0 ? (
        <section className="space-y-4">
          {/* Banner do Protótipo: Quando NÃO há cartão cadastrado */}
          <div className="p-6 sm:p-8 rounded-[28px] border-2 border-slate-300 dark:border-slate-700 bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 shadow-md transition-all">
            <div className="space-y-1.5 text-center md:text-left">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Você ainda não possui nenhum cartão cadastrado
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                Adicione seu cartão de crédito para gerenciar limites, faturas em aberto, compras parceladas e usufruir da visualização exclusiva da sua carteira estilo Apple Wallet.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAbrirModal}
              className="flex-shrink-0 px-6 sm:px-7 py-3.5 rounded-2xl bg-[#0e4b6c] hover:bg-[#0a3852] text-white font-extrabold text-sm sm:text-base flex items-center gap-3 shadow-lg shadow-[#0e4b6c]/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
            >
              <span>Adicionar cartão</span>
              <span className="text-emerald-400 font-black text-2xl leading-none transition-transform group-hover:rotate-90 duration-200">
                +
              </span>
            </button>
          </div>

          {/* Dados Gerais Sempre Visíveis: Fatura Atual e Total Comprometido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                  Fatura Atual ({formatarMesAno(mesAtual).split(' de ')[0]})
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-rose-600 dark:text-rose-400 tabular-nums">
                  R$ {formatarBRL(faturaAtual.total)}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">
                  {faturaAtual.itens.length} {faturaAtual.itens.length === 1 ? 'lançamento no mês' : 'lançamentos no mês'}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                  Total Comprometido
                </span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  R$ {formatarBRL(totalComprometido)}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">
                  Fatura atual + parcelas futuras
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Painel Completo: Quando HÁ cartão cadastrado */
        <section className="glass-panel p-5 sm:p-6 space-y-6 border-slate-200/90 dark:border-white/[0.08]">
          {/* Cabeçalho do Cartão Ativo: Modelo Visual Ampliado + Ações (Editar e Adicionar) */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {cartaoAtivo && (
                <div
                  onClick={() => handleAbrirModalEdicao(cartaoAtivo)}
                  className="w-36 sm:w-44 aspect-[1.586/1] rounded-2xl overflow-hidden shadow-xl border border-slate-200/90 dark:border-white/15 flex-shrink-0 group cursor-pointer relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  title="Clique para editar este cartão"
                >
                  <img
                    src={cartaoAtivo.imagePath}
                    alt={cartaoAtivo.cartaoNome}
                    className="w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5 shadow">
                      <Edit3 className="w-3 h-3" /> Editar
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {cartaoAtivo?.apelido || cartaoAtivo?.cartaoNome || 'Cartão de Crédito'}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 font-mono font-bold">
                    {cartaoAtivo?.bancoNome}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Modelo:</span> {cartaoAtivo?.cartaoNome}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Vencimento:</span> Todo dia {diaVencimento}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Limite:</span> R$ {formatarBRL(limiteTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações: Botão Editar (substitui os inputs de limite e vencimento) e Adicionar outro */}
            <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => handleAbrirModalEdicao(cartaoAtivo)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-300 dark:border-white/15 text-slate-800 dark:text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Editar limite, vencimento ou modelo do cartão"
              >
                <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Editar</span>
              </button>

              <button
                type="button"
                onClick={handleAbrirModal}
                className="px-4 py-2.5 rounded-xl bg-[#0e4b6c] hover:bg-[#0a3852] text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md shadow-[#0e4b6c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-[#092b3e]"
              >
                <span>Adicionar outro</span>
                <span className="text-emerald-400 font-black text-lg leading-none">+</span>
              </button>
            </div>
          </div>

          {/* Se houver mais de 1 cartão cadastrado, exibe a tira para alternar */}
          {cartoesCadastrados.length > 1 && (
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-400 flex-shrink-0 mr-1">Alternar:</span>
              {cartoesCadastrados.map((c) => {
                const isAtivo = c.uid === cartaoAtivoUid;
                return (
                  <button
                    key={c.uid}
                    type="button"
                    onClick={() => {
                      setCartaoAtivoUid(c.uid);
                      if (c.limite) setLimiteTotal(c.limite);
                      if (c.diaVencimento) setDiaVencimento(c.diaVencimento);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex-shrink-0 cursor-pointer ${
                      isAtivo
                        ? 'border-rose-400 dark:border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 shadow-sm'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <img src={c.imagePath} alt="" className="w-5 h-3.5 rounded object-cover" />
                    <span>{c.apelido || c.cartaoNome}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Indicador de Progresso com Porcentagem GRANDE do LIMITE UTILIZADO (Sem o 'Utilizado | Disponível' redundante acima da barra) */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Limite Utilizado no Cartão
                </span>
                <div className="flex items-baseline gap-3">
                  {/* Porcentagem do Limite UTILIZADO em destaque MAIOR */}
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-mono font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {percentualConsumo}%
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                    do limite de R$ {formatarBRL(limiteTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full h-4 bg-slate-100 dark:bg-[#04070F]/80 backdrop-blur-md rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/[0.08] shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 ${corProgresso}`}
                style={{ width: `${Math.max(2, percentualConsumo)}%` }}
              />
            </div>
          </div>

          {/* 4 Cards Informativos (Fatura Atual, Total Comprometido, Limite Disponível, Limite Cadastrado) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05]">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-0.5">
                Fatura Atual ({formatarMesAno(mesAtual).split(' de ')[0]})
              </span>
              <span className="text-lg font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                R$ {formatarBRL(faturaAtual.total)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05]">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-0.5">
                Total Comprometido
              </span>
              <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                R$ {formatarBRL(totalComprometido)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05]">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-0.5">
                Limite Disponível
              </span>
              <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                R$ {formatarBRL(limiteDisponivel)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05]">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-0.5">
                Limite Cadastrado
              </span>
              <span className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                R$ {formatarBRL(limiteTotal)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 3. Timeline de Faturas (Feed Limpo) */}
      <section className="space-y-4">
        {/* Barra de Filtro de Faturas */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Linha do Tempo de Faturas</span>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-white/[0.05] px-2 py-0.5 rounded-full">
              {faturas.length} {faturas.length === 1 ? 'mês' : 'meses'}
            </span>
          </h3>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFiltroStatus('todas')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filtroStatus === 'todas'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-rose-500/20 dark:text-rose-300'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('atual')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filtroStatus === 'atual'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-rose-500/20 dark:text-rose-300'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Fatura Atual
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('futuras')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filtroStatus === 'futuras'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-rose-500/20 dark:text-rose-300'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Futuras
            </button>
          </div>
        </div>

        {/* Lista de Faturas ou Estado Vazio */}
        {faturasFiltradas.length === 0 ? (
          <div className="glass-panel p-10 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 text-xl">
              💳
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Nenhuma despesa de cartão encontrada
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Ao cadastrar saídas na aba Calculadora, selecione a opção "Cartão de Crédito" para que as compras e parcelamentos futuros sejam agrupados aqui automaticamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {faturasFiltradas.map((fatura) => {
              const isMesAtual = fatura.mesFatura === mesAtual;
              const isFutura = fatura.mesFatura > mesAtual;

              return (
                <div
                  key={fatura.mesFatura}
                  className={`glass-panel overflow-hidden border transition-all duration-200 ${
                    isMesAtual
                      ? 'border-rose-300 dark:border-rose-500/30 shadow-md'
                      : 'border-slate-200/80 dark:border-white/[0.08]'
                  }`}
                >
                  {/* Cabeçalho da Fatura */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        isMesAtual 
                          ? 'bg-amber-500 animate-pulse' 
                          : isFutura 
                          ? 'bg-indigo-500' 
                          : 'bg-slate-400'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Fatura de {formatarMesAno(fatura.mesFatura)}
                          </h4>
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            isMesAtual
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30'
                              : isFutura
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-400/30'
                              : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}>
                            {isMesAtual ? 'Fatura Atual' : isFutura ? 'Fatura Futura' : 'Fatura Fechada'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          Vencimento previsto: {formatarDataBR(fatura.dataVencimento)} · {fatura.itens.length} {fatura.itens.length === 1 ? 'lançamento' : 'lançamentos'}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Total da Fatura
                      </span>
                      <span className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                        R$ {formatarBRL(fatura.total)}
                      </span>
                    </div>
                  </div>

                  {/* Feed Limpo de Transações (Sem bordas pesadas) */}
                  <div className="p-2 sm:p-3 divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {fatura.itens.map((item) => {
                      const isParcelado = item.totalParcelas && item.totalParcelas > 1;
                      const dataCompra = formatarDataBR(item.data);

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-all duration-150 group"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-3">
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md">
                                  {item.descricao || '(sem descrição)'}
                                </span>

                                {/* Badge de Categoria */}
                                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/[0.06]">
                                  {item.categoria}
                                </span>

                                {/* Badge de Parcela */}
                                {isParcelado && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30 font-mono">
                                    {item.parcelaAtual}/{item.totalParcelas}
                                  </span>
                                )}

                                {item.conveniencia && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/30">
                                    🛵 Delivery
                                  </span>
                                )}
                              </div>

                              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                Compra realizada em {dataCompra}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="font-mono text-sm sm:text-base font-bold tabular-nums text-rose-600 dark:text-rose-400">
                              − R$ {formatarBRL(item.valor)}
                            </span>

                            {onRemoveSaida && (
                              <button
                                type="button"
                                onClick={() => onRemoveSaida(item.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/15 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 transition-all text-base font-bold leading-none select-none"
                                title="Remover lançamento desta fatura"
                                aria-label="Remover lançamento"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Modal de Questionário para Adicionar ou Editar Cartão (Design Amplo e Espaçoso) */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fadeIn"
          onClick={handleFecharModal}
        >
          <div
            className="glass-panel max-w-5xl w-full p-6 sm:p-9 md:p-10 rounded-[32px] border border-slate-200/90 dark:border-white/10 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal Amplo */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-400/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm flex-shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {modoModal === 'editar' ? 'Editar Dados do Cartão' : 'Cadastrar Novo Cartão'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {modoModal === 'editar'
                      ? 'Atualize o modelo ou categoria, ajuste seu limite ou altere a data de vencimento'
                      : 'Selecione o banco emissor e o modelo para configurar seu cartão na carteira'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFecharModal}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.12] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                title="Fechar (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Modal: Preview Visual Ampliado + Questionário Estruturado */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Lado Esquerdo: Preview Visual Ampliado (Apple Wallet Style) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-slate-100/80 dark:bg-white/[0.02] border border-slate-200/90 dark:border-white/[0.06] shadow-sm">
                <div className="w-full max-w-[360px] sm:max-w-[400px] aspect-[1.586/1] flex items-center justify-center">
                  {modalCartaoPreview ? (
                    <div className="w-full h-full relative group">
                      <img
                        src={modalCartaoPreview.imagePath}
                        alt={modalCartaoPreview.nome}
                        className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300 -rotate-1 hover:rotate-0 cursor-pointer select-none"
                        loading="eager"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-[24px] border-2 border-dashed border-slate-300 dark:border-white/20 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center p-6 text-center gap-3">
                      <CreditCard className="w-12 h-12 text-slate-400 opacity-60" />
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block">
                          Preview Visual do Cartão
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed block mt-1">
                          Selecione o banco emissor e o modelo ao lado para visualizar a representação realista em 3D
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {modalCartaoPreview && (
                  <div className="mt-5 text-center space-y-1.5 animate-fadeIn w-full">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
                        {modalCartaoPreview.nome}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/20 font-mono font-bold">
                        {mockCardsCatalog[modalBanco]?.nome}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center justify-center gap-2">
                      <span>Limite: R$ {formatarBRL(parseFloat(modalLimite) || 0)}</span>
                      <span>•</span>
                      <span>Vencimento: Dia {modalDiaVenc || 10}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Lado Direito: Formulário Espaçoso e Confortável */}
              <form onSubmit={handleSalvarCartaoQuestionario} className="lg:col-span-7 space-y-4 sm:space-y-5">
                {/* Pergunta 1: Banco Emissor */}
                <div className="space-y-1.5">
                  <label htmlFor="modal-banco" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>1. Qual é o Banco Emissor?</span>
                    <span className="text-[11px] text-rose-500 font-semibold">*obrigatório</span>
                  </label>
                  <select
                    id="modal-banco"
                    value={modalBanco}
                    onChange={handleModalBancoChange}
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.12] text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 cursor-pointer transition-all shadow-sm"
                  >
                    <option value="" disabled className="dark:bg-slate-900 text-slate-400">
                      Selecione o banco emissor...
                    </option>
                    {Object.entries(mockCardsCatalog).map(([chave, banco]) => (
                      <option key={chave} value={chave} className="dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                        {banco.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pergunta 2: Modelo do Cartão (Filtro em Cascata) */}
                <div className="space-y-1.5">
                  <label htmlFor="modal-cartao" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>2. Qual é o Modelo do Cartão?</span>
                    <span className="text-[11px] text-rose-500 font-semibold">*obrigatório</span>
                  </label>
                  <select
                    id="modal-cartao"
                    value={modalCartaoId}
                    onChange={(e) => setModalCartaoId(e.target.value)}
                    disabled={!modalBanco}
                    required
                    className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all shadow-sm ${
                      !modalBanco
                        ? 'bg-slate-100 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] text-slate-400 cursor-not-allowed'
                        : 'bg-slate-50 dark:bg-white/[0.04] border-slate-300 dark:border-white/[0.12] text-slate-900 dark:text-white cursor-pointer'
                    }`}
                  >
                    <option value="" disabled className="dark:bg-slate-900 text-slate-400">
                      {!modalBanco ? 'Escolha primeiro o banco acima' : 'Selecione o modelo do cartão...'}
                    </option>
                    {modalCartoesDisponiveis.map((cartao) => (
                      <option key={cartao.id} value={cartao.id} className="dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                        {cartao.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Perguntas 3 e 4: Limite Total e Dia do Vencimento (Lado a Lado em Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="modal-limite" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      3. Limite Total (R$)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                        R$
                      </span>
                      <input
                        id="modal-limite"
                        type="number"
                        step="100"
                        min="0"
                        value={modalLimite}
                        onChange={(e) => setModalLimite(e.target.value)}
                        placeholder="5000"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.12] text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="modal-venc" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      4. Dia do Vencimento (1 a 31)
                    </label>
                    <input
                      id="modal-venc"
                      type="number"
                      min="1"
                      max="31"
                      value={modalDiaVenc}
                      onChange={(e) => setModalDiaVenc(e.target.value)}
                      placeholder="10"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.12] text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 shadow-sm text-center"
                    />
                  </div>
                </div>

                {/* Pergunta 5: Apelido / Identificação */}
                <div className="space-y-1.5">
                  <label htmlFor="modal-apelido" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    5. Apelido do Cartão (Opcional)
                  </label>
                  <input
                    id="modal-apelido"
                    type="text"
                    value={modalApelido}
                    onChange={(e) => setModalApelido(e.target.value)}
                    placeholder="Ex: Cartão Principal, Uso Diário, Milhas"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.12] text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 shadow-sm"
                  />
                </div>

                {/* Ações do Questionário */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-white/[0.06]">
                  {modoModal === 'editar' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja remover este cartão (${cartaoAtivo?.apelido || cartaoAtivo?.cartaoNome})?`)) {
                          handleRemoverCartao(cartaoEmEdicaoUid);
                          setModalAberto(false);
                        }
                      }}
                      className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir Cartão</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-3 ml-auto">
                    <button
                      type="button"
                      onClick={handleFecharModal}
                      className="px-5 py-2.5 sm:py-3 rounded-2xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!modalCartaoPreview}
                      className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2.5 transition-all cursor-pointer ${
                        modalCartaoPreview
                          ? 'bg-[#0e4b6c] hover:bg-[#0a3852] text-white shadow-lg shadow-[#0e4b6c]/30 active:scale-[0.98]'
                          : 'bg-slate-200 dark:bg-white/[0.06] text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span>{modoModal === 'editar' ? 'Salvar Alterações' : 'Cadastrar Cartão'}</span>
                      {modoModal === 'editar' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-emerald-400 font-bold text-lg leading-none">+</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
