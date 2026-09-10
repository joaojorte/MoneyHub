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
    obterDataComDiaAjustado,
    gerarId,
    gerarLancamentosParcelados,
    obterLancamentosMesComRecorrencia,
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
    'Comunicação', 'Compras', 'Serviços', 'Transferências/Pagamentos pessoais', 'Outros', 'Não identificado'
  ];
  const CATEGORIA_SAIDA_PADRAO = 'Não identificado';

  // --- Elementos do DOM da Calculadora ---
  let formEntradaEl, entradaDescricaoInput, entradaValorInput, entradaCategoriaSelect, entradaDataInput, historicoEntradasEl;
  let formSaidaEl, saidaDescricaoInput, saidaValorInput, saidaCategoriaSelect, saidaDataInput, historicoSaidasEl;
  let saidaDetalhamentoContainer, saidaDetalhamentoInput, saidaConvenienciaContainer;

  // Segmented Control de Pagamento & Toggles (Fim do <select>)
  let radioPagamentoPix, radioPagamentoCartao;
  let btnToggleRecorrente, btnToggleParcelar;
  let camposCondicionaisCartao, saidaFaturaContainer, saidaMesFaturaInput, saidaParcelasContainer, saidaParcelasInput;

  // Estado Reativo Interno da Frequência
  let estadoRecorrente = false;
  let estadoParcelado  = false;

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

    formSaidaEl                = document.getElementById('form-saida');
    saidaDescricaoInput        = document.getElementById('saida-descricao');
    saidaValorInput            = document.getElementById('saida-valor');
    saidaCategoriaSelect       = document.getElementById('saida-categoria');
    saidaDetalhamentoContainer = document.getElementById('saida-detalhamento-container');
    saidaDetalhamentoInput     = document.getElementById('saida-detalhamento');
    saidaConvenienciaContainer = document.getElementById('saida-conveniencia-container');

    radioPagamentoPix       = document.getElementById('pagamento-pix');
    radioPagamentoCartao    = document.getElementById('pagamento-cartao');
    btnToggleRecorrente     = document.getElementById('btn-toggle-recorrente');
    btnToggleParcelar       = document.getElementById('btn-toggle-parcelar');
    camposCondicionaisCartao= document.getElementById('campos-condicionais-cartao');
    saidaFaturaContainer    = document.getElementById('saida-fatura-container');
    saidaMesFaturaInput     = document.getElementById('saida-mes-fatura');
    saidaParcelasContainer  = document.getElementById('saida-parcelas-container');
    saidaParcelasInput      = document.getElementById('saida-parcelas');
    saidaDataInput          = document.getElementById('saida-data');
    historicoSaidasEl       = document.getElementById('historico-saidas');

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
    saidaCategoriaSelect.addEventListener('change', atualizarVisibilidadeCondicionalSaida);

    // Eventos de Pagamento e Frequência (Segmented Controls & Toggles)
    if (radioPagamentoPix) {
      radioPagamentoPix.addEventListener('change', atualizarEstadoUI);
    }
    if (radioPagamentoCartao) {
      radioPagamentoCartao.addEventListener('change', atualizarEstadoUI);
    }

    if (btnToggleRecorrente) {
      btnToggleRecorrente.addEventListener('click', () => {
        estadoRecorrente = !estadoRecorrente;
        // Ao marcar como recorrente, desmarca parcelamento internamente
        if (estadoRecorrente && estadoParcelado) {
          estadoParcelado = false;
        }
        atualizarEstadoUI();
      });
    }

    if (btnToggleParcelar) {
      btnToggleParcelar.addEventListener('click', () => {
        estadoParcelado = !estadoParcelado;
        // Ao marcar como parcelado: Desmarca "Único" ou "Assinatura" internamente
        if (estadoParcelado && estadoRecorrente) {
          estadoRecorrente = false;
        }
        atualizarEstadoUI();
        if (estadoParcelado && saidaParcelasInput) {
          saidaParcelasInput.focus();
        }
      });
    }

    if (saidaDataInput) {
      saidaDataInput.addEventListener('change', () => {
        if (radioPagamentoCartao && radioPagamentoCartao.checked && saidaMesFaturaInput && !saidaMesFaturaInput.value && saidaDataInput.value) {
          saidaMesFaturaInput.value = saidaDataInput.value.slice(0, 7);
        }
      });
    }

    btnEfetivarInvestimento.addEventListener('click', efetivarInvestimento);

    atualizarVisibilidadeCondicionalSaida();
    atualizarEstadoUI();
  }

  // Lógica de Dependência e Ocultação Inteligente
  function atualizarEstadoUI() {
    const isCartao = radioPagamentoCartao && radioPagamentoCartao.checked;

    // 1. Atualização visual do botão "Tornar Recorrente (Assinatura)"
    if (btnToggleRecorrente) {
      btnToggleRecorrente.classList.toggle('ativo', estadoRecorrente);
      btnToggleRecorrente.setAttribute('aria-pressed', estadoRecorrente ? 'true' : 'false');
    }

    // 2. Se for Cartão de Crédito
    if (isCartao) {
      // Exibe o botão extra "Parcelar"
      if (btnToggleParcelar) {
        btnToggleParcelar.style.display = 'inline-flex';
        btnToggleParcelar.classList.toggle('ativo', estadoParcelado);
        btnToggleParcelar.setAttribute('aria-pressed', estadoParcelado ? 'true' : 'false');
      }

      // Exibe container de campos condicionais
      if (camposCondicionaisCartao) {
        camposCondicionaisCartao.style.display = 'flex';
      }

      // Exibe campo de "Mês da Fatura" (para alocar o impacto no caixa corretamente)
      if (saidaFaturaContainer) {
        saidaFaturaContainer.style.display = 'flex';
      }
      if (saidaMesFaturaInput && !saidaMesFaturaInput.value) {
        const dataBase = (saidaDataInput && saidaDataInput.value) ? saidaDataInput.value : obterDataHojeISO();
        saidaMesFaturaInput.value = dataBase.slice(0, 7);
      }
      if (saidaMesFaturaInput) {
        saidaMesFaturaInput.required = true;
      }

      // Se "Parcelar" for clicado: exibe campo numérico "Quantidade de Parcelas"
      if (estadoParcelado) {
        if (saidaParcelasContainer) saidaParcelasContainer.style.display = 'flex';
        if (saidaParcelasInput) saidaParcelasInput.required = true;
      } else {
        if (saidaParcelasContainer) saidaParcelasContainer.style.display = 'none';
        if (saidaParcelasInput) {
          saidaParcelasInput.required = false;
          saidaParcelasInput.value = '';
        }
      }
    } else {
      // Se voltar para "PIX / Débito":
      // Oculte o botão "Parcelar" e o "Mês da Fatura"
      if (btnToggleParcelar) {
        btnToggleParcelar.style.display = 'none';
        btnToggleParcelar.classList.remove('ativo');
        btnToggleParcelar.setAttribute('aria-pressed', 'false');
      }

      if (saidaFaturaContainer) {
        saidaFaturaContainer.style.display = 'none';
      }
      if (saidaMesFaturaInput) {
        saidaMesFaturaInput.required = false;
        saidaMesFaturaInput.value = '';
      }

      // Se estava parcelado, resete o estado da frequência para "Único" silenciosamente
      if (estadoParcelado) {
        estadoParcelado = false;
      }

      if (saidaParcelasContainer) {
        saidaParcelasContainer.style.display = 'none';
      }
      if (saidaParcelasInput) {
        saidaParcelasInput.required = false;
        saidaParcelasInput.value = '';
      }

      if (camposCondicionaisCartao) {
        camposCondicionaisCartao.style.display = 'none';
      }
    }
  }

  function atualizarVisibilidadeCondicionalSaida() {
    if (!saidaCategoriaSelect) return;
    const cat = saidaCategoriaSelect.value;

    if (cat === 'Outros') {
      if (saidaDetalhamentoContainer) saidaDetalhamentoContainer.style.display = 'block';
      if (saidaConvenienciaContainer) saidaConvenienciaContainer.style.display = 'none';
      if (saidaDetalhamentoInput) {
        saidaDetalhamentoInput.required = true;
        saidaDetalhamentoInput.focus();
      }
    } else if (cat === 'Alimentação') {
      if (saidaConvenienciaContainer) saidaConvenienciaContainer.style.display = 'flex';
      if (saidaDetalhamentoContainer) saidaDetalhamentoContainer.style.display = 'none';
      if (saidaDetalhamentoInput) {
        saidaDetalhamentoInput.required = false;
        saidaDetalhamentoInput.value = '';
      }
    } else {
      if (saidaDetalhamentoContainer) saidaDetalhamentoContainer.style.display = 'none';
      if (saidaConvenienciaContainer) saidaConvenienciaContainer.style.display = 'none';
      if (saidaDetalhamentoInput) {
        saidaDetalhamentoInput.required = false;
        saidaDetalhamentoInput.value = '';
      }
    }
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
    if (item.data_pagamento && item.data && item.data_pagamento !== item.data) {
      dataSpan.textContent = `Compra: ${formatarDataBR(item.data)} · Fatura: ${formatarDataBR(item.data_pagamento)}`;
    } else {
      dataSpan.textContent = formatarDataBR(item.data_pagamento || item.data);
    }

    const cat = document.createElement('span');
    cat.className = 'historico-categoria';
    const categoriaTexto = item.categoria || categoriaPadrao;
    cat.textContent = categoriaTexto;

    // Exibição do Detalhamento quando for categoria 'Outros'
    if (item.categoria === 'Outros' && item.detalhamento) {
      cat.textContent = `Outros · ${item.detalhamento}`;
      cat.title = `Detalhamento: ${item.detalhamento}`;
    }

    // Tag visual de Conveniência quando for categoria 'Alimentação'
    let tagConveniencia = null;
    if (item.categoria === 'Alimentação') {
      tagConveniencia = document.createElement('span');
      const isDelivery = item.conveniencia === true;
      tagConveniencia.className = 'historico-tag-conveniencia ' + (isDelivery ? 'tag-delivery' : 'tag-mercado');
      tagConveniencia.textContent = isDelivery ? '🛵 Delivery' : '🛒 Mercado';
      tagConveniencia.title = isDelivery ? 'Modalidade: Pronto / Delivery' : 'Modalidade: Mercado';
    }

    // Tag visual de Forma de Pagamento
    let tagPagamento = null;
    if (item.forma_pagamento === 'cartao_credito') {
      tagPagamento = document.createElement('span');
      tagPagamento.className = 'historico-tag-pagamento tag-cartao';
      const mesFat = item.mes_fatura || (item.data_pagamento ? item.data_pagamento.slice(0, 7) : '');
      tagPagamento.textContent = mesFat ? `💳 Cartão (${mesFat.slice(5, 7)}/${mesFat.slice(2, 4)})` : '💳 Cartão';
      tagPagamento.title = `Cartão de Crédito — Impacto no caixa: ${formatarDataBR(item.data_pagamento || item.data)}`;
    } else if (item.forma_pagamento === 'pix_debito_dinheiro') {
      tagPagamento = document.createElement('span');
      tagPagamento.className = 'historico-tag-pagamento tag-pix';
      tagPagamento.textContent = '⚡ PIX/Débito';
      tagPagamento.title = 'Pagamento à vista (PIX / Débito / Dinheiro) — Impacto imediato no mês da transação';
    }

    // Tag visual de Frequência (Assinatura Fixa, Projetada ou Parcelada)
    let tagFrequencia = null;
    if (item.isProjetadoRecorrente === true) {
      tagFrequencia = document.createElement('span');
      tagFrequencia.className = 'historico-tag-frequencia tag-projetado';
      tagFrequencia.textContent = '🔁 Assinatura (Projetada)';
      tagFrequencia.title = 'Despesa fixa / assinatura originada em mês anterior, projetada automaticamente no mês vigente';
    } else if (item.recorrente === true) {
      tagFrequencia = document.createElement('span');
      tagFrequencia.className = 'historico-tag-frequencia tag-recorrente';
      tagFrequencia.textContent = '🔁 Assinatura Fixa';
      tagFrequencia.title = 'Despesa Recorrente / Assinatura Fixa';
    } else if (item.frequencia === 'parcelado' || (item.totalParcelas && item.totalParcelas > 1)) {
      tagFrequencia = document.createElement('span');
      tagFrequencia.className = 'historico-tag-frequencia tag-parcelado';
      const ind = (item.parcelaAtual && item.totalParcelas) ? ` ${item.parcelaAtual}/${item.totalParcelas}` : '';
      tagFrequencia.textContent = `💳 Parcela${ind}`;
      tagFrequencia.title = `Despesa Parcelada (${item.parcelaAtual || 1}/${item.totalParcelas || ''})`;
    }

    const val = document.createElement('span');
    val.className = 'historico-valor';
    val.textContent = 'R$ ' + formatarBRL(item.valor);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'historico-remover';
    btn.setAttribute('aria-label', `Remover ${tipoLabel} "${item.descricao || ''}"`);
    btn.textContent = '×';
    btn.addEventListener('click', () => fnRemover(item.id));

    const acoesContainer = document.createElement('div');
    acoesContainer.className = 'historico-acoes-valor';
    acoesContainer.append(val, btn);

    const elementosLinha = [desc, dataSpan, cat];
    if (tagPagamento) elementosLinha.push(tagPagamento);
    if (tagConveniencia) elementosLinha.push(tagConveniencia);
    if (tagFrequencia) elementosLinha.push(tagFrequencia);
    elementosLinha.push(acoesContainer);

    li.append(...elementosLinha);
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
  // Regra de Leitura: renderiza o painel do mês atual puxando os gastos vigentes no caixa E projetando assinaturas anteriores (recorrente: true)
  function renderizarHistoricoSaidas() {
    historicoSaidasEl.innerHTML = '';
    const mesAtual = obterDataHojeISO().slice(0, 7);
    const saidasMesAtual = obterLancamentosMesComRecorrencia(state.saidas, mesAtual);

    saidasMesAtual.forEach((item) => {
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

    // Validação obrigatória de Detalhamento para categoria 'Outros'
    let detalhamento = '';
    if (categoria === 'Outros') {
      detalhamento = saidaDetalhamentoInput ? saidaDetalhamentoInput.value.trim() : '';
      if (!detalhamento) {
        if (saidaDetalhamentoInput) {
          saidaDetalhamentoInput.focus();
          saidaDetalhamentoInput.style.borderColor = 'var(--accent-expense)';
          setTimeout(() => {
            if (saidaDetalhamentoInput) saidaDetalhamentoInput.style.borderColor = '';
          }, 1800);
        }
        return;
      }
    }

    // Mapeamento booleano para categoria 'Alimentação':
    // Pronto/Delivery => conveniencia: true | Mercado => conveniencia: false
    let conveniencia = false;
    if (categoria === 'Alimentação') {
      const radioDelivery = formSaidaEl ? formSaidaEl.querySelector('input[name="saida-conveniencia"]:checked') : null;
      conveniencia = radioDelivery ? (radioDelivery.value === 'delivery') : false;
    }

    // Leitura da Forma de Pagamento (Segmented Control) e Mês da Fatura
    const isCartao = radioPagamentoCartao && radioPagamentoCartao.checked;
    const formaPagamento = isCartao ? 'cartao_credito' : 'pix_debito_dinheiro';
    let mesFatura = '';

    if (isCartao) {
      mesFatura = saidaMesFaturaInput ? saidaMesFaturaInput.value.trim() : '';
      if (!mesFatura) {
        mesFatura = data.slice(0, 7);
      }
    }

    // Impacto financeiro no caixa:
    // - PIX/Débito: mesmo mês da transação (data)
    // - Cartão de Crédito: projetado para o mês da fatura selecionado
    const diaOriginal = (data && data.length >= 10) ? data.slice(8, 10) : '01';
    const dataPagamentoInicial = (isCartao && mesFatura)
      ? obterDataComDiaAjustado(mesFatura, diaOriginal)
      : data;

    // Processamento por Frequência (Parcelado vs Assinatura Fixa vs Padrão Único)
    if (isCartao && estadoParcelado) {
      const qtdParcelas = parseInt(saidaParcelasInput ? saidaParcelasInput.value : '', 10);
      if (isNaN(qtdParcelas) || qtdParcelas < 2) {
        if (saidaParcelasInput) {
          saidaParcelasInput.focus();
          const grupoParcelas = saidaParcelasInput.closest('.parcelas-group') || saidaParcelasInput;
          grupoParcelas.style.borderColor = 'var(--accent-expense)';
          setTimeout(() => { grupoParcelas.style.borderColor = ''; }, 1800);
        }
        return;
      }

      // Gera N lançamentos individuais dividindo o valor total pelas parcelas com alocação no mês de fatura
      const parcelasGeradas = gerarLancamentosParcelados({
        descricao,
        valorTotal: valor,
        categoria,
        dataBase: data,
        formaPagamento,
        mesFatura,
        quantidadeParcelas: qtdParcelas,
        detalhamento,
        conveniencia
      });

      state.saidas.push(...parcelasGeradas);
    } else if (estadoRecorrente) {
      // Assinatura Fixa (recorrente: true)
      const novoItem = {
        id: gerarId(),
        descricao,
        valor,
        categoria,
        data,
        data_pagamento: dataPagamentoInicial,
        forma_pagamento: formaPagamento,
        frequencia: 'fixo',
        recorrente: true
      };

      if (isCartao && mesFatura) {
        novoItem.mes_fatura = mesFatura;
      }

      if (categoria === 'Outros' && detalhamento) {
        novoItem.detalhamento = detalhamento;
      }

      if (categoria === 'Alimentação') {
        novoItem.conveniencia = conveniencia;
      }

      state.saidas.push(novoItem);
    } else {
      // Estado padrão: Único (sem exibir a palavra Único na tela)
      const novoItem = {
        id: gerarId(),
        descricao,
        valor,
        categoria,
        data,
        data_pagamento: dataPagamentoInicial,
        forma_pagamento: formaPagamento,
        frequencia: 'unico',
        recorrente: false
      };

      if (isCartao && mesFatura) {
        novoItem.mes_fatura = mesFatura;
      }

      if (categoria === 'Outros' && detalhamento) {
        novoItem.detalhamento = detalhamento;
      }

      if (categoria === 'Alimentação') {
        novoItem.conveniencia = conveniencia;
      }

      state.saidas.push(novoItem);
    }

    renderizarHistoricoSaidas();

    // Reset dos campos para o estado inicial padrão
    saidaDescricaoInput.value  = '';
    saidaValorInput.value      = '';
    saidaCategoriaSelect.value = CATEGORIA_SAIDA_PADRAO;
    if (saidaDetalhamentoInput) saidaDetalhamentoInput.value = '';
    const radioMercadoPadrao = document.getElementById('conveniencia-mercado');
    if (radioMercadoPadrao) radioMercadoPadrao.checked = true;
    atualizarVisibilidadeCondicionalSaida();

    // Reseta para PIX/Débito e frequência Única
    if (radioPagamentoPix) radioPagamentoPix.checked = true;
    estadoRecorrente = false;
    estadoParcelado  = false;
    if (saidaMesFaturaInput) saidaMesFaturaInput.value = '';
    if (saidaParcelasInput)  saidaParcelasInput.value  = '';
    atualizarEstadoUI();

    saidaDataInput.value       = '';
    saidaDescricaoInput.focus();

    calcular();
  }

  function removerSaida(id) {
    // Se for um item projetado de assinatura recorrente anterior, remove a assinatura original
    if (typeof id === 'string' && id.startsWith('proj_')) {
      const partes = id.split('_');
      const idOrigem = partes[1];
      state.saidas = state.saidas.filter(item => item.id !== idOrigem);
    } else {
      state.saidas = state.saidas.filter(item => item.id !== id);
    }
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

      const acoesContainer = document.createElement('div');
      acoesContainer.className = 'historico-acoes-valor';
      acoesContainer.append(val, btn);

      li.append(desc, dataSpan, cat, acoesContainer);
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
  // Regra de Leitura: cálculo financeiro do painel do mês atual puxa os gastos do mês vigente no caixa E projeta assinaturas anteriores
  function calcular() {
    const mesAtual = obterDataHojeISO().slice(0, 7);
    const entradasMes = obterLancamentosMesComRecorrencia(state.entradas, mesAtual);
    const saidasMes   = obterLancamentosMesComRecorrencia(state.saidas, mesAtual);

    const somaTotalEntradas = somarLancamentos(entradasMes);
    const totalSalario      = somarPorCategoria(entradasMes, 'Salário');
    const totalDividendos   = somarPorCategoria(entradasMes, 'Dividendos');
    const somaTotalSaidas   = somarLancamentos(saidasMes);

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

    // Recalcula totais na interface com base no mês vigente sem disparar novo salvamento na nuvem
    const mesAtual = obterDataHojeISO().slice(0, 7);
    const entradasMes = obterLancamentosMesComRecorrencia(state.entradas, mesAtual);
    const saidasMes   = obterLancamentosMesComRecorrencia(state.saidas, mesAtual);

    const somaTotalEntradas = somarLancamentos(entradasMes);
    const totalSalario      = somarPorCategoria(entradasMes, 'Salário');
    const totalDividendos   = somarPorCategoria(entradasMes, 'Dividendos');
    const somaTotalSaidas   = somarLancamentos(saidasMes);

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
