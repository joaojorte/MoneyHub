/* ==========================================================================
   MoneyHub — Núcleo Compartilhado (app/app.js)
   Gerenciamento de Estado Global, Persistência e Utilitários
   ========================================================================== */

(function () {
  'use strict';

  // --- Constantes de Armazenamento e Padrões ---
  const CHAVE_ARMAZENAMENTO           = 'moneyhub-dados';
  const CHAVE_HISTORICO_INVESTIMENTOS = 'historicoInvestimentos';
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

  // --- Persistência LocalStorage ---
  function salvarDados() {
    try {
      const dados = {
        entradas: state.entradas,
        saidas: state.saidas,
        percentualInvestimento: state.percentualInvestimento,
        percentualReserva: state.percentualReserva,
        aporteExtra: state.aporteExtra,
        taxaProjecao: state.taxaProjecao,
        anosProjecao: state.anosProjecao,
        aporteFuturoManual: state.aporteFuturoManual,
        usuarioEditouAporteFuturo: state.usuarioEditouAporteFuturo
      };
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(dados));
      localStorage.setItem(CHAVE_HISTORICO_INVESTIMENTOS, JSON.stringify(state.historicoInvestimentos));
    } catch (err) {
      console.warn('MoneyHub: Erro ao salvar dados no localStorage', err);
    }
  }

  function carregarDados(categoriasEntrada = [], categoriaEntradaPadrao = 'Outros', categoriasSaida = [], categoriaSaidaPadrao = 'Não identificado') {
    try {
      const dadosSerializados = localStorage.getItem(CHAVE_ARMAZENAMENTO);
      if (dadosSerializados) {
        const dados = JSON.parse(dadosSerializados);
        state.entradas = sanitizarLancamentos(dados.entradas, categoriasEntrada, categoriaEntradaPadrao);
        state.saidas   = sanitizarLancamentos(dados.saidas, categoriasSaida, categoriaSaidaPadrao);
        state.percentualInvestimento = String(dados.percentualInvestimento ?? PERCENTUAL_INVESTIMENTO_PADRAO);
        state.percentualReserva      = String(dados.percentualReserva ?? PERCENTUAL_RESERVA_PADRAO);
        state.aporteExtra            = String(dados.aporteExtra || '');
        state.taxaProjecao           = String(dados.taxaProjecao ?? TAXA_MENSAL_PADRAO);
        state.anosProjecao           = String(dados.anosProjecao ?? PRAZO_ANOS_PADRAO);
        state.aporteFuturoManual     = String(dados.aporteFuturoManual || '');
        state.usuarioEditouAporteFuturo = Boolean(dados.usuarioEditouAporteFuturo);
      } else {
        state.entradas = [];
        state.saidas = [];
        state.percentualInvestimento = PERCENTUAL_INVESTIMENTO_PADRAO;
        state.percentualReserva = PERCENTUAL_RESERVA_PADRAO;
        state.aporteExtra = '';
        state.taxaProjecao = TAXA_MENSAL_PADRAO;
        state.anosProjecao = PRAZO_ANOS_PADRAO;
        state.aporteFuturoManual = '';
        state.usuarioEditouAporteFuturo = false;
      }

      const investSerializados = localStorage.getItem(CHAVE_HISTORICO_INVESTIMENTOS);
      if (investSerializados) {
        state.historicoInvestimentos = sanitizarInvestimentos(JSON.parse(investSerializados));
      } else {
        state.historicoInvestimentos = [];
      }
    } catch (err) {
      console.warn('MoneyHub: Erro ao ler dados do localStorage', err);
    }
    return state;
  }

  function limparDados() {
    if (!confirm('Deseja realmente limpar todos os dados cadastrados?')) return;
    try {
      localStorage.removeItem(CHAVE_ARMAZENAMENTO);
      localStorage.removeItem(CHAVE_HISTORICO_INVESTIMENTOS);
    } catch (err) {
      console.warn('MoneyHub: Erro ao limpar localStorage', err);
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
    limparDados
  };

  document.addEventListener('DOMContentLoaded', inicializarBotaoLimpar);

})();
