/* ==========================================================================
   MoneyHub — Núcleo Compartilhado (app/app.js)
   Gerenciamento de Estado Global, Persistência e Utilitários
   ========================================================================== */

(function () {
  'use strict';

  // --- Configuração Supabase & Nuvem ---
  const SUPABASE_URL = window.SUPABASE_URL || 'https://sywvuaugyuxjhvpgmvxz.supabase.co';
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_kIPPe6HSm1gXNE7CJXZ9Ug_KbCgbg8J';
  const USUARIO_ID = 'meu-cofre-secreto';
  const TABELA_NUVEM = 'moneyhub_nuvem';

  // Inicialização do cliente Supabase no escopo global
  const supabase = (typeof window.supabase !== 'undefined' && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  window.supabaseClient = supabase;

  // --- Padrões da Aplicação ---
  const PERCENTUAL_INVESTIMENTO_PADRAO= '20';
  const PERCENTUAL_RESERVA_PADRAO     = '10';
  const TAXA_MENSAL_PADRAO            = '0.8';
  const PRAZO_ANOS_PADRAO             = '10';

  // --- Formatadores ---
  const formatterBRL = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const NOMES_MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // --- Barramento de Eventos ---
  const ouvintes = {};
  function on(evento, callback) {
    if (!ouvintes[evento]) ouvintes[evento] = [];
    ouvintes[evento].push(callback);
  }

  function emit(evento, dados) {
    if (ouvintes[evento]) {
      ouvintes[evento].forEach(fn => {
        try { fn(dados); } catch (e) { console.error(e); }
      });
    }
  }

  // --- Funções Utilitárias Numéricas e de Data ---
  function paraNumero(valorTexto) {
    let texto = String(valorTexto || '').trim();
    if (texto.includes(',')) {
      texto = texto.replace(/\./g, '');
      texto = texto.replace(',', '.');
    }
    const numero = parseFloat(texto);
    return Number.isFinite(numero) ? numero : 0;
  }

  function paraNumeroMonetario(valorTexto) {
    return Math.max(0, paraNumero(valorTexto));
  }

  function paraPercentual(valorTexto) {
    return Math.min(100, Math.max(0, paraNumero(valorTexto)));
  }

  function evitarNegativoZero(valor) {
    return valor < 0 && Math.abs(valor) < 0.005 ? 0 : valor;
  }

  function formatarBRL(valor) {
    return formatterBRL.format(evitarNegativoZero(valor));
  }

  function obterDataHojeISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function formatarDataBR(dataISO) {
    if (!dataISO || typeof dataISO !== 'string') return '';
    const partes = dataISO.split('-');
    if (partes.length !== 3) return dataISO;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  function formatarMesAno(anoMes) {
    const [ano, mes] = anoMes.split('-');
    const indice = parseInt(mes, 10) - 1;
    const nomeMes = NOMES_MESES[indice] || mes;
    return `${nomeMes} de ${ano}`;
  }

  function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // --- Operações com Listas ---
  function somarLancamentos(lista) {
    return (lista || []).reduce((acc, item) => acc + item.valor, 0);
  }

  function somarPorCategoria(lista, categoria) {
    return (lista || [])
      .filter(item => item.categoria === categoria)
      .reduce((acc, item) => acc + item.valor, 0);
  }

  // --- Estado Global Compartilhado ---
  const state = {
    entradas: [],
    saidas: [],
    historicoInvestimentos: [],
    percentualInvestimento: PERCENTUAL_INVESTIMENTO_PADRAO,
    percentualReserva: PERCENTUAL_RESERVA_PADRAO,
    aporteExtra: '',
    taxaProjecao: TAXA_MENSAL_PADRAO,
    anosProjecao: PRAZO_ANOS_PADRAO,
    aporteFuturoManual: '',
    usuarioEditouAporteFuturo: false,
    investimentoTotalAtual: 0
  };

  // --- Sanitização de Dados ---
  function sanitizarLancamentos(lista, categoriasValidas, categoriaPadrao) {
    if (!Array.isArray(lista)) return [];
    return lista
      .filter(item => item && typeof item.descricao === 'string' && typeof item.valor === 'number')
      .map(item => ({
        id: item.id || gerarId(),
        descricao: item.descricao.trim(),
        valor: Math.max(0, item.valor),
        categoria: categoriasValidas.includes(item.categoria) ? item.categoria : categoriaPadrao,
        data: (item.data && typeof item.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.data))
          ? item.data
          : obterDataHojeISO()
      }));
  }

  function sanitizarInvestimentos(lista) {
    if (!Array.isArray(lista)) return [];
    return lista
      .filter(item => item && typeof item.valor === 'number')
      .map(item => ({
        id: item.id || gerarId(),
        data: (item.data && typeof item.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.data))
          ? item.data
          : obterDataHojeISO(),
        valor: Math.max(0, item.valor)
      }));
  }

  // --- Padrões de Categorias ---
  const CATEGORIAS_ENTRADA_PADRAO_LISTA = ['Salário', 'Dividendos', 'Rendimentos', 'Estorno/Devolução', 'Outros'];
  const CATEGORIAS_SAIDA_PADRAO_LISTA   = [
    'Alimentação', 'Mercado', 'Transporte', 'Saúde', 'Educação',
    'Comunicação', 'Compras', 'Serviços', 'Transferências/Pagamentos pessoais', 'Não identificado'
  ];

  // --- Controle de Sincronização & Realtime ---
  let canalRealtime = null;
  let estaAtualizandoRealtime = false;
  let ultimoPacoteSalvoJSON = '';

  function renderizarTudo() {
    // 1. Notificar ouvintes no barramento de eventos interno
    emit('dadosAtualizados', state);
    emit('realtimeUpdate', state);

    // 2. Disparar evento customizado no Window
    try {
      window.dispatchEvent(new CustomEvent('moneyhub:atualizar', { detail: state }));
    } catch (e) {}

    // 3. Executar funções de renderização globais disponíveis
    if (typeof window.renderizarTudo === 'function' && window.renderizarTudo !== renderizarTudo) {
      try { window.renderizarTudo(); } catch (e) { console.error(e); }
    }
    if (typeof window.atualizarDashboard === 'function') {
      try { window.atualizarDashboard(); } catch (e) { console.error(e); }
    }
    if (typeof window.atualizarGraficos === 'function') {
      try { window.atualizarGraficos(); } catch (e) { console.error(e); }
    }
    if (typeof window.renderizarGraficos === 'function') {
      try { window.renderizarGraficos(); } catch (e) { console.error(e); }
    }
  }

  function aplicarNovosDados(novosDados, novoHistorico) {
    let dados = novosDados;
    if (typeof dados === 'string') {
      try { dados = JSON.parse(dados); } catch (e) { dados = {}; }
    }
    dados = (dados && typeof dados === 'object') ? dados : {};

    let historico = novoHistorico;
    if (typeof historico === 'string') {
      try { historico = JSON.parse(historico); } catch (e) { historico = null; }
    }
    if (!historico && dados.historicoInvestimentos) {
      historico = dados.historicoInvestimentos;
    } else if (!historico && dados.historico) {
      historico = dados.historico;
    }

    if (Array.isArray(dados.entradas)) {
      state.entradas = sanitizarLancamentos(dados.entradas, CATEGORIAS_ENTRADA_PADRAO_LISTA, 'Outros');
    }
    if (Array.isArray(dados.saidas)) {
      state.saidas = sanitizarLancamentos(dados.saidas, CATEGORIAS_SAIDA_PADRAO_LISTA, 'Não identificado');
    }
    if (Array.isArray(historico)) {
      state.historicoInvestimentos = sanitizarInvestimentos(historico);
    }

    if (dados.percentualInvestimento !== undefined) {
      state.percentualInvestimento = String(dados.percentualInvestimento);
    }
    if (dados.percentualReserva !== undefined) {
      state.percentualReserva = String(dados.percentualReserva);
    }
    if (dados.aporteExtra !== undefined) {
      state.aporteExtra = String(dados.aporteExtra);
    }
    if (dados.taxaProjecao !== undefined) {
      state.taxaProjecao = String(dados.taxaProjecao);
    }
    if (dados.anosProjecao !== undefined) {
      state.anosProjecao = String(dados.anosProjecao);
    }
    if (dados.aporteFuturoManual !== undefined) {
      state.aporteFuturoManual = String(dados.aporteFuturoManual);
    }
    if (dados.usuarioEditouAporteFuturo !== undefined) {
      state.usuarioEditouAporteFuturo = Boolean(dados.usuarioEditouAporteFuturo);
    }
    if (dados.investimentoTotalAtual !== undefined) {
      state.investimentoTotalAtual = Number(dados.investimentoTotalAtual) || 0;
    }
  }

  function processarAtualizacaoRealtime(payload) {
    if (!payload || !payload.new) return;
    if (payload.new.id && payload.new.id !== USUARIO_ID) return;

    const novosDados = payload.new.dados;
    const novoHistorico = payload.new.historico;

    // Se os novos dados forem exatamente o que acabamos de salvar localmente, ignorar eco
    if (novosDados) {
      const novosDadosJSON = typeof novosDados === 'string' ? novosDados : JSON.stringify(novosDados);
      if (novosDadosJSON === ultimoPacoteSalvoJSON) {
        return;
      }
    }

    estaAtualizandoRealtime = true;
    try {
      aplicarNovosDados(novosDados, novoHistorico);
      renderizarTudo();
    } catch (err) {
      console.warn('MoneyHub (Realtime): Erro ao aplicar atualização:', err);
    } finally {
      estaAtualizandoRealtime = false;
    }
  }

  function iniciarRealtime() {
    if (!supabase || canalRealtime) return;

    try {
      canalRealtime = supabase
        .channel('moneyhub_nuvem_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABELA_NUVEM,
            filter: `id=eq.${USUARIO_ID}`
          },
          (payload) => {
            processarAtualizacaoRealtime(payload);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('MoneyHub (Realtime): Erro ao configurar canal:', err);
    }
  }

  // --- Persistência em Nuvem (Supabase) ---
  async function salvarDados() {
    if (!supabase || estaAtualizandoRealtime) return;
    try {
      const pacote = {
        entradas: state.entradas,
        saidas: state.saidas,
        historicoInvestimentos: state.historicoInvestimentos,
        percentualInvestimento: state.percentualInvestimento,
        percentualReserva: state.percentualReserva,
        aporteExtra: state.aporteExtra,
        taxaProjecao: state.taxaProjecao,
        anosProjecao: state.anosProjecao,
        aporteFuturoManual: state.aporteFuturoManual,
        usuarioEditouAporteFuturo: state.usuarioEditouAporteFuturo
      };

      ultimoPacoteSalvoJSON = JSON.stringify(pacote);

      const { error } = await supabase
        .from(TABELA_NUVEM)
        .upsert({ id: USUARIO_ID, dados: pacote });

      if (error) {
        // Fallback caso a tabela aceite colunas no nível raiz
        if (error.message && (error.message.includes('dados') || error.code === 'PGRST204')) {
          const { error: fallbackErr } = await supabase
            .from(TABELA_NUVEM)
            .upsert({ id: USUARIO_ID, ...pacote });
          if (fallbackErr) {
            console.warn('MoneyHub (Supabase): Erro ao salvar dados:', fallbackErr.message);
          }
        } else {
          console.warn('MoneyHub (Supabase): Erro ao salvar dados:', error.message);
        }
      }
    } catch (err) {
      console.warn('MoneyHub: Erro de rede ao salvar na nuvem:', err);
    }
  }

  async function carregarDados(categoriasEntrada = [], categoriaEntradaPadrao = 'Outros', categoriasSaida = [], categoriaSaidaPadrao = 'Não identificado') {
    function redefinirPadroes() {
      state.entradas = [];
      state.saidas = [];
      state.historicoInvestimentos = [];
      state.percentualInvestimento = PERCENTUAL_INVESTIMENTO_PADRAO;
      state.percentualReserva = PERCENTUAL_RESERVA_PADRAO;
      state.aporteExtra = '';
      state.taxaProjecao = TAXA_MENSAL_PADRAO;
      state.anosProjecao = PRAZO_ANOS_PADRAO;
      state.aporteFuturoManual = '';
      state.usuarioEditouAporteFuturo = false;
    }

    if (!supabase) {
      redefinirPadroes();
      return state;
    }

    try {
      const { data, error } = await supabase
        .from(TABELA_NUVEM)
        .select('*')
        .eq('id', USUARIO_ID)
        .maybeSingle();

      if (error) {
        console.warn('MoneyHub (Supabase): Erro ao carregar dados:', error.message);
        redefinirPadroes();
        iniciarRealtime();
        return state;
      }

      if (data) {
        const dados = (data.dados && typeof data.dados === 'object') ? data.dados : data;
        const historico = data.historico || (dados && (dados.historicoInvestimentos || dados.historico));

        state.entradas = sanitizarLancamentos(dados.entradas, categoriasEntrada.length ? categoriasEntrada : CATEGORIAS_ENTRADA_PADRAO_LISTA, categoriaEntradaPadrao);
        state.saidas   = sanitizarLancamentos(dados.saidas, categoriasSaida.length ? categoriasSaida : CATEGORIAS_SAIDA_PADRAO_LISTA, categoriaSaidaPadrao);
        state.historicoInvestimentos = sanitizarInvestimentos(historico || dados.historicoInvestimentos);
        state.percentualInvestimento = String(dados.percentualInvestimento ?? PERCENTUAL_INVESTIMENTO_PADRAO);
        state.percentualReserva      = String(dados.percentualReserva ?? PERCENTUAL_RESERVA_PADRAO);
        state.aporteExtra            = String(dados.aporteExtra || '');
        state.taxaProjecao           = String(dados.taxaProjecao ?? TAXA_MENSAL_PADRAO);
        state.anosProjecao           = String(dados.anosProjecao ?? PRAZO_ANOS_PADRAO);
        state.aporteFuturoManual     = String(dados.aporteFuturoManual || '');
        state.usuarioEditouAporteFuturo = Boolean(dados.usuarioEditouAporteFuturo);
      } else {
        redefinirPadroes();
      }

      // Inicializa escuta ativa em tempo real logo após carregar os dados iniciais
      iniciarRealtime();
    } catch (err) {
      console.warn('MoneyHub: Falha de rede ao carregar dados:', err);
      redefinirPadroes();
      iniciarRealtime();
    }

    return state;
  }

  async function limparDados() {
    if (!confirm('Deseja realmente limpar todos os dados cadastrados?')) return;

    const pacoteVazio = {
      entradas: [],
      saidas: [],
      historicoInvestimentos: [],
      percentualInvestimento: PERCENTUAL_INVESTIMENTO_PADRAO,
      percentualReserva: PERCENTUAL_RESERVA_PADRAO,
      aporteExtra: '',
      taxaProjecao: TAXA_MENSAL_PADRAO,
      anosProjecao: PRAZO_ANOS_PADRAO,
      aporteFuturoManual: '',
      usuarioEditouAporteFuturo: false
    };

    if (supabase) {
      try {
        const { error } = await supabase
          .from(TABELA_NUVEM)
          .upsert({ id: USUARIO_ID, dados: pacoteVazio });

        if (error) {
          if (error.message && (error.message.includes('dados') || error.code === 'PGRST204')) {
            const { error: fallbackErr } = await supabase
              .from(TABELA_NUVEM)
              .upsert({ id: USUARIO_ID, ...pacoteVazio });
            if (fallbackErr) {
              console.warn('MoneyHub (Supabase): Erro ao limpar dados:', fallbackErr.message);
            }
          } else {
            console.warn('MoneyHub (Supabase): Erro ao limpar dados:', error.message);
          }
        }
      } catch (err) {
        console.warn('MoneyHub: Falha de rede ao limpar dados:', err);
      }
    }

    state.entradas = [];
    state.saidas = [];
    state.historicoInvestimentos = [];
    state.percentualInvestimento = PERCENTUAL_INVESTIMENTO_PADRAO;
    state.percentualReserva = PERCENTUAL_RESERVA_PADRAO;
    state.aporteExtra = '';
    state.taxaProjecao = TAXA_MENSAL_PADRAO;
    state.anosProjecao = PRAZO_ANOS_PADRAO;
    state.aporteFuturoManual = '';
    state.usuarioEditouAporteFuturo = false;
    state.investimentoTotalAtual = 0;

    window.location.reload();
  }

  function inicializarBotaoLimpar() {
    const botaoLimpar = document.getElementById('limpar-dados');
    if (botaoLimpar) {
      botaoLimpar.addEventListener('click', limparDados);
    }
  }

  // --- Exportação Global ---
  window.MoneyHub = {
    state,
    on,
    emit,
    paraNumero,
    paraNumeroMonetario,
    paraPercentual,
    evitarNegativoZero,
    formatarBRL,
    obterDataHojeISO,
    formatarDataBR,
    formatarMesAno,
    gerarId,
    somarLancamentos,
    somarPorCategoria,
    salvarDados,
    carregarDados,
    limparDados,
    supabase,
    USUARIO_ID,
    iniciarRealtime,
    renderizarTudo
  };

  if (typeof window.renderizarTudo !== 'function') {
    window.renderizarTudo = renderizarTudo;
  }

  document.addEventListener('DOMContentLoaded', inicializarBotaoLimpar);

})();
