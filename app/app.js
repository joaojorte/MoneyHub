/* ==========================================================================
   MoneyHub — Núcleo Compartilhado (app/app.js)
   Gerenciamento de Estado Global, Persistência e Utilitários
   ========================================================================== */

(function () {
  'use strict';

  // --- Configuração Supabase & Nuvem ---
  const SUPABASE_URL = window.SUPABASE_URL || 'https://sywvuaugyuxjhvpgmvxz.supabase.co';
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_kIPPe6HSm1gXNE7CJXZ9Ug_KbCgbg8J';
  const TABELA_NUVEM = 'moneyhub_nuvem';
  let currentUser = null;

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
      .map(item => {
        const itemSanitizado = {
          id: item.id || gerarId(),
          descricao: item.descricao.trim(),
          valor: Math.max(0, item.valor),
          categoria: categoriasValidas.includes(item.categoria) ? item.categoria : categoriaPadrao,
          data: (item.data && typeof item.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.data))
            ? item.data
            : obterDataHojeISO()
        };

        if (item.detalhamento && typeof item.detalhamento === 'string') {
          itemSanitizado.detalhamento = item.detalhamento.trim();
        }

        if (typeof item.conveniencia === 'boolean') {
          itemSanitizado.conveniencia = item.conveniencia;
        }

        return itemSanitizado;
      });
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
    'Comunicação', 'Compras', 'Serviços', 'Transferências/Pagamentos pessoais', 'Outros', 'Não identificado'
  ];

  // --- Controle de Sincronização Simultânea & Realtime ---
  const MEU_CLIENTE_ID = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  let canalRealtime = null;
  let estaAtualizandoRealtime = false;
  let ultimoPacoteSalvoJSON = '';
  let pollingAtivo = false;

  // Canal de sincronização local entre abas do mesmo navegador (latência < 2ms)
  let localBroadcast = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      localBroadcast = new BroadcastChannel('moneyhub_simultaneo_sync');
      localBroadcast.onmessage = function (ev) {
        if (ev && ev.data && currentUser && ev.data.user_id === currentUser.id && ev.data.clienteId !== MEU_CLIENTE_ID) {
          processarAtualizacaoRealtime({ new: ev.data });
        }
      };
    }
  } catch (e) {}

  // Fallback de sincronização local via evento Storage (compatibilidade total)
  window.addEventListener('storage', function (e) {
    if (e.key === 'moneyhub_sync_event' && e.newValue) {
      try {
        const pacote = JSON.parse(e.newValue);
        if (pacote && currentUser && pacote.user_id === currentUser.id && pacote.clienteId !== MEU_CLIENTE_ID) {
          processarAtualizacaoRealtime({ new: pacote });
        }
      } catch (err) {}
    }
  });

  // --- Funções do Supabase Auth ---
  async function signIn(email, password) {
    if (!supabase) throw new Error('Cliente Supabase indisponível.');
    return await supabase.auth.signInWithPassword({ email, password });
  }

  async function signUp(email, password) {
    if (!supabase) throw new Error('Cliente Supabase indisponível.');
    return await supabase.auth.signUp({ email, password });
  }

  async function signOut() {
    if (!supabase) return;
    return await supabase.auth.signOut();
  }

  async function obterUsuarioAtual() {
    if (currentUser) return currentUser;
    if (!supabase) return null;
    try {
      const { data } = await supabase.auth.getUser();
      currentUser = data && data.user ? data.user : null;
      return currentUser;
    } catch (e) {
      return null;
    }
  }

  // --- Controle de Interface & Telas de Autenticação ---
  function alternarVisibilidadeApp(autenticado, userEmail = '') {
    const authScreen = document.getElementById('auth-screen');
    const navTabs = document.querySelector('.nav-tabs');
    const abaCalculadora = document.getElementById('aba-calculadora');
    const abaDashboard = document.getElementById('aba-dashboard');
    const moduloDashboard = document.getElementById('modulo-dashboard') || document.querySelector('.dashboard-content') || document.querySelector('main.app-landing');
    const btnLimpar = document.getElementById('limpar-dados');
    const authUserBar = document.getElementById('auth-user-bar');
    const userEmailDisplay = document.getElementById('user-email-display');

    if (autenticado) {
      if (authScreen) authScreen.classList.add('hidden');
      if (navTabs) navTabs.classList.remove('hidden');
      if (abaCalculadora) abaCalculadora.classList.remove('hidden');
      if (abaDashboard) abaDashboard.classList.remove('hidden');
      if (moduloDashboard) moduloDashboard.classList.remove('hidden');
      if (btnLimpar) btnLimpar.classList.remove('hidden');
      if (authUserBar) authUserBar.classList.remove('hidden');
      if (userEmailDisplay) userEmailDisplay.textContent = userEmail || (currentUser ? currentUser.email : '');
    } else {
      if (authScreen) authScreen.classList.remove('hidden');
      if (navTabs) navTabs.classList.add('hidden');
      if (abaCalculadora) abaCalculadora.classList.add('hidden');
      if (abaDashboard) abaDashboard.classList.add('hidden');
      if (moduloDashboard) moduloDashboard.classList.add('hidden');
      if (btnLimpar) btnLimpar.classList.add('hidden');
      if (authUserBar) authUserBar.classList.add('hidden');
      if (userEmailDisplay) userEmailDisplay.textContent = '';
    }
  }

  function criarTelaAutenticacaoHTML() {
    if (document.getElementById('auth-screen')) return;

    const container = document.createElement('div');
    container.id = 'auth-screen';
    container.className = 'auth-screen';
    container.innerHTML = `
      <div class="auth-card">
        <div class="auth-card-header">
          <div class="auth-logo">Money<span class="dot">Hub</span></div>
          <h1 id="auth-title" class="auth-title">Acesse seu Cofre Pessoal</h1>
          <p id="auth-subtitle" class="auth-subtitle">Entre com sua conta ou cadastre-se para sincronizar seus dados financeiros na nuvem com segurança.</p>
        </div>

        <div class="auth-tabs" role="tablist">
          <button type="button" id="tab-login" class="auth-tab active" role="tab" aria-selected="true">Entrar</button>
          <button type="button" id="tab-signup" class="auth-tab" role="tab" aria-selected="false">Criar Conta</button>
        </div>

        <form id="auth-form" class="auth-form" novalidate>
          <div class="auth-field">
            <label for="auth-email">E-mail</label>
            <input type="email" id="auth-email" placeholder="seu@email.com" autocomplete="email" required>
          </div>

          <div class="auth-field">
            <label for="auth-password">Senha</label>
            <input type="password" id="auth-password" placeholder="Sua senha secreta (mínimo 6 caracteres)" autocomplete="current-password" required>
          </div>

          <div id="auth-confirm-group" class="auth-field hidden">
            <label for="auth-confirm-password">Confirmar Senha</label>
            <input type="password" id="auth-confirm-password" placeholder="Confirme sua senha" autocomplete="new-password">
          </div>

          <div id="auth-feedback" class="auth-feedback hidden" role="alert"></div>

          <button type="submit" id="auth-submit-btn" class="btn-auth">
            <span class="btn-auth-text">Entrar no MoneyHub</span>
          </button>
        </form>
      </div>
    `;

    const appEl = document.querySelector('.app') || document.body;
    const header = appEl.querySelector('.app-header');
    if (header && header.nextSibling) {
      appEl.insertBefore(container, header.nextSibling);
    } else {
      appEl.appendChild(container);
    }
  }

  function configurarBarraUsuario() {
    const header = document.querySelector('.app-header');
    if (!header) return;

    let actions = header.querySelector('.header-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'header-actions';
      const btnLimpar = document.getElementById('limpar-dados');
      if (btnLimpar) {
        btnLimpar.parentNode.insertBefore(actions, btnLimpar);
        actions.appendChild(btnLimpar);
      } else {
        header.appendChild(actions);
      }
    }

    if (!document.getElementById('auth-user-bar')) {
      const userBar = document.createElement('div');
      userBar.id = 'auth-user-bar';
      userBar.className = 'auth-user-bar hidden';
      userBar.innerHTML = `
        <span id="user-email-display" class="user-email-badge"></span>
        <button type="button" id="btn-signout" class="btn-signout" title="Encerrar sessão">Sair</button>
      `;
      actions.insertBefore(userBar, actions.firstChild);

      const btnSignout = userBar.querySelector('#btn-signout');
      if (btnSignout) {
        btnSignout.addEventListener('click', async () => {
          if (confirm('Deseja realmente sair da sua conta?')) {
            await signOut();
          }
        });
      }
    }
  }

  function inicializarAutenticacaoUI() {
    configurarBarraUsuario();
    criarTelaAutenticacaoHTML();

    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const confirmGroup = document.getElementById('auth-confirm-group');
    const submitBtn = document.getElementById('auth-submit-btn');
    const submitText = submitBtn ? submitBtn.querySelector('.btn-auth-text') : null;
    const authForm = document.getElementById('auth-form');
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const confirmInput = document.getElementById('auth-confirm-password');
    const feedbackEl = document.getElementById('auth-feedback');
    const authTitle = document.getElementById('auth-title');

    let modoAtual = 'login'; // 'login' | 'signup'

    function exibirFeedback(mensagem, tipo = 'error') {
      if (!feedbackEl) return;
      feedbackEl.textContent = mensagem;
      feedbackEl.className = 'auth-feedback ' + tipo;
      feedbackEl.classList.remove('hidden');
    }

    function limparFeedback() {
      if (!feedbackEl) return;
      feedbackEl.textContent = '';
      feedbackEl.className = 'auth-feedback hidden';
    }

    function setModo(modo) {
      modoAtual = modo;
      limparFeedback();

      if (modo === 'login') {
        tabLogin.classList.add('active');
        tabLogin.setAttribute('aria-selected', 'true');
        tabSignup.classList.remove('active');
        tabSignup.setAttribute('aria-selected', 'false');
        confirmGroup.classList.add('hidden');
        if (submitText) submitText.textContent = 'Entrar no MoneyHub';
        if (authTitle) authTitle.textContent = 'Acesse seu Cofre Pessoal';
        passwordInput.setAttribute('autocomplete', 'current-password');
      } else {
        tabSignup.classList.add('active');
        tabSignup.setAttribute('aria-selected', 'true');
        tabLogin.classList.remove('active');
        tabLogin.setAttribute('aria-selected', 'false');
        confirmGroup.classList.remove('hidden');
        if (submitText) submitText.textContent = 'Criar Minha Conta Grátis';
        if (authTitle) authTitle.textContent = 'Crie sua Conta no MoneyHub';
        passwordInput.setAttribute('autocomplete', 'new-password');
      }
    }

    if (tabLogin) tabLogin.addEventListener('click', () => setModo('login'));
    if (tabSignup) tabSignup.addEventListener('click', () => setModo('signup'));

    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        limparFeedback();

        const email = (emailInput.value || '').trim();
        const password = passwordInput.value || '';
        const confirmPassword = confirmInput ? confirmInput.value : '';

        if (!email || !email.includes('@')) {
          exibirFeedback('Informe um endereço de e-mail válido.', 'error');
          emailInput.focus();
          return;
        }

        if (password.length < 6) {
          exibirFeedback('A senha deve conter no mínimo 6 caracteres.', 'error');
          passwordInput.focus();
          return;
        }

        if (modoAtual === 'signup' && password !== confirmPassword) {
          exibirFeedback('As senhas não conferem. Digite a mesma senha nos dois campos.', 'error');
          confirmInput.focus();
          return;
        }

        submitBtn.disabled = true;
        if (submitText) submitText.textContent = modoAtual === 'login' ? 'Entrando...' : 'Criando conta...';

        try {
          if (modoAtual === 'login') {
            const { data, error } = await signIn(email, password);
            if (error) {
              if (error.message.includes('Invalid login credentials')) {
                exibirFeedback('E-mail ou senha incorretos. Verifique suas credenciais.', 'error');
              } else if (error.message.includes('Email not confirmed')) {
                exibirFeedback('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.', 'error');
              } else {
                exibirFeedback(error.message || 'Erro ao entrar na conta.', 'error');
              }
            } else if (data && data.user) {
              currentUser = data.user;
              alternarVisibilidadeApp(true, currentUser.email);
              await carregarDados();
              renderizarTudo();
            }
          } else {
            const { data, error } = await signUp(email, password);
            if (error) {
              if (error.message.includes('User already registered')) {
                exibirFeedback('Este e-mail já está cadastrado. Clique na aba "Entrar".', 'error');
              } else {
                exibirFeedback(error.message || 'Erro ao cadastrar conta.', 'error');
              }
            } else if (data && data.user) {
              currentUser = data.user;
              if (data.session) {
                alternarVisibilidadeApp(true, currentUser.email);
                await carregarDados();
                renderizarTudo();
              } else {
                exibirFeedback('Conta criada com sucesso! Se solicitado, confirme o link enviado ao seu e-mail para ativar.', 'success');
              }
            }
          }
        } catch (err) {
          exibirFeedback(err.message || 'Falha de comunicação com o servidor.', 'error');
        } finally {
          submitBtn.disabled = false;
          if (submitText) submitText.textContent = modoAtual === 'login' ? 'Entrar no MoneyHub' : 'Criar Minha Conta Grátis';
        }
      });
    }
  }

  function renderizarTudo() {
    // 1. Notificar ouvintes no barramento de eventos interno do MoneyHub
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
    if (!currentUser) return;
    if (payload.new.user_id && payload.new.user_id !== currentUser.id) return;
    if (payload.new.clienteId && payload.new.clienteId === MEU_CLIENTE_ID) return;

    const novosDados = payload.new.dados;
    const novoHistorico = payload.new.historico;

    // Se os novos dados forem exatamente o que acabamos de salvar localmente, ignorar eco
    if (novosDados) {
      const novosDadosJSON = typeof novosDados === 'string'
        ? novosDados
        : JSON.stringify({ dados: novosDados, historico: novoHistorico });
      if (novosDadosJSON === ultimoPacoteSalvoJSON) {
        return;
      }
      ultimoPacoteSalvoJSON = novosDadosJSON;
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

  function iniciarRealtime(userId) {
    if (!supabase || !userId) return;
    if (canalRealtime) {
      supabase.removeChannel(canalRealtime);
      canalRealtime = null;
    }

    try {
      const canalNome = 'moneyhub_user_' + userId;
      canalRealtime = supabase.channel(canalNome, {
        config: {
          broadcast: { ack: false, self: false }
        }
      });

      // 1. Escuta Broadcast Supabase (Transmissão simultânea entre diferentes computadores/celulares do mesmo usuário)
      canalRealtime.on('broadcast', { event: 'dados_sincronizados' }, (envelope) => {
        const dadosRecebidos = (envelope && envelope.payload) ? envelope.payload : envelope;
        if (dadosRecebidos && dadosRecebidos.user_id === userId && dadosRecebidos.clienteId !== MEU_CLIENTE_ID) {
          processarAtualizacaoRealtime({ new: dadosRecebidos });
        }
      });

      // 2. Escuta Postgres Changes filtrado exclusivamente pelo user_id do usuário conectado
      canalRealtime.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABELA_NUVEM,
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (payload && payload.new && payload.new.user_id === userId) {
          if (payload.new.clienteId && payload.new.clienteId === MEU_CLIENTE_ID) return;
          processarAtualizacaoRealtime(payload);
        }
      });

      canalRealtime.subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setTimeout(() => {
            if (canalRealtime && supabase && currentUser) {
              try { supabase.removeChannel(canalRealtime); } catch (e) {}
              canalRealtime = null;
              iniciarRealtime(currentUser.id);
            }
          }, 3000);
        }
      });
    } catch (err) {
      console.warn('MoneyHub (Realtime): Erro ao configurar canal:', err);
    }
  }

  // Checagem ativa e de foco para sincronização 100% à prova de falhas
  async function checarAtualizacoesNuvem() {
    if (!supabase || estaAtualizandoRealtime || pollingAtivo || !currentUser) return;
    pollingAtivo = true;
    try {
      const { data, error } = await supabase
        .from(TABELA_NUVEM)
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!error && data) {
        const dadosRemotos = (data.dados && typeof data.dados === 'object') ? data.dados : data;
        const remoteJSON = JSON.stringify({ dados: dadosRemotos, historico: data.historico || dadosRemotos.historicoInvestimentos });
        if (remoteJSON !== ultimoPacoteSalvoJSON) {
          processarAtualizacaoRealtime({ new: data });
        }
      }
    } catch (e) {
    } finally {
      pollingAtivo = false;
    }
  }

  // Polling em background a cada 4 segundos para o usuário logado
  setInterval(checarAtualizacoesNuvem, 4000);

  // Sincronização imediata ao reativar a aba ou focar na janela
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentUser) {
      checarAtualizacoesNuvem();
    }
  });
  window.addEventListener('focus', () => {
    if (currentUser) checarAtualizacoesNuvem();
  });

  // --- Persistência em Nuvem (Supabase Multi-Usuário) ---
  async function salvarDados() {
    if (!supabase || estaAtualizandoRealtime) return;
    const user = currentUser || (await obterUsuarioAtual());
    if (!user) return;

    try {
      // Normalização do payload de saídas para garantir preservação de detalhamento e conveniência
      const saidasNormalizadas = (state.saidas || []).map(item => {
        const saidaItem = {
          id: item.id || gerarId(),
          descricao: item.descricao ? String(item.descricao).trim() : '',
          valor: Math.max(0, Number(item.valor) || 0),
          categoria: item.categoria || 'Não identificado',
          data: item.data || obterDataHojeISO()
        };
        if (item.detalhamento) {
          saidaItem.detalhamento = String(item.detalhamento).trim();
        }
        if (typeof item.conveniencia === 'boolean') {
          saidaItem.conveniencia = item.conveniencia;
        }
        return saidaItem;
      });

      const pacote = {
        entradas: state.entradas,
        saidas: saidasNormalizadas,
        historicoInvestimentos: state.historicoInvestimentos,
        percentualInvestimento: state.percentualInvestimento,
        percentualReserva: state.percentualReserva,
        aporteExtra: state.aporteExtra,
        taxaProjecao: state.taxaProjecao,
        anosProjecao: state.anosProjecao,
        aporteFuturoManual: state.aporteFuturoManual,
        usuarioEditouAporteFuturo: state.usuarioEditouAporteFuturo
      };

      const payloadSync = {
        user_id: user.id,
        dados: pacote,
        historico: state.historicoInvestimentos,
        clienteId: MEU_CLIENTE_ID,
        timestamp: Date.now()
      };

      ultimoPacoteSalvoJSON = JSON.stringify({ dados: pacote, historico: state.historicoInvestimentos });

      // 1. Envio Simultâneo para abas locais (BroadcastChannel)
      if (localBroadcast) {
        try { localBroadcast.postMessage(payloadSync); } catch (e) {}
      }

      // 2. Envio Simultâneo para abas locais (localStorage)
      try {
        localStorage.setItem('moneyhub_sync_event', JSON.stringify(payloadSync));
      } catch (e) {}

      // 3. Envio Simultâneo para outros dispositivos do usuário (Supabase WebSocket Broadcast)
      if (canalRealtime) {
        try {
          canalRealtime.send({
            type: 'broadcast',
            event: 'dados_sincronizados',
            payload: payloadSync
          });
        } catch (e) {}
      }

      // 4. Persistência permanente no banco de dados do Supabase (com RLS: user_id = auth.uid())
      const { error } = await supabase
        .from(TABELA_NUVEM)
        .upsert({
          user_id: user.id,
          dados: pacote,
          historico: state.historicoInvestimentos,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn('MoneyHub (Supabase): Erro ao salvar dados:', error.message);
      }
    } catch (err) {
      console.warn('MoneyHub: Erro de rede ao salvar na nuvem:', err);
    }
  }

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
    state.investimentoTotalAtual = 0;
  }

  async function carregarDados(categoriasEntrada = [], categoriaEntradaPadrao = 'Outros', categoriasSaida = [], categoriaSaidaPadrao = 'Não identificado') {
    if (!supabase) {
      redefinirPadroes();
      return state;
    }

    const user = currentUser || (await obterUsuarioAtual());
    if (!user) {
      redefinirPadroes();
      alternarVisibilidadeApp(false);
      return state;
    }

    try {
      const { data, error } = await supabase
        .from(TABELA_NUVEM)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('MoneyHub (Supabase): Erro ao carregar dados:', error.message);
        redefinirPadroes();
        iniciarRealtime(user.id);
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

      // Inicializa escuta ativa em tempo real para o usuário conectado
      iniciarRealtime(user.id);
    } catch (err) {
      console.warn('MoneyHub: Falha de rede ao carregar dados:', err);
      redefinirPadroes();
      iniciarRealtime(user.id);
    }

    return state;
  }

  async function limparDados() {
    if (!confirm('Deseja realmente limpar todos os dados cadastrados no seu cofre?')) return;
    const user = currentUser || (await obterUsuarioAtual());
    if (!user) return;

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
        await supabase
          .from(TABELA_NUVEM)
          .upsert({
            user_id: user.id,
            dados: pacoteVazio,
            historico: [],
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.warn('MoneyHub: Falha de rede ao limpar dados:', err);
      }
    }

    redefinirPadroes();
    state.investimentoTotalAtual = 0;
    renderizarTudo();
  }

  function inicializarBotaoLimpar() {
    const botaoLimpar = document.getElementById('limpar-dados');
    if (botaoLimpar) {
      botaoLimpar.addEventListener('click', limparDados);
    }
  }

  function configurarMonitoramentoSessao() {
    if (!supabase) return;

    // Checagem da sessão ativa inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        currentUser = session.user;
        alternarVisibilidadeApp(true, currentUser.email);
        carregarDados().then(() => renderizarTudo());
      } else {
        currentUser = null;
        alternarVisibilidadeApp(false);
      }
    }).catch(() => {
      currentUser = null;
      alternarVisibilidadeApp(false);
    });

    // Ouvinte reativo para eventos de autenticação
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session && session.user) {
          currentUser = session.user;
          alternarVisibilidadeApp(true, currentUser.email);
          await carregarDados();
          renderizarTudo();
        }
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        if (canalRealtime && supabase) {
          try { supabase.removeChannel(canalRealtime); } catch (e) {}
          canalRealtime = null;
        }
        redefinirPadroes();
        renderizarTudo();
        alternarVisibilidadeApp(false);
      }
    });
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
    signIn,
    signUp,
    signOut,
    obterUsuarioAtual,
    iniciarRealtime,
    renderizarTudo
  };

  if (typeof window.renderizarTudo !== 'function') {
    window.renderizarTudo = renderizarTudo;
  }

  document.addEventListener('DOMContentLoaded', () => {
    inicializarAutenticacaoUI();
    inicializarBotaoLimpar();
    configurarMonitoramentoSessao();
  });

})();
