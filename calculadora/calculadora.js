/* ==========================================================================
   MoneyHub — Módulo da Calculadora (calculadora/calculadora.js)
   Gerenciamento de Entradas, Saídas, Sliders, Cálculos e Efetivação de Aportes
   ========================================================================== */

(function () {
  'use strict';

  const {
    state,
    paraNumeroMonetario,
    paraPercentual,
    evitarNegativoZero,
    formatarBRL,
    formatarDataBR,
    obterDataHojeISO,
    gerarId,
    somarLancamentos,
    somarPorCategoria,
    salvarDados,
    carregarDados
  } = window.MoneyHub;

  // --- Categorias ---
  const CATEGORIAS_ENTRADA       = ['Salário', 'Dividendos', 'Rendimentos', 'Estorno/Devolução', 'Outros'];
  const CATEGORIA_ENTRADA_PADRAO = 'Outros';

  const CATEGORIAS_SAIDA = [
    'Alimentação', 'Mercado', 'Transporte', 'Saúde', 'Educação',
    'Comunicação', 'Compras', 'Serviços', 'Transferências/Pagamentos pessoais', 'Não identificado'
  ];
  const CATEGORIA_SAIDA_PADRAO = 'Não identificado';

  // --- Elementos do DOM da Calculadora ---
  let formEntradaEl, entradaDescricaoInput, entradaValorInput, entradaCategoriaSelect, entradaDataInput, historicoEntradasEl;
  let formSaidaEl, saidaDescricaoInput, saidaValorInput, saidaCategoriaSelect, saidaDataInput, historicoSaidasEl;
  let investimentoRange, investimentoNum, aporteExtraInput, reservaRange, reservaNum;
  let resultadoDigits, investimentoDigits, reservaDigits;
  let investimentoDataInput, btnEfetivarInvestimento, feedbackInvestimentoEl, historicoInvestimentosListaEl, investimentoAcumuladoTag;

  let feedbackTimeout = null;

  function inicializarDOM() {
    formEntradaEl          = document.getElementById('form-entrada');
    entradaDescricaoInput  = document.getElementById('entrada-descricao');
    entradaValorInput      = document.getElementById('entrada-valor');
    entradaCategoriaSelect = document.getElementById('entrada-categoria');
    entradaDataInput       = document.getElementById('entrada-data');
    historicoEntradasEl    = document.getElementById('historico-entradas');

    formSaidaEl            = document.getElementById('form-saida');
    saidaDescricaoInput    = document.getElementById('saida-descricao');
    saidaValorInput        = document.getElementById('saida-valor');
    saidaCategoriaSelect   = document.getElementById('saida-categoria');
    saidaDataInput         = document.getElementById('saida-data');
    historicoSaidasEl      = document.getElementById('historico-saidas');

    investimentoRange      = document.getElementById('investimento-range');
    investimentoNum        = document.getElementById('investimento-num');
    aporteExtraInput       = document.getElementById('aporte-extra');
    reservaRange           = document.getElementById('reserva-range');
    reservaNum             = document.getElementById('reserva-num');

    resultadoDigits        = document.querySelector('.display-value .digits');
    investimentoDigits     = document.getElementById('investimento-total-digits');
    reservaDigits          = reservaRange.closest('.field-slider').querySelector('.mini-digits');

    investimentoDataInput        = document.getElementById('investimento-data');
    btnEfetivarInvestimento      = document.getElementById('btn-efetivar-investimento');
    feedbackInvestimentoEl       = document.getElementById('feedback-investimento');
    historicoInvestimentosListaEl = document.getElementById('historico-investimentos-lista');
    investimentoAcumuladoTag     = document.getElementById('investimento-acumulado-tag');

    // Sincronização slider <-> input numérico
    sincronizarParPercentual(investimentoRange, investimentoNum);
    sincronizarParPercentual(reservaRange, reservaNum);

    // Eventos de formulário e inputs
    aporteExtraInput.addEventListener('input', calcular);
    formEntradaEl.addEventListener('submit', incluirEntrada);
    formSaidaEl.addEventListener('submit', incluirSaida);
    btnEfetivarInvestimento.addEventListener('click', efetivarInvestimento);
  }

  function sincronizarParPercentual(range, num) {
    range.addEventListener('input', () => {
      num.value = range.value;
      state.percentualInvestimento = investimentoNum.value;
      state.percentualReserva      = reservaNum.value;
      calcular();
    });
    num.addEventListener('input', () => {
      const valor = paraPercentual(num.value);
      range.value = valor;
      state.percentualInvestimento = investimentoNum.value;
      state.percentualReserva      = reservaNum.value;
      calcular();
    });
  }

  // --- Histórico Visual Genérico ---
  function criarItemHistorico(item, categoriaPadrao, tipoLabel, fnRemover) {
    const li = document.createElement('li');
    li.className = 'historico-item';
    li.dataset.id = item.id;

    const desc = document.createElement('span');
    desc.className = 'historico-descricao';
    desc.textContent = item.descricao || '(sem descrição)';

    const dataSpan = document.createElement('span');
    dataSpan.className = 'historico-data';
    dataSpan.textContent = formatarDataBR(item.data);

    const cat = document.createElement('span');
    cat.className = 'historico-categoria';
    cat.textContent = item.categoria || categoriaPadrao;

    const val = document.createElement('span');
    val.className = 'historico-valor';
    val.textContent = 'R$ ' + formatarBRL(item.valor);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'historico-remover';
    btn.setAttribute('aria-label', `Remover ${tipoLabel} "${item.descricao || ''}"`);
    btn.textContent = '×';
    btn.addEventListener('click', () => fnRemover(item.id));

    li.append(desc, dataSpan, cat, val, btn);
    return li;
  }

  // --- Entradas ---
  function renderizarHistoricoEntradas() {
    historicoEntradasEl.innerHTML = '';
    state.entradas.forEach((item) => {
      historicoEntradasEl.appendChild(
        criarItemHistorico(item, CATEGORIA_ENTRADA_PADRAO, 'entrada', removerEntrada)
      );
    });
  }

  function incluirEntrada(e) {
    e.preventDefault();
    const descricao = entradaDescricaoInput.value.trim();
    const valor = paraNumeroMonetario(entradaValorInput.value);
    const categoria = entradaCategoriaSelect.value || CATEGORIA_ENTRADA_PADRAO;
    const data = entradaDataInput.value ? entradaDataInput.value : obterDataHojeISO();

    if (valor <= 0) {
      entradaValorInput.focus();
      return;
    }

    state.entradas.push({
      id: gerarId(),
      descricao,
      valor,
      categoria,
      data
    });

    renderizarHistoricoEntradas();

    entradaDescricaoInput.value = '';
    entradaValorInput.value     = '';
    entradaCategoriaSelect.value= CATEGORIA_ENTRADA_PADRAO;
    entradaDataInput.value      = '';
    entradaDescricaoInput.focus();

    calcular();
  }

  function removerEntrada(id) {
    state.entradas = state.entradas.filter((item) => item.id !== id);
    renderizarHistoricoEntradas();
    calcular();
  }

  // --- Saídas ---
  function renderizarHistoricoSaidas() {
    historicoSaidasEl.innerHTML = '';
    state.saidas.forEach((item) => {
      historicoSaidasEl.appendChild(
        criarItemHistorico(item, CATEGORIA_SAIDA_PADRAO, 'saída', removerSaida)
      );
    });
  }

  function incluirSaida(e) {
    e.preventDefault();
    const descricao = saidaDescricaoInput.value.trim();
    const valor = paraNumeroMonetario(saidaValorInput.value);
    const categoria = saidaCategoriaSelect.value || CATEGORIA_SAIDA_PADRAO;
    const data = saidaDataInput.value ? saidaDataInput.value : obterDataHojeISO();

    if (valor <= 0) {
      saidaValorInput.focus();
      return;
    }

    state.saidas.push({
      id: gerarId(),
      descricao,
      valor,
      categoria,
      data
    });

    renderizarHistoricoSaidas();

    saidaDescricaoInput.value  = '';
    saidaValorInput.value      = '';
    saidaCategoriaSelect.value = CATEGORIA_SAIDA_PADRAO;
    saidaDataInput.value       = '';
    saidaDescricaoInput.focus();

    calcular();
  }

  function removerSaida(id) {
    state.saidas = state.saidas.filter((item) => item.id !== id);
    renderizarHistoricoSaidas();
    calcular();
  }

  // --- Histórico de Aportes Efetivados ---
  function renderizarHistoricoInvestimentos() {
    historicoInvestimentosListaEl.innerHTML = '';
    const pv = state.historicoInvestimentos.reduce((acc, cur) => acc + paraNumeroMonetario(cur.valor), 0);
    const totalAportes = state.historicoInvestimentos.length;
    if (investimentoAcumuladoTag) {
      investimentoAcumuladoTag.textContent = `Acumulado: R$ ${formatarBRL(pv)} (${totalAportes} ${totalAportes === 1 ? 'aporte' : 'aportes'})`;
    }

    if (state.historicoInvestimentos.length === 0) return;

    state.historicoInvestimentos.forEach(item => {
      const li = document.createElement('li');
      li.className = 'historico-item';
      li.dataset.id = item.id;

      const desc = document.createElement('span');
      desc.className = 'historico-descricao';
      desc.textContent = 'Aporte Investimento';

      const dataSpan = document.createElement('span');
      dataSpan.className = 'historico-data';
      dataSpan.textContent = formatarDataBR(item.data);

      const cat = document.createElement('span');
      cat.className = 'historico-categoria historico-categoria-investimento';
      cat.textContent = 'Aporte Real';

      const val = document.createElement('span');
      val.className = 'historico-valor';
      val.textContent = 'R$ ' + formatarBRL(paraNumeroMonetario(item.valor));

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'historico-remover';
      btn.setAttribute('aria-label', `Remover aporte de ${formatarDataBR(item.data)}`);
      btn.textContent = '×';
      btn.addEventListener('click', () => removerInvestimento(item.id));

      li.append(desc, dataSpan, cat, val, btn);
      historicoInvestimentosListaEl.appendChild(li);
    });
  }

  function exibirFeedbackInvestimento(mensagem, tipo) {
    feedbackInvestimentoEl.textContent = mensagem;
    feedbackInvestimentoEl.className = `feedback-investimento ${tipo}`;
    feedbackInvestimentoEl.classList.remove('hidden');
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(() => {
      feedbackInvestimentoEl.classList.add('hidden');
    }, 4500);
  }

  function efetivarInvestimento() {
    const valor = state.investimentoTotalAtual;
    if (!valor || valor <= 0) {
      exibirFeedbackInvestimento('Defina entradas e percentual ou aporte para ter um valor a investir.', 'erro');
      return;
    }

    const dataInformada = investimentoDataInput.value.trim();
    const dataEfetiva = dataInformada && /^\d{4}-\d{2}-\d{2}$/.test(dataInformada)
      ? dataInformada
      : obterDataHojeISO();

    const novoAporte = {
      id: gerarId(),
      data: dataEfetiva,
      valor: valor
    };

    state.historicoInvestimentos.push(novoAporte);
    investimentoDataInput.value = '';
    salvarDados();
    renderizarHistoricoInvestimentos();
    exibirFeedbackInvestimento(`Aporte de R$ ${formatarBRL(valor)} efetivado com sucesso!`, 'sucesso');
  }

  function removerInvestimento(id) {
    state.historicoInvestimentos = state.historicoInvestimentos.filter(item => item.id !== id);
    salvarDados();
    renderizarHistoricoInvestimentos();
  }

  // --- Cálculo Principal ---
  function calcular() {
    const somaTotalEntradas = somarLancamentos(state.entradas);
    const totalSalario      = somarPorCategoria(state.entradas, 'Salário');
    const totalDividendos   = somarPorCategoria(state.entradas, 'Dividendos');
    const somaTotalSaidas   = somarLancamentos(state.saidas);

    const percentualInvestimento = paraPercentual(investimentoNum.value);
    const aporteExtra            = paraNumeroMonetario(aporteExtraInput.value);
    const percentualReserva      = paraPercentual(reservaNum.value);

    state.percentualInvestimento = investimentoNum.value;
    state.aporteExtra            = aporteExtraInput.value;
    state.percentualReserva      = reservaNum.value;

    const somaEntradasComuns          = somaTotalEntradas - totalDividendos;
    const valorInvestimentoPercentual = (totalSalario * percentualInvestimento) / 100;
    const investimentoTotal           = valorInvestimentoPercentual + aporteExtra + totalDividendos;
    const valorReserva                = (totalSalario * percentualReserva) / 100;

    state.investimentoTotalAtual = investimentoTotal;

    const livreParaGastar = evitarNegativoZero(
      somaEntradasComuns - somaTotalSaidas - valorInvestimentoPercentual - aporteExtra - valorReserva
    );

    resultadoDigits.textContent    = formatarBRL(livreParaGastar);
    investimentoDigits.textContent = formatarBRL(investimentoTotal);
    reservaDigits.textContent      = formatarBRL(valorReserva);

    salvarDados();
  }

  // --- Renderização Completa (Sincronização em Tempo Real) ---
  function renderizarTudo() {
    if (!formEntradaEl) {
      inicializarDOM();
    }
    if (!formEntradaEl) return;

    const activeEl = document.activeElement;

    if (aporteExtraInput && activeEl !== aporteExtraInput) {
      aporteExtraInput.value = state.aporteExtra || '';
    }
    if (investimentoNum && activeEl !== investimentoNum && activeEl !== investimentoRange) {
      investimentoNum.value   = state.percentualInvestimento;
      investimentoRange.value = state.percentualInvestimento;
    }
    if (reservaNum && activeEl !== reservaNum && activeEl !== reservaRange) {
      reservaNum.value   = state.percentualReserva;
      reservaRange.value = state.percentualReserva;
    }

    renderizarHistoricoEntradas();
    renderizarHistoricoSaidas();
    renderizarHistoricoInvestimentos();

    // Recalcula totais na interface sem disparar novo salvamento na nuvem
    const somaTotalEntradas = somarLancamentos(state.entradas);
    const totalSalario      = somarPorCategoria(state.entradas, 'Salário');
    const totalDividendos   = somarPorCategoria(state.entradas, 'Dividendos');
    const somaTotalSaidas   = somarLancamentos(state.saidas);

    const percentualInvestimento = paraPercentual(investimentoNum ? investimentoNum.value : state.percentualInvestimento);
    const aporteExtra            = paraNumeroMonetario(aporteExtraInput ? aporteExtraInput.value : state.aporteExtra);
    const percentualReserva      = paraPercentual(reservaNum ? reservaNum.value : state.percentualReserva);

    const somaEntradasComuns          = somaTotalEntradas - totalDividendos;
    const valorInvestimentoPercentual = (totalSalario * percentualInvestimento) / 100;
    const investimentoTotal           = valorInvestimentoPercentual + aporteExtra + totalDividendos;
    const valorReserva                = (totalSalario * percentualReserva) / 100;

    state.investimentoTotalAtual = investimentoTotal;

    const livreParaGastar = evitarNegativoZero(
      somaEntradasComuns - somaTotalSaidas - valorInvestimentoPercentual - aporteExtra - valorReserva
    );

    if (resultadoDigits)    resultadoDigits.textContent    = formatarBRL(livreParaGastar);
    if (investimentoDigits) investimentoDigits.textContent = formatarBRL(investimentoTotal);
    if (reservaDigits)      reservaDigits.textContent      = formatarBRL(valorReserva);
  }

  window.renderizarTudo = renderizarTudo;
  if (window.MoneyHub && typeof window.MoneyHub.on === 'function') {
    window.MoneyHub.on('dadosAtualizados', renderizarTudo);
  }

  // --- Inicialização ao Carregar a Página ---
  document.addEventListener('DOMContentLoaded', async () => {
    inicializarDOM();
    await carregarDados(CATEGORIAS_ENTRADA, CATEGORIA_ENTRADA_PADRAO, CATEGORIAS_SAIDA, CATEGORIA_SAIDA_PADRAO);

    aporteExtraInput.value  = state.aporteExtra || '';
    investimentoNum.value   = state.percentualInvestimento;
    investimentoRange.value = state.percentualInvestimento;
    reservaNum.value        = state.percentualReserva;
    reservaRange.value      = state.percentualReserva;

    renderizarHistoricoEntradas();
    renderizarHistoricoSaidas();
    renderizarHistoricoInvestimentos();
    calcular();
  });

})();
