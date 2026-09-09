/* ==========================================================================
   MoneyHub — Módulo do Dashboard (dashboard/dashboard.js)
   Filtros Mensais, Gráficos (Chart.js) e Motor de Projeção de Juros Compostos
   ========================================================================== */

(function () {
  'use strict';

  const {
    state,
    paraNumero,
    paraNumeroMonetario,
    formatarBRL,
    formatarMesAno,
    obterDataHojeISO,
    obterLancamentosMesComRecorrencia,
    somarLancamentos,
    salvarDados,
    carregarDados
  } = window.MoneyHub;

  // --- Paletas de Cores dos Gráficos ---
  const CATEGORIA_SAIDA_PADRAO = 'Não identificado';

  const CORES_CATEGORIAS = {
    'Alimentação':                        '#E2694E',
    'Mercado':                            '#FF7043',
    'Transporte':                         '#8C7EE0',
    'Saúde':                              '#35C98A',
    'Educação':                           '#4ABFB5',
    'Comunicação':                        '#F0B94A',
    'Compras':                            '#F43F5E',
    'Serviços':                           '#38BDF8',
    'Transferências/Pagamentos pessoais': '#6366F1',
    'Outros':                             '#A78BFA',
    'Não identificado':                   '#64748B',
  };

  const PALETA_CORES_VIBRANTES = [
    '#E2694E', '#38BDF8', '#F0B94A', '#35C98A', '#8C7EE0',
    '#F43F5E', '#4ABFB5', '#FB923C', '#6366F1', '#EC4899'
  ];

  // --- Elementos do DOM do Dashboard ---
  let seletorMesEl, canvasFluxo, canvasDespesas, emptyFluxoEl, emptyDespesasEl;
  let containerFluxo, containerDespesas, containerProjecao;
  let dashEntradasEl, dashSaidasEl, dashLivreEl;

  // Elementos da Projeção de Patrimônio
  let projecaoPvDigitsEl, projecaoPvSubEl, projecaoTaxaInput, projecaoAnosInput;
  let projecaoPmtInput, projecaoTotalAportadoEl, projecaoTotalFinalEl, canvasProjecao, emptyProjecaoEl;

  // Instâncias do Chart.js
  let chartFluxo    = null;
  let chartDespesas = null;
  let chartProjecao = null;

  function inicializarDOM() {
    seletorMesEl     = document.getElementById('seletor-mes');
    canvasFluxo      = document.getElementById('graficoFluxo');
    canvasDespesas   = document.getElementById('graficoDespesas');
    emptyFluxoEl     = document.getElementById('chart-fluxo-empty');
    emptyDespesasEl  = document.getElementById('chart-despesas-empty');
    dashEntradasEl   = document.getElementById('dash-total-entradas');
    dashSaidasEl     = document.getElementById('dash-total-saidas');
    dashLivreEl      = document.getElementById('dash-livre');

    containerFluxo    = canvasFluxo ? canvasFluxo.closest('.chart-container') : null;
    containerDespesas = canvasDespesas ? canvasDespesas.closest('.chart-container') : null;

    projecaoPvDigitsEl     = document.getElementById('projecao-pv-digits');
    projecaoPvSubEl        = document.getElementById('projecao-pv-sub');
    projecaoTaxaInput      = document.getElementById('projecao-taxa');
    projecaoAnosInput      = document.getElementById('projecao-anos');
    projecaoPmtInput       = document.getElementById('projecao-pmt-input');
    projecaoTotalAportadoEl= document.getElementById('projecao-total-aportado');
    projecaoTotalFinalEl   = document.getElementById('projecao-total-final');
    canvasProjecao         = document.getElementById('graficoProjecao');
    emptyProjecaoEl        = document.getElementById('chart-projecao-empty');
    containerProjecao      = canvasProjecao ? canvasProjecao.closest('.chart-container') : null;

    // Eventos
    seletorMesEl.addEventListener('change', () => {
      const mes = seletorMesEl.value;
      if (!mes) return;
      atualizarTotaisMensais(mes);
      renderizarGraficos(mes);
    });

    projecaoTaxaInput.addEventListener('input', () => {
      state.taxaProjecao = projecaoTaxaInput.value;
      salvarDados();
      renderizarProjecao();
    });

    projecaoAnosInput.addEventListener('input', () => {
      state.anosProjecao = projecaoAnosInput.value;
      salvarDados();
      renderizarProjecao();
    });

    projecaoPmtInput.addEventListener('input', () => {
      state.usuarioEditouAporteFuturo = true;
      state.aporteFuturoManual = projecaoPmtInput.value;
      salvarDados();
      renderizarProjecao();
    });
  }

  // --- Gerenciamento de Instâncias do Chart.js ---
  function destruirGraficoProjecao() {
    if (chartProjecao) {
      chartProjecao.destroy();
      chartProjecao = null;
    }
  }

  function destruirGraficosMensais() {
    if (chartFluxo) {
      chartFluxo.destroy();
      chartFluxo = null;
    }
    if (chartDespesas) {
      chartDespesas.destroy();
      chartDespesas = null;
    }
  }

  function destruirGraficos() {
    destruirGraficosMensais();
    destruirGraficoProjecao();
  }

  // --- Seletor de Meses Disponíveis ---
  function obterMesesDisponiveis() {
    const mesesSet = new Set();
    const mesAtual = (typeof obterDataHojeISO === 'function') ? obterDataHojeISO().slice(0, 7) : new Date().toISOString().slice(0, 7);

    // Se houver qualquer lançamento recorrente, garante presença do mês atual no seletor
    if (state.saidas.some(item => item.recorrente === true)) {
      mesesSet.add(mesAtual);
    }

    state.entradas.forEach(item => {
      if (item.data && item.data.length >= 7) mesesSet.add(item.data.slice(0, 7));
    });
    state.saidas.forEach(item => {
      if (item.data && item.data.length >= 7) mesesSet.add(item.data.slice(0, 7));
    });
    return Array.from(mesesSet).sort((a, b) => b.localeCompare(a));
  }

  function popularSeletorMeses() {
    const meses = obterMesesDisponiveis();
    const valorAtual = seletorMesEl.value;

    seletorMesEl.innerHTML = '';

    if (meses.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Sem lançamentos';
      seletorMesEl.appendChild(opt);
      seletorMesEl.disabled = true;
      return '';
    }

    seletorMesEl.disabled = false;
    meses.forEach(mes => {
      const opt = document.createElement('option');
      opt.value = mes;
      opt.textContent = formatarMesAno(mes);
      seletorMesEl.appendChild(opt);
    });

    if (valorAtual && meses.includes(valorAtual)) {
      seletorMesEl.value = valorAtual;
    } else {
      seletorMesEl.value = meses[0];
    }

    return seletorMesEl.value;
  }

  // --- Métricas Mensais (com projeção de despesas recorrentes/fixas) ---
  function filtrarPorMes(lista, anoMes) {
    if (typeof obterLancamentosMesComRecorrencia === 'function') {
      return obterLancamentosMesComRecorrencia(lista, anoMes);
    }
    return (lista || []).filter(item => item.data && item.data.startsWith(anoMes));
  }

  function atualizarTotaisMensais(mes) {
    const entradasMes = filtrarPorMes(state.entradas, mes);
    const saidasMes   = filtrarPorMes(state.saidas, mes);

    const totalEntradas = somarLancamentos(entradasMes);
    const totalSaidas   = somarLancamentos(saidasMes);
    const saldo         = totalEntradas - totalSaidas;

    dashEntradasEl.textContent = 'R$ ' + formatarBRL(totalEntradas);
    dashSaidasEl.textContent   = 'R$ ' + formatarBRL(totalSaidas);
    dashLivreEl.textContent    = 'R$ ' + formatarBRL(saldo);

    dashLivreEl.className = 'dash-stat-value ' + (saldo >= 0 ? 'highlight' : 'expense');
  }

  // --- Renderização dos Gráficos Mensais ---
  function renderizarGraficos(mes) {
    destruirGraficosMensais();

    const entradasMes = filtrarPorMes(state.entradas, mes);
    const saidasMes   = filtrarPorMes(state.saidas, mes);

    const totalEntradas = somarLancamentos(entradasMes);
    const totalSaidas   = somarLancamentos(saidasMes);

    // Gráfico de Fluxo de Caixa (Barras)
    if (totalEntradas === 0 && totalSaidas === 0) {
      emptyFluxoEl.classList.remove('hidden');
      if (containerFluxo) containerFluxo.classList.add('hidden');
    } else {
      emptyFluxoEl.classList.add('hidden');
      if (containerFluxo) containerFluxo.classList.remove('hidden');

      const ctxFluxo = canvasFluxo.getContext('2d');
      chartFluxo = new Chart(ctxFluxo, {
        type: 'bar',
        data: {
          labels: ['Entradas', 'Saídas'],
          datasets: [{
            data: [totalEntradas, totalSaidas],
            backgroundColor: [
              'rgba(53, 201, 138, 0.85)',
              'rgba(226, 105, 78, 0.85)'
            ],
            borderColor: [
              '#35C98A',
              '#E2694E'
            ],
            borderWidth: 1.5,
            borderRadius: 10,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#171C27',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              titleColor: '#EDEFF3',
              bodyColor: '#EDEFF3',
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: ctx => ` R$ ${formatarBRL(ctx.parsed.y)}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: '#8B93A3',
                font: { size: 12, family: 'var(--font-sans)', weight: '600' }
              }
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#5B6373',
                font: { size: 11, family: 'var(--font-mono)' },
                callback: val => 'R$ ' + formatarBRL(val)
              }
            }
          }
        }
      });
    }

    // Gráfico de Despesas por Categoria (Rosca)
    if (saidasMes.length === 0) {
      emptyDespesasEl.classList.remove('hidden');
      if (containerDespesas) containerDespesas.classList.add('hidden');
    } else {
      emptyDespesasEl.classList.add('hidden');
      if (containerDespesas) containerDespesas.classList.remove('hidden');

      const totaisPorCat = {};
      saidasMes.forEach(item => {
        const cat = item.categoria || CATEGORIA_SAIDA_PADRAO;
        totaisPorCat[cat] = (totaisPorCat[cat] || 0) + item.valor;
      });

      const categorias = Object.keys(totaisPorCat);
      const valores    = Object.values(totaisPorCat);
      const cores = categorias.map((cat, i) =>
        CORES_CATEGORIAS[cat] || PALETA_CORES_VIBRANTES[i % PALETA_CORES_VIBRANTES.length]
      );

      const ctxDespesas = canvasDespesas.getContext('2d');
      chartDespesas = new Chart(ctxDespesas, {
        type: 'doughnut',
        data: {
          labels: categorias,
          datasets: [{
            data: valores,
            backgroundColor: cores,
            borderColor: '#171C27',
            borderWidth: 2,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#8B93A3',
                font: { size: 11.5, family: 'var(--font-sans)' },
                padding: 14,
                boxWidth: 12,
                boxHeight: 12,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: '#171C27',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              titleColor: '#EDEFF3',
              bodyColor: '#EDEFF3',
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: ctx => {
                  const val = ctx.parsed;
                  const total = valores.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                  return ` ${ctx.label}: R$ ${formatarBRL(val)} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

  function atualizarDashboard() {
    const mesAtivo = popularSeletorMeses();
    if (mesAtivo) {
      atualizarTotaisMensais(mesAtivo);
      renderizarGraficos(mesAtivo);
    } else {
      destruirGraficosMensais();
      dashEntradasEl.textContent = 'R$ 0,00';
      dashSaidasEl.textContent   = 'R$ 0,00';
      dashLivreEl.textContent    = 'R$ 0,00';
      dashLivreEl.className      = 'dash-stat-value highlight';
      emptyFluxoEl.classList.remove('hidden');
      if (containerFluxo) containerFluxo.classList.add('hidden');
      emptyDespesasEl.classList.remove('hidden');
      if (containerDespesas) containerDespesas.classList.add('hidden');
    }
  }

  // --- Motor de Projeção de Juros Compostos ---
  function obterPatrimonioAtualAcumulado() {
    return (state.historicoInvestimentos || []).reduce((acc, cur) => acc + paraNumeroMonetario(cur.valor), 0);
  }

  function calcularMediaHistoricaAporte() {
    if (!state.historicoInvestimentos || state.historicoInvestimentos.length === 0) return 0;
    const soma = obterPatrimonioAtualAcumulado();
    return soma / state.historicoInvestimentos.length;
  }

  function atualizarDisplayPatrimonioAtual() {
    const pv = obterPatrimonioAtualAcumulado();
    const count = (state.historicoInvestimentos || []).length;
    if (projecaoPvDigitsEl) {
      projecaoPvDigitsEl.textContent = formatarBRL(pv);
    }
    if (projecaoPvSubEl) {
      projecaoPvSubEl.textContent = count === 0
        ? 'Nenhum aporte efetivado ainda. Registre aportes na aba Calculadora.'
        : `Base real calculada a partir de ${count} ${count === 1 ? 'aporte efetivado' : 'aportes efetivados'}.`;
    }
  }

  function renderizarProjecao() {
    destruirGraficoProjecao();
    atualizarDisplayPatrimonioAtual();

    const pv = obterPatrimonioAtualAcumulado();
    const taxaMensalPct = paraNumero(projecaoTaxaInput.value || '0.8');
    const taxaMensal = taxaMensalPct / 100;
    const anos = Math.max(1, Math.min(50, Math.round(paraNumero(projecaoAnosInput.value || '10'))));
    const totalMeses = anos * 12;

    let pmt = 0;
    if (state.usuarioEditouAporteFuturo) {
      pmt = paraNumeroMonetario(projecaoPmtInput.value);
    } else {
      const media = calcularMediaHistoricaAporte();
      pmt = media > 0 ? media : state.investimentoTotalAtual;
      projecaoPmtInput.value = pmt > 0 ? formatarBRL(pmt) : '';
    }

    if (pv <= 0 && pmt <= 0) {
      projecaoTotalAportadoEl.textContent = 'R$ 0,00';
      projecaoTotalFinalEl.textContent    = 'R$ 0,00';
      emptyProjecaoEl.classList.remove('hidden');
      if (containerProjecao) containerProjecao.classList.add('hidden');
      return;
    }

    emptyProjecaoEl.classList.add('hidden');
    if (containerProjecao) containerProjecao.classList.remove('hidden');

    const rotulos = ['Início'];
    const dadosAportado = [pv];
    const dadosRendimento = [0];

    let montanteAtual = pv;
    let totalInvestidoAcumulado = pv;

    for (let mes = 1; mes <= totalMeses; mes++) {
      montanteAtual = montanteAtual * (1 + taxaMensal) + pmt;
      totalInvestidoAcumulado += pmt;

      if (mes % 12 === 0 || mes === totalMeses) {
        const anoNum = Math.floor(mes / 12);
        rotulos.push(`Ano ${anoNum}`);
        dadosAportado.push(Math.round(totalInvestidoAcumulado * 100) / 100);
        const rendimento = Math.max(0, montanteAtual - totalInvestidoAcumulado);
        dadosRendimento.push(Math.round(rendimento * 100) / 100);
      }
    }

    const totalAportadoFuturo = pmt * totalMeses;
    projecaoTotalAportadoEl.textContent = 'R$ ' + formatarBRL(pv + totalAportadoFuturo);
    projecaoTotalFinalEl.textContent    = 'R$ ' + formatarBRL(montanteAtual);

    const ctx = canvasProjecao.getContext('2d');
    chartProjecao = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: rotulos,
        datasets: [
          {
            label: 'Total Aportado (Base + Aportes)',
            data: dadosAportado,
            backgroundColor: 'rgba(140, 126, 224, 0.85)',
            borderColor: '#8C7EE0',
            borderWidth: 1.5,
            borderRadius: 6,
            stack: 'patrimonio'
          },
          {
            label: 'Juros Compostos Acumulados',
            data: dadosRendimento,
            backgroundColor: 'rgba(53, 201, 138, 0.85)',
            borderColor: '#35C98A',
            borderWidth: 1.5,
            borderRadius: 6,
            stack: 'patrimonio'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#8B93A3',
              font: { size: 11.5, family: 'var(--font-sans)' },
              padding: 12,
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#171C27',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleColor: '#EDEFF3',
            bodyColor: '#EDEFF3',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: R$ ${formatarBRL(ctx.parsed.y)}`,
              afterBody: items => {
                const total = items.reduce((acc, cur) => acc + cur.parsed.y, 0);
                return `\nPatrimônio Estimado: R$ ${formatarBRL(total)}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              color: '#8B93A3',
              font: { size: 11, family: 'var(--font-sans)' }
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: '#5B6373',
              font: { size: 10, family: 'var(--font-mono)' },
              callback: val => 'R$ ' + formatarBRL(val)
            }
          }
        }
      }
    });
  }

  // --- Renderização Completa do Dashboard (Sincronização em Tempo Real) ---
  function renderizarTudo() {
    if (!seletorMesEl) {
      inicializarDOM();
    }
    if (!seletorMesEl) return;

    const activeEl = document.activeElement;

    if (projecaoTaxaInput && activeEl !== projecaoTaxaInput) {
      projecaoTaxaInput.value = state.taxaProjecao || '0.8';
    }
    if (projecaoAnosInput && activeEl !== projecaoAnosInput) {
      projecaoAnosInput.value = state.anosProjecao || '10';
    }
    if (projecaoPmtInput && activeEl !== projecaoPmtInput) {
      if (state.usuarioEditouAporteFuturo && state.aporteFuturoManual) {
        projecaoPmtInput.value = state.aporteFuturoManual;
      } else {
        const media = calcularMediaHistoricaAporte();
        projecaoPmtInput.value = media > 0 ? formatarBRL(media) : (state.investimentoTotalAtual > 0 ? formatarBRL(state.investimentoTotalAtual) : '');
      }
    }

    atualizarDashboard();
    atualizarDisplayPatrimonioAtual();
    renderizarProjecao();
  }

  window.renderizarTudo = renderizarTudo;
  window.atualizarDashboard = atualizarDashboard;
  window.atualizarGraficos = atualizarDashboard;
  window.renderizarGraficos = renderizarGraficos;

  if (window.MoneyHub && typeof window.MoneyHub.on === 'function') {
    window.MoneyHub.on('dadosAtualizados', renderizarTudo);
  }

  // --- Inicialização ao Carregar a Página ---
  document.addEventListener('DOMContentLoaded', async () => {
    inicializarDOM();
    await carregarDados();

    projecaoTaxaInput.value = state.taxaProjecao || '0.8';
    projecaoAnosInput.value = state.anosProjecao || '10';

    if (state.usuarioEditouAporteFuturo && state.aporteFuturoManual) {
      projecaoPmtInput.value = state.aporteFuturoManual;
    } else {
      const media = calcularMediaHistoricaAporte();
      projecaoPmtInput.value = media > 0 ? formatarBRL(media) : (state.investimentoTotalAtual > 0 ? formatarBRL(state.investimentoTotalAtual) : '');
    }

    atualizarDashboard();
    atualizarDisplayPatrimonioAtual();
    renderizarProjecao();
  });

})();
