import React, { useState, useMemo, useEffect } from 'react';
import { 
  CreditCard, Calendar, Wallet, AlertCircle, CheckCircle2, ChevronRight, 
  Filter, Plus, Check, Trash2, Sparkles, X, Edit3, ArrowUpRight, ArrowDownRight, 
  DollarSign, TrendingUp, Layers, BarChart3, Minimize2, ChevronLeft
} from 'lucide-react';
import { formatarBRL, formatarDataBR, formatarMesAno, obterDataHojeISO } from '../../utils/formatters';
import { STORAGE_KEYS } from '../../utils/constants';
import { mockCardsCatalog } from '../../data/cardsCatalog';
import { notificarAtualizacaoCartoes } from '../../hooks/useCreditCards';

const CORES_CATEGORIAS = {
  'Alimentação': '#EA580C',
  'Mercado': '#F97316',
  'Transporte': '#6366F1',
  'Saúde': '#059669',
  'Educação': '#0D9488',
  'Comunicação': '#D97706',
  'Compras': '#E11D48',
  'Serviços': '#0284C7',
  'Transferências/Pagamentos pessoais': '#4F46E5',
  'Outros': '#7C3AED',
  'Fatura a conciliar': '#E11D48',
  'Não identificado': '#64748B'
};

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
  'Fatura a conciliar': '📑',
  'Não identificado': '🏷️'
};

const CORES_FALLBACK = [
  '#EA580C', '#0284C7', '#D97706', '#059669', '#6366F1',
  '#E11D48', '#0D9488', '#F97316', '#4F46E5', '#DB2777'
];

export function UnifiedDashboard({ entradas = [], saidas = [], calc, usuario, onRemoveSaida }) {
  // Limite total configurável pelo usuário
  const [limiteTotal, setLimiteTotal] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.CARTAO_LIMITE_TOTAL);
      if (salvo !== null && salvo.trim() !== '') {
        const num = parseFloat(salvo);
        if (!isNaN(num) && num > 0) return num;
      }
    } catch (e) {}
    return 5000;
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

  const mesAtual = useMemo(() => obterDataHojeISO().slice(0, 7), []);

  // Determina o mês de criação da conta (YYYY-MM)
  const mesCriacaoConta = useMemo(() => {
    // 1. Caso usuário autenticado via Supabase
    if (usuario?.created_at) {
      try {
        const d = new Date(usuario.created_at);
        if (!isNaN(d.getTime())) {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
      } catch (e) {}
    }

    // 2. Caso local / sem login: recupera ou inicializa data de criação local
    try {
      let dataLocal = localStorage.getItem('moneyhub_data_criacao_conta');
      if (!dataLocal) {
        dataLocal = new Date().toISOString();
        localStorage.setItem('moneyhub_data_criacao_conta', dataLocal);
      }
      const d = new Date(dataLocal);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
    } catch (e) {}

    return mesAtual;
  }, [usuario, mesAtual]);

  // Meses disponíveis para o filtro do dashboard
  const mesesDisponiveis = useMemo(() => {
    const mesesSet = new Set();
    mesesSet.add(mesAtual);

    entradas.forEach(item => {
      const d = item.data_pagamento || item.data;
      if (d && d.length >= 7) mesesSet.add(d.slice(0, 7));
    });

    saidas.forEach(item => {
      const d = item.data_pagamento || item.data;
      if (d && d.length >= 7) mesesSet.add(d.slice(0, 7));
    });

    // Filtra meses anteriores à criação da conta, a menos que existam lançamentos explícitos
    const lista = Array.from(mesesSet)
      .filter(m => {
        if (m >= mesCriacaoConta) return true;
        const temEntrada = entradas.some(e => (e.data_pagamento || e.data || '').startsWith(m));
        const temSaida = saidas.some(s => (s.data_pagamento || s.data || '').startsWith(m));
        return temEntrada || temSaida;
      })
      .sort((a, b) => b.localeCompare(a));

    return lista.length > 0 ? lista : [mesAtual];
  }, [entradas, saidas, mesAtual, mesCriacaoConta]);

  // mesFoco: quando null, exibe todas as barras (minimizado); quando 'YYYY-MM', amplia aquele mês em específico
  const [mesFoco, setMesFoco] = useState(null);

  // Modal para Adicionar ou Editar Cartão
  const [modalAberto, setModalAberto] = useState(false);
  const [modoModal, setModoModal] = useState('adicionar');
  const [cartaoEmEdicaoUid, setCartaoEmEdicaoUid] = useState(null);

  const [modalBanco, setModalBanco] = useState('');
  const [modalCartaoId, setModalCartaoId] = useState('');
  const [modalLimite, setModalLimite] = useState(() => String(limiteTotal));
  const [modalDiaVenc, setModalDiaVenc] = useState(() => String(diaVencimento));
  const [modalApelido, setModalApelido] = useState('');

  // Cartões cadastrados pelo usuário
  const [cartoesCadastrados, setCartoesCadastrados] = useState(() => {
    try {
      const salvo = localStorage.getItem('moneyhub_cartoes_cadastrados');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) {
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

  const modalCartoesDisponiveis = useMemo(() => {
    if (!modalBanco || !mockCardsCatalog[modalBanco]) return [];
    return mockCardsCatalog[modalBanco].cartoes;
  }, [modalBanco]);

  const modalCartaoPreview = useMemo(() => {
    if (!modalCartaoId) return null;
    return modalCartoesDisponiveis.find((c) => c.id === modalCartaoId) || null;
  }, [modalCartoesDisponiveis, modalCartaoId]);

  const cartaoAtivo = useMemo(() => {
    if (cartoesCadastrados.length === 0) return null;
    return cartoesCadastrados.find((c) => c.uid === cartaoAtivoUid) || cartoesCadastrados[0] || null;
  }, [cartoesCadastrados, cartaoAtivoUid]);

  // Ações do Modal
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
    setModalCartaoId('');
  };

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
      notificarAtualizacaoCartoes();
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
    notificarAtualizacaoCartoes();

    setModalAberto(false);
  };

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
    notificarAtualizacaoCartoes();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalAberto) {
        setModalAberto(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalAberto]);

  // Transações de Cartão
  const transacoesCartao = useMemo(() => {
    return saidas.filter(item => 
      item.forma_pagamento === 'cartao_credito' || 
      item.dia_vencimento !== undefined || 
      item.parcelaAtual !== undefined
    );
  }, [saidas]);

  const pertenceAoCartao = (item, cartao) => {
    if (!cartao) return true;
    if (item.cartaoUid) return item.cartaoUid === cartao.uid;
    if (item.cartaoNome) {
      const nomeAlvo = (cartao.apelido || cartao.cartaoNome || '').toLowerCase();
      const itemNome = item.cartaoNome.toLowerCase();
      if (itemNome === nomeAlvo) return true;
      if (cartao.bancoNome && itemNome.includes(cartao.bancoNome.toLowerCase())) return true;
      return false;
    }
    if (cartoesCadastrados.length <= 1) return true;
    return cartao.uid === cartoesCadastrados[0]?.uid;
  };

  const transacoesCartaoAtivo = useMemo(() => {
    if (!cartaoAtivo) return transacoesCartao;
    return transacoesCartao.filter(item => pertenceAoCartao(item, cartaoAtivo));
  }, [transacoesCartao, cartaoAtivo, cartoesCadastrados]);

  const agruparPorFatura = (listaItens, diaPadrao) => {
    const mapa = {};

    listaItens.forEach(item => {
      const dataRef = item.data_pagamento || item.data || '';
      const mesFatura = dataRef.length >= 7 ? dataRef.slice(0, 7) : mesAtual;

      if (!mapa[mesFatura]) {
        const dia = item.dia_vencimento || diaPadrao;
        mapa[mesFatura] = {
          mesFatura,
          diaVencimento: dia,
          dataVencimento: `${mesFatura}-${String(dia).padStart(2, '0')}`,
          itens: [],
          total: 0,
          totalFaturaDeclarado: 0,
          totalItensDetalhados: 0,
          temFaturaDeclarada: false
        };
      }

      if (item.isFaturaTotal) {
        mapa[mesFatura].totalFaturaDeclarado += (parseFloat(item.valor) || 0);
        mapa[mesFatura].temFaturaDeclarada = true;
      } else {
        mapa[mesFatura].totalItensDetalhados += (parseFloat(item.valor) || 0);
      }

      mapa[mesFatura].itens.push(item);
    });

    Object.values(mapa).forEach(f => {
      f.total = f.temFaturaDeclarada ? f.totalFaturaDeclarado : f.totalItensDetalhados;
      f.pctConciliado = f.totalFaturaDeclarado > 0 
        ? Math.min(100, Math.round((f.totalItensDetalhados / f.totalFaturaDeclarado) * 100)) 
        : 100;
      f.diferencaAConciliar = Math.max(0, f.totalFaturaDeclarado - f.totalItensDetalhados);
    });

    const lista = Object.values(mapa).sort((a, b) => a.mesFatura.localeCompare(b.mesFatura));
    return lista;
  };

  const faturasCartaoAtivo = useMemo(() => {
    const dia = cartaoAtivo?.diaVencimento || diaVencimento;
    return agruparPorFatura(transacoesCartaoAtivo, dia);
  }, [transacoesCartaoAtivo, cartaoAtivo, diaVencimento, mesAtual]);

  const faturasMetricas = faturasCartaoAtivo;

  // Fatura Atual do cartão
  const faturaAtual = useMemo(() => {
    return faturasMetricas.find(f => f.mesFatura === mesAtual) || { 
      total: 0, 
      itens: [], 
      totalFaturaDeclarado: 0, 
      totalItensDetalhados: 0, 
      temFaturaDeclarada: false, 
      pctConciliado: 100, 
      diferencaAConciliar: 0 
    };
  }, [faturasMetricas, mesAtual]);

  // Total Comprometido
  const totalComprometido = useMemo(() => {
    return faturasMetricas
      .filter(f => f.mesFatura >= mesAtual)
      .reduce((acc, cur) => acc + cur.total, 0);
  }, [faturasMetricas, mesAtual]);

  const limiteEfetivo = cartaoAtivo?.limite || limiteTotal;
  const limiteDisponivel = Math.max(0, limiteEfetivo - totalComprometido);
  const percentualConsumo = limiteEfetivo > 0 
    ? Math.min(100, Math.round((totalComprometido / limiteEfetivo) * 100)) 
    : 0;

  const corProgresso = useMemo(() => {
    if (percentualConsumo > 85) return 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]';
    if (percentualConsumo > 60) return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]';
    return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
  }, [percentualConsumo]);

  // Dados do Dashboard de Fluxo de Caixa Mensal
  const entradasMes = useMemo(() => {
    return entradas.filter(item => {
      const d = item.data_pagamento || item.data || '';
      if (!mesFoco) return true;
      return d.startsWith(mesFoco);
    });
  }, [entradas, mesFoco]);

  const saidasMes = useMemo(() => {
    return saidas.filter(item => {
      const d = item.data_pagamento || item.data || '';
      if (!mesFoco) return true;
      return d.startsWith(mesFoco) || item.recorrente === true;
    });
  }, [saidas, mesFoco]);

  const totalEntradasMes = useMemo(() => {
    return entradasMes.reduce((acc, cur) => acc + (parseFloat(cur.valor) || 0), 0);
  }, [entradasMes]);

  const totalSaidasMes = useMemo(() => {
    const cartoesComFaturaTotal = new Set();
    let temFaturaSemCartaoEspecificado = false;

    saidasMes.forEach(item => {
      if (item.isFaturaTotal === true) {
        if (item.cartaoUid) cartoesComFaturaTotal.add(item.cartaoUid);
        if (item.cartaoNome) cartoesComFaturaTotal.add(item.cartaoNome.toLowerCase());
        if (!item.cartaoUid && !item.cartaoNome) temFaturaSemCartaoEspecificado = true;
      }
    });

    return saidasMes.reduce((acc, cur) => {
      if (cur.forma_pagamento === 'cartao_credito' && !cur.isFaturaTotal) {
        const temFaturaDesteCartao = 
          (cur.cartaoUid && cartoesComFaturaTotal.has(cur.cartaoUid)) ||
          (cur.cartaoNome && cartoesComFaturaTotal.has(cur.cartaoNome.toLowerCase())) ||
          (!cur.cartaoUid && !cur.cartaoNome && (temFaturaSemCartaoEspecificado || cartoesComFaturaTotal.size > 0));

        if (temFaturaDesteCartao) {
          return acc;
        }
      }
      return acc + (parseFloat(cur.valor) || 0);
    }, 0);
  }, [saidasMes]);

  const saldoMes = totalEntradasMes - totalSaidasMes;

  // 1. Histórico de Gastos Mensais para o Gráfico de Barras
  const historicoGastosMensais = useMemo(() => {
    const mapaMeses = {};
    const hoje = new Date();

    // Gera os últimos 6 meses cronológicos para visão comparativa completa
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      mapaMeses[chave] = 0;
    }

    // Se houver mês focado fora da janela padrão de 6 meses, inclui também
    if (mesFoco && !mapaMeses[mesFoco]) {
      mapaMeses[mesFoco] = 0;
    }

    Object.keys(mapaMeses).forEach(mes => {
      const cartoesComFatura = new Set();
      let temFaturaGeral = false;

      const itensMes = saidas.filter(item => {
        const d = item.data_pagamento || item.data || '';
        return d.startsWith(mes) || item.recorrente === true;
      });

      itensMes.forEach(item => {
        if (item.isFaturaTotal) {
          if (item.cartaoUid) cartoesComFatura.add(item.cartaoUid);
          if (item.cartaoNome) cartoesComFatura.add(item.cartaoNome.toLowerCase());
          if (!item.cartaoUid && !item.cartaoNome) temFaturaGeral = true;
        }
      });

      const totalMes = itensMes.reduce((acc, item) => {
        if (item.forma_pagamento === 'cartao_credito' && !item.isFaturaTotal) {
          const temFatura = (item.cartaoUid && cartoesComFatura.has(item.cartaoUid)) ||
            (item.cartaoNome && cartoesComFatura.has(item.cartaoNome.toLowerCase())) ||
            (!item.cartaoUid && !item.cartaoNome && (temFaturaGeral || cartoesComFatura.size > 0));
          if (temFatura) return acc;
        }
        return acc + (parseFloat(item.valor) || 0);
      }, 0);

      mapaMeses[mes] = totalMes;
    });

    const lista = Object.entries(mapaMeses)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes, valor]) => {
        const nomesMes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const mesIndex = parseInt(mes.slice(5, 7), 10) - 1;
        return {
          mes,
          mesLabel: formatarMesAno(mes),
          mesCurto: nomesMes[mesIndex] || mes.slice(5, 7),
          valor
        };
      });

    const maxGasto = Math.max(...lista.map(i => i.valor), 1);
    const mediaGasto = lista.reduce((acc, i) => acc + i.valor, 0) / (lista.length || 1);

    return {
      lista,
      maxGasto,
      mediaGasto
    };
  }, [saidas, mesFoco]);

  const handleToggleMes = (mes) => {
    if (mesFoco === mes) {
      // 2º clique no mesmo mês: minimiza e volta a exibir todas as barras
      setMesFoco(null);
    } else {
      // 1º clique: amplia e visualiza aquele mês em específico
      setMesFoco(mes);
    }
  };

  // 2. Agrupamento de Gastos por Categoria
  const { categoriasAgrupadas, totalCategorias } = useMemo(() => {
    const mapa = {};
    const cartoesComFaturaTotal = new Set();
    let temFaturaSemCartaoEspecificado = false;

    saidasMes.forEach(item => {
      if (item.isFaturaTotal === true) {
        if (item.cartaoUid) cartoesComFaturaTotal.add(item.cartaoUid);
        if (item.cartaoNome) cartoesComFaturaTotal.add(item.cartaoNome.toLowerCase());
        if (!item.cartaoUid && !item.cartaoNome) temFaturaSemCartaoEspecificado = true;
      }
    });

    const temAlgumaFatura = cartoesComFaturaTotal.size > 0 || temFaturaSemCartaoEspecificado;

    if (temAlgumaFatura) {
      const totalFaturaDeclarado = saidasMes
        .filter(item => item.isFaturaTotal === true)
        .reduce((acc, cur) => acc + (parseFloat(cur.valor) || 0), 0);

      let totalConciliado = 0;

      saidasMes.forEach(item => {
        if (item.isFaturaTotal) return;
        const cat = item.categoria || 'Não identificado';
        const val = parseFloat(item.valor) || 0;
        mapa[cat] = (mapa[cat] || 0) + val;

        if (item.forma_pagamento === 'cartao_credito') {
          const temFaturaDesteCartao = 
            (item.cartaoUid && cartoesComFaturaTotal.has(item.cartaoUid)) ||
            (item.cartaoNome && cartoesComFaturaTotal.has(item.cartaoNome.toLowerCase())) ||
            (!item.cartaoUid && !item.cartaoNome && (temFaturaSemCartaoEspecificado || cartoesComFaturaTotal.size > 0));

          if (temFaturaDesteCartao) {
            totalConciliado += val;
          }
        }
      });

      const diferencaPendente = Math.max(0, totalFaturaDeclarado - totalConciliado);
      if (diferencaPendente > 0) {
        mapa['Fatura a conciliar'] = (mapa['Fatura a conciliar'] || 0) + diferencaPendente;
      }
    } else {
      saidasMes.forEach(item => {
        const cat = item.categoria || 'Não identificado';
        const val = parseFloat(item.valor) || 0;
        mapa[cat] = (mapa[cat] || 0) + val;
      });
    }

    const total = Object.values(mapa).reduce((a, b) => a + b, 0);
    const lista = Object.entries(mapa)
      .map(([nome, valor], idx) => ({
        nome,
        valor,
        porcentagem: total > 0 ? (valor / total) * 100 : 0,
        cor: CORES_CATEGORIAS[nome] || CORES_FALLBACK[idx % CORES_FALLBACK.length]
      }))
      .sort((a, b) => b.valor - a.valor);

    return { categoriasAgrupadas: lista, totalCategorias: total };
  }, [saidasMes]);

  // Estado para destacar categoria ao passar o cursor no gráfico de barras empilhadas ou no cartão
  const [categoriaHover, setCategoriaHover] = useState(null);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* 1. CAIXAS ACIMA DO CARTÃO: Fatura Atual, Limite Disponível, Limite Cadastrado e Saldo do Mês */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Caixa 1: Fatura Atual */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] shadow-xs backdrop-blur-md transition-all hover:border-rose-300 dark:hover:border-rose-500/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Fatura Atual ({formatarMesAno(mesAtual).split(' de ')[0]})
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <span className="font-num-primary text-xl sm:text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400 block">
            R$ {formatarBRL(faturaAtual.total)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block font-secondary">
            {faturaAtual.temFaturaDeclarada 
              ? `Consolidada (${faturaAtual.pctConciliado}% detalhado)` 
              : `Vencimento dia ${diaVencimento}`}
          </span>
        </div>

        {/* Caixa 2: Limite Disponível (Fonte Secundária) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] shadow-xs backdrop-blur-md transition-all hover:border-emerald-300 dark:hover:border-emerald-500/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Limite Disponível
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <span className="font-num-secondary text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 block">
            R$ {formatarBRL(limiteDisponivel)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block font-secondary">
            Livre para novas compras
          </span>
        </div>

        {/* Caixa 3: Limite Cadastrado (Fonte Secundária) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] shadow-xs backdrop-blur-md transition-all hover:border-slate-300 dark:hover:border-white/20">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Limite Cadastrado
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-200/60 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <span className="font-num-secondary text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 block">
            R$ {formatarBRL(limiteEfetivo)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 truncate block font-secondary">
            {cartaoAtivo ? (cartaoAtivo.apelido || cartaoAtivo.cartaoNome) : 'Limite Total'}
          </span>
        </div>

        {/* Caixa 4: Saldo Líquido do Mês (Fonte Primária) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] shadow-xs backdrop-blur-md transition-all hover:border-amber-300 dark:hover:border-amber-500/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {mesFoco ? `Saldo (${formatarMesAno(mesFoco)})` : 'Saldo Líquido do Mês'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${saldoMes >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
              {saldoMes >= 0 ? <TrendingUp className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
          </div>
          <span className={`font-num-primary text-xl sm:text-2xl lg:text-3xl font-black block ${saldoMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            R$ {formatarBRL(saldoMes)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block font-secondary">
            {mesFoco ? 'Mês em foco ampliado' : `Mês vigente (${formatarMesAno(mesAtual)})`}
          </span>
        </div>
      </section>

      {/* 2. GRID PRINCIPAL (Cartão na esquerda, Dashboards ao lado) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA ESQUERDA: ÁREA DO CARTÃO COM LIMITE E QUANTIA UTILIZADA EM CIMA */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-panel p-5 sm:p-6 rounded-[28px] border-slate-200/90 dark:border-white/[0.08] shadow-lg space-y-5">
            
            {/* "em cima do cartão colocar o limite e quantia utilizada" */}
            <div className="space-y-2.5 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Quantia Utilizada
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-num-primary text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      R$ {formatarBRL(totalComprometido)}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-num-secondary">
                      {percentualConsumo}%
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-secondary">
                    Limite do Cartão
                  </span>
                  <span className="font-num-secondary text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                    R$ {formatarBRL(limiteEfetivo)}
                  </span>
                </div>
              </div>

              {/* Barra de Progresso do Limite Utilizado */}
              <div className="w-full h-3.5 bg-slate-100 dark:bg-[#04070F]/80 backdrop-blur-md rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/[0.08] shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${corProgresso}`}
                  style={{ width: `${Math.max(2, percentualConsumo)}%` }}
                />
              </div>
            </div>

            {/* O Cartão Visual (Estilo Apple Wallet / ZIXO) */}
            {cartaoAtivo ? (
              <div className="space-y-4">
                <div
                  onClick={() => handleAbrirModalEdicao(cartaoAtivo)}
                  className="w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl border border-slate-200/90 dark:border-white/15 relative group cursor-pointer bg-gradient-to-br from-slate-900 to-black transition-all duration-300 hover:scale-[1.02]"
                  title="Clique para editar dados deste cartão"
                >
                  <img
                    src={cartaoAtivo.imagePath}
                    alt={cartaoAtivo.cartaoNome}
                    className="w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Overlay interativo de Edição */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-xs font-bold text-white bg-black/70 px-3.5 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                      <Edit3 className="w-3.5 h-3.5" /> Editar Cartão
                    </span>
                  </div>

                  {/* Detalhe visual sobreposto */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white/90 text-xs font-mono drop-shadow pointer-events-none">
                    <span className="font-bold tracking-widest">•••• 6050</span>
                    <span className="font-bold uppercase">{cartaoAtivo.bancoNome}</span>
                  </div>
                </div>

                {/* Alternador de Cartões & Botões de Ação */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
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
                            try {
                              localStorage.setItem('moneyhub_cartao_ativo_uid', c.uid);
                            } catch (err) {}
                            notificarAtualizacaoCartoes();
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAbrirModalEdicao(cartaoAtivo)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Editar limite, vencimento ou modelo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAbrirModal}
                      className="px-3 py-2 rounded-xl bg-[#0e4b6c] hover:bg-[#0a3852] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-[#0e4b6c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-[#092b3e]"
                    >
                      <span>+ Cartão</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Banner quando não há cartão cadastrado */
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto text-2xl">
                  💳
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Nenhum cartão cadastrado na carteira
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Adicione seu cartão para visualizar o modelo real estilo Apple Wallet e gerenciar limites.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAbrirModal}
                  className="px-5 py-2.5 rounded-xl bg-[#0e4b6c] hover:bg-[#0a3852] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  + Adicionar Cartão
                </button>
              </div>
            )}

            {/* Painel de Conciliação de Gastos da Fatura Atual */}
            {faturaAtual.temFaturaDeclarada && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50/80 via-white to-amber-50/80 dark:from-rose-500/[0.08] dark:via-[#0C1326]/80 dark:to-amber-500/[0.08] border border-rose-200 dark:border-rose-500/25 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">📑</span>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                        Conciliação da Fatura Atual
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {cartaoAtivo?.apelido || 'Cartão em foco'}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    faturaAtual.pctConciliado >= 100
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40'
                  }`}>
                    {faturaAtual.pctConciliado}% conciliado
                  </span>
                </div>

                {/* Barra de Progresso da Conciliação */}
                <div className="h-2.5 w-full bg-slate-200/80 dark:bg-black/50 rounded-full overflow-hidden p-0.5 border border-slate-300/80 dark:border-white/[0.08]">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      faturaAtual.pctConciliado >= 100
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-r from-rose-500 to-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(3, faturaAtual.pctConciliado))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-medium gap-2">
                  <span className="text-slate-600 dark:text-slate-300">
                    Detalhado: <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">R$ {formatarBRL(faturaAtual.totalItensDetalhados)}</strong>
                  </span>
                  <span>
                    {faturaAtual.diferencaAConciliar > 0 ? (
                      <span className="text-amber-700 dark:text-amber-400 font-semibold font-mono">
                        Pendente: R$ {formatarBRL(faturaAtual.diferencaAConciliar)}
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        ✓ 100% Conciliado
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: DASHBOARDS AO LADO DO CARTÃO COM GRÁFICO DE BARRA E PIZZA + CARTÕES DE CATEGORIAS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. GRÁFICO DE BARRAS: GASTOS MENSAIS (Clique para ampliar, novo clique para minimizar) */}
          <div className="glass-panel p-5 sm:p-6 rounded-[28px] border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  <span>Gastos Mensais</span>
                </h3>
                <p className="text-xs font-secondary text-slate-500 dark:text-slate-400">
                  {mesFoco 
                    ? `Visualizando ${formatarMesAno(mesFoco)} ampliado. Clique na barra ou no botão para minimizar.`
                    : 'Histórico dos últimos meses. Clique em um mês para ampliar.'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-secondary flex-wrap">
                {mesFoco ? (
                  <button
                    type="button"
                    onClick={() => setMesFoco(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="Minimizar e voltar a ver todas as barras"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Minimizar (Ver todas as barras)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">Média Mensal:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.05] px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/[0.08] font-num-secondary">
                      R$ {formatarBRL(historicoGastosMensais.mediaGasto)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Visualização em Barras: MODO AMPLIADO vs MODO MINIMIZADO */}
            {mesFoco ? (
              /* MODO AMPLIADO (Visualiza aquele mês em específico, com clique para minimizar) */
              <div className="pt-2 pb-1">
                <div className="flex items-center justify-between px-2 sm:px-8">
                  {/* Navegação Mês Anterior */}
                  <button
                    type="button"
                    onClick={() => {
                      const idx = historicoGastosMensais.lista.findIndex(i => i.mes === mesFoco);
                      if (idx > 0) {
                        setMesFoco(historicoGastosMensais.lista[idx - 1].mes);
                      }
                    }}
                    disabled={historicoGastosMensais.lista.findIndex(i => i.mes === mesFoco) <= 0}
                    className="p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                    title="Mês anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Barra Central Ampliada */}
                  {(() => {
                    const itemFoco = historicoGastosMensais.lista.find(i => i.mes === mesFoco) || {
                      mes: mesFoco,
                      mesLabel: formatarMesAno(mesFoco),
                      mesCurto: mesFoco.slice(5, 7),
                      valor: totalSaidasMes
                    };

                    return (
                      <div
                        onClick={() => setMesFoco(null)}
                        className="flex flex-col items-center justify-end h-48 sm:h-56 w-36 sm:w-44 cursor-pointer group select-none transition-all"
                        title="Clique novamente na barra para minimizar e voltar a ver todas as barras"
                      >
                        {/* Valor Flutuante Ampliado */}
                        <div className="mb-2 text-center">
                          <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-num-primary block scale-110 drop-shadow-sm">
                            R$ {formatarBRL(itemFoco.valor)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-secondary block mt-0.5 group-hover:text-emerald-500 transition-colors">
                            (Clique para minimizar)
                          </span>
                        </div>

                        {/* Barra Vertical Ampliada */}
                        <div className="w-20 sm:w-24 h-36 sm:h-40 flex items-end justify-center">
                          <div
                            className="w-full h-full rounded-2xl bg-gradient-to-t from-emerald-600 to-teal-400 shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-400/40 relative overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-emerald-500/50"
                          />
                        </div>

                        {/* Etiqueta do Mês Ampliada */}
                        <div className="mt-2 text-center">
                          <span className="text-sm font-black uppercase text-emerald-600 dark:text-emerald-400 font-secondary block">
                            {itemFoco.mesCurto}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-secondary">
                            {itemFoco.mesLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Navegação Próximo Mês */}
                  <button
                    type="button"
                    onClick={() => {
                      const idx = historicoGastosMensais.lista.findIndex(i => i.mes === mesFoco);
                      if (idx >= 0 && idx < historicoGastosMensais.lista.length - 1) {
                        setMesFoco(historicoGastosMensais.lista[idx + 1].mes);
                      }
                    }}
                    disabled={historicoGastosMensais.lista.findIndex(i => i.mes === mesFoco) >= historicoGastosMensais.lista.length - 1}
                    className="p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                    title="Próximo mês"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* MODO MINIMIZADO (Todas as barras visíveis lado a lado como estava) */
              <div className="pt-2 pb-1">
                <div className="flex items-end justify-around h-44 sm:h-52 px-2 gap-2 sm:gap-4 max-w-full overflow-x-auto">
                  {historicoGastosMensais.lista.map((item) => {
                    const heightPct = historicoGastosMensais.maxGasto > 0 
                      ? Math.max(12, Math.round((item.valor / historicoGastosMensais.maxGasto) * 100))
                      : 12;

                    return (
                      <div
                        key={item.mes}
                        onClick={() => handleToggleMes(item.mes)}
                        className="flex-1 max-w-[80px] flex flex-col items-center justify-end h-full gap-2 cursor-pointer group select-none transition-all"
                        title={`${item.mesLabel}: R$ ${formatarBRL(item.valor)} (Clique para ampliar)`}
                      >
                        {/* Valor Flutuante */}
                        <span className="text-[10px] sm:text-xs font-bold transition-all truncate max-w-full text-center text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-num-secondary group-hover:scale-105">
                          {item.valor >= 1000 ? `${(item.valor / 1000).toFixed(1)}k` : `R$ ${Math.round(item.valor)}`}
                        </span>

                        {/* Barra Vertical */}
                        <div className="w-full max-w-[48px] h-full flex items-end justify-center">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full rounded-2xl transition-all duration-500 relative overflow-hidden bg-slate-200 hover:bg-gradient-to-t hover:from-emerald-600 hover:to-teal-400 dark:bg-white/[0.07] dark:hover:bg-gradient-to-t dark:hover:from-emerald-600 dark:hover:to-teal-400 group-hover:shadow-md group-hover:ring-2 group-hover:ring-emerald-400/30"
                          />
                        </div>

                        {/* Etiqueta do Mês */}
                        <span className="text-[11px] sm:text-xs font-bold uppercase transition-all font-secondary text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:font-black">
                          {item.mesCurto}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resumo Inferior: Mês em Foco ou Visão Consolidada */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400 font-secondary">
                  {mesFoco ? (
                    <>
                      Mês em foco: <strong className="text-slate-900 dark:text-white capitalize">{formatarMesAno(mesFoco)}</strong>
                    </>
                  ) : (
                    <>
                      Visão consolidada: <strong className="text-slate-900 dark:text-white capitalize">Todos os Meses</strong>
                    </>
                  )}
                </span>
                {mesFoco && (
                  <button
                    type="button"
                    onClick={() => setMesFoco(null)}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    (minimizar)
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold font-num-primary">
                  Receitas: R$ {formatarBRL(totalEntradasMes)}
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-bold font-num-primary">
                  Despesas: R$ {formatarBRL(totalSaidasMes)}
                </span>
                <span className={`font-black font-num-primary ${saldoMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  Saldo: R$ {formatarBRL(saldoMes)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. GASTOS POR CATEGORIA: GRÁFICO DE BARRAS EMPILHADAS NA VERTICAL + CARTÕES */}
          <div className="glass-panel p-5 sm:p-6 rounded-[28px] border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  <span>Gastos por Categoria</span>
                </h3>
                <p className="text-xs font-secondary text-slate-500 dark:text-slate-400">
                  Gráfico de barras empilhadas na vertical com a distribuição e cartões detalhados por categoria.
                </p>
              </div>

              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.05] px-3 py-1 rounded-full border border-slate-200 dark:border-white/[0.08] self-start sm:self-auto font-num-secondary">
                Total de Gastos: R$ {formatarBRL(totalCategorias)}
              </span>
            </div>

            {totalCategorias === 0 ? (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-secondary">
                Nenhuma despesa registrada para {mesFoco ? formatarMesAno(mesFoco) : 'o período selecionado'}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* GRÁFICO DE BARRAS EMPILHADAS NA VERTICAL */}
                <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    {/* Escala Percentual Vertical */}
                    <div className="flex flex-col justify-between h-[250px] text-[10px] font-mono text-slate-400 dark:text-slate-500 select-none text-right py-1 font-num-secondary">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>

                    {/* Coluna da Barra Empilhada Vertical */}
                    <div className="relative w-16 sm:w-20 h-[250px] rounded-2xl overflow-hidden bg-slate-200/60 dark:bg-white/[0.05] border border-slate-300/80 dark:border-white/10 shadow-inner flex flex-col-reverse">
                      {categoriasAgrupadas.map((cat) => {
                        const isHovered = categoriaHover === cat.nome;
                        const isAnyHovered = Boolean(categoriaHover);

                        return (
                          <div
                            key={cat.nome}
                            style={{ 
                              height: `${cat.porcentagem}%`, 
                              backgroundColor: cat.cor 
                            }}
                            onMouseEnter={() => setCategoriaHover(cat.nome)}
                            onMouseLeave={() => setCategoriaHover(null)}
                            className={`w-full transition-all duration-300 relative group cursor-pointer flex items-center justify-center border-t border-white/20 first:border-t-0 ${
                              isHovered 
                                ? 'brightness-125 z-10 scale-[1.03] shadow-md ring-2 ring-white/60' 
                                : isAnyHovered 
                                  ? 'opacity-40' 
                                  : 'hover:brightness-110'
                            }`}
                            title={`${cat.nome}: R$ ${formatarBRL(cat.valor)} (${cat.porcentagem.toFixed(1)}%)`}
                          >
                            {/* Percentual dentro do segmento se altura for suficiente */}
                            {cat.porcentagem >= 12 && (
                              <span className="text-[11px] font-black text-white drop-shadow select-none font-num-secondary">
                                {cat.porcentagem.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legenda sob a barra empilhada */}
                  <div className="mt-3 text-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-secondary block">
                      100% dos Gastos do Mês
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 font-secondary">
                      {categoriasAgrupadas.length} {categoriasAgrupadas.length === 1 ? 'categoria' : 'categorias'} empilhadas
                    </span>
                  </div>
                </div>

                {/* GASTOS POR CATEGORIA: CARTÕES DETALHADOS REESTRUTURADOS */}
                <div className="md:col-span-7 lg:col-span-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                    {categoriasAgrupadas.map((cat) => {
                      const isHovered = categoriaHover === cat.nome;

                      return (
                        <div
                          key={cat.nome}
                          onMouseEnter={() => setCategoriaHover(cat.nome)}
                          onMouseLeave={() => setCategoriaHover(null)}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                            isHovered
                              ? 'border-amber-400 dark:border-amber-400 bg-white dark:bg-white/[0.08] shadow-md scale-[1.02]'
                              : 'bg-slate-50/90 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-xs"
                                style={{ 
                                  backgroundColor: `${cat.cor}20`,
                                  border: `1px solid ${cat.cor}40`
                                }}
                              >
                                <span>{ICONES_CATEGORIAS[cat.nome] || '🏷️'}</span>
                              </div>
                              <div className="min-w-0">
                                <span className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                  {cat.nome}
                                </span>
                                <span className="block text-base font-black text-slate-900 dark:text-white mt-1 font-num-secondary">
                                  R$ {formatarBRL(cat.valor)}
                                </span>
                              </div>
                            </div>

                            <span
                              className="px-2.5 py-1 rounded-full text-xs font-bold border font-num-secondary flex-shrink-0 self-start"
                              style={{
                                backgroundColor: `${cat.cor}18`,
                                color: cat.cor,
                                borderColor: `${cat.cor}35`
                              }}
                            >
                              {cat.porcentagem.toFixed(1)}%
                            </span>
                          </div>

                          {/* Mini barra horizontal proporcional */}
                          <div className="w-full h-1.5 rounded-full bg-slate-200/70 dark:bg-white/[0.08] overflow-hidden mt-3">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${cat.porcentagem}%`,
                                backgroundColor: cat.cor
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. MODAL DE ADICIONAR OU EDITAR CARTÃO */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fadeIn"
          onClick={handleFecharModal}
        >
          <div
            className="glass-panel max-w-5xl w-full p-6 sm:p-8 md:p-9 rounded-[32px] border border-slate-200/90 dark:border-white/10 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                  <CreditCard className="w-6 h-6 text-rose-500" />
                  <span>{modoModal === 'editar' ? 'Editar Dados do Cartão' : 'Cadastrar Novo Cartão'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {modoModal === 'editar'
                    ? 'Ajuste o limite cadastrado, dia de vencimento ou modelo do seu cartão.'
                    : 'Selecione a instituição financeira e o modelo para integrar seu cartão à carteira.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleFecharModal}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-300 dark:border-white/15 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarCartaoQuestionario} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Campos do Questionário (7 colunas) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        1. Instituição Emissora
                      </label>
                      <select
                        value={modalBanco}
                        onChange={handleModalBancoChange}
                        className="glass-input w-full px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-black/50 cursor-pointer"
                        required
                      >
                        <option value="">Selecione o banco...</option>
                        {Object.entries(mockCardsCatalog).map(([chave, banco]) => (
                          <option key={chave} value={chave}>
                            {banco.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        2. Modelo do Cartão
                      </label>
                      <select
                        value={modalCartaoId}
                        onChange={(e) => setModalCartaoId(e.target.value)}
                        disabled={!modalBanco}
                        className="glass-input w-full px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-black/50 cursor-pointer disabled:opacity-50"
                        required
                      >
                        <option value="">
                          {modalBanco ? 'Selecione o modelo...' : 'Escolha o banco primeiro'}
                        </option>
                        {modalCartoesDisponiveis.map((cartao) => (
                          <option key={cartao.id} value={cartao.id}>
                            {cartao.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        3. Limite do Cartão (R$)
                      </label>
                      <input
                        type="number"
                        step="50"
                        min="100"
                        value={modalLimite}
                        onChange={(e) => setModalLimite(e.target.value)}
                        className="glass-input w-full px-3.5 py-2.5 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        4. Dia do Vencimento
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={modalDiaVenc}
                        onChange={(e) => setModalDiaVenc(e.target.value)}
                        className="glass-input w-full px-3.5 py-2.5 text-sm font-mono font-bold text-amber-600 dark:text-amber-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      5. Apelido / Nome Amigável (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex.: Meu Nubank Pessoal, Cartão Inter Compras"
                      value={modalApelido}
                      onChange={(e) => setModalApelido(e.target.value)}
                      className="glass-input w-full px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>

                {/* Preview Visual do Cartão (5 colunas) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Preview do Cartão
                  </span>
                  {modalCartaoPreview ? (
                    <div className="w-full max-w-[280px] aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-white/20 transition-transform duration-300 hover:scale-105">
                      <img
                        src={modalCartaoPreview.imagePath}
                        alt={modalCartaoPreview.nome}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-[280px] aspect-[1.586/1] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                      <CreditCard className="w-8 h-8 mb-2 opacity-40" />
                      <span>Selecione banco e modelo para visualizar o cartão estilo Apple Wallet</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação do Modal */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/[0.08]">
                {modoModal === 'editar' && cartaoEmEdicaoUid ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja remover este cartão da carteira?')) {
                        handleRemoverCartao(cartaoEmEdicaoUid);
                        setModalAberto(false);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover Cartão</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleFecharModal}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!modalBanco || !modalCartaoPreview}
                    className="px-6 py-2.5 rounded-xl bg-[#0e4b6c] hover:bg-[#0a3852] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#0e4b6c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {modoModal === 'editar' ? 'Salvar Alterações' : 'Adicionar à Carteira'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
