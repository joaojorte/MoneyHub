# MoneyHub — Calculadora Financeira Pessoal & Dashboard Analítico

**MoneyHub** é uma plataforma financeira pessoal completa e moderna que opera no navegador web conectada diretamente à nuvem via **Supabase**. Todo o processamento ocorre via JavaScript puro com persistência em tempo real na tabela remota `moneyhub_nuvem`, garantindo sincronização e fonte única da verdade para seus dados financeiros.

A proposta do projeto une **gestão de fluxo de caixa em tempo real** (cálculo do saldo livre para gastar após investimentos e reserva), **visão analítica mensal** (gráficos interativos de receitas, despesas e categorias) e um **motor de projeção patrimonial** baseado em juros compostos reais e histórico de aportes.

---

## 📁 Arquitetura e Estrutura de Pastas

O projeto adota uma arquitetura modular dividida em três pastas de responsabilidade única, contendo cada uma seus respectivos arquivos HTML, CSS e JavaScript:

```text
MoneyHub/
├── index.html                   → Ponto de entrada raiz com redirecionamento automático
├── README.md                    → Documentação técnica e guia de uso
│
├── app/                         → Núcleo compartilhado da aplicação
│   ├── app.html                 → Página portal / visão geral dos módulos
│   ├── app.css                  → Design System, variáveis CSS (:root), reset, tipografia e tema
│   └── app.js                   → Estado global, persistência em nuvem (Supabase), formatadores e utilitários
│
├── calculadora/                 → Módulo da Calculadora Financeira
│   ├── calculadora.html         → Interface da calculadora, painel hero e formulários
│   ├── calculadora.css          → Estilos visuais exclusivos do painel, sliders e históricos
│   └── calculadora.js           → Lógica de lançamentos, sliders, cálculo em tempo real e aportes
│
└── dashboard/                   → Módulo do Dashboard Analítico & Projeções
    ├── dashboard.html           → Interface dos indicadores, seletores de mês e gráficos
    ├── dashboard.css            → Estilos dos cards analíticos, grid de gráficos e simulação
    └── dashboard.js             → Integração com Chart.js, filtros mensais e motor de juros compostos
```

### Como Executar

Por ser uma aplicação nativa e 100% estática:
1. Basta abrir o arquivo [`index.html`](file:///c:/Users/Maria/Downloads/MoneyHub/index.html) diretamente com duplo clique no navegador padrão (Chrome, Edge, Firefox, Safari).
2. O `index.html` redirecionará você instantaneamente para a Calculadora (`calculadora/calculadora.html`).
3. Você também pode navegar diretamente para qualquer módulo pelas abas no topo da aplicação.

---

## 🚀 Funcionalidades Principais

### 1. Calculadora Financeira Pessoal (`calculadora/`)

- **Visor em Destaque ("Livre para Gastar"):**
  - Mostra em tempo real quanto dinheiro sobra de fato no orçamento após deduzir despesas, investimentos e reserva de emergência.
  - Formatação monetária brasileira de alta precisão (`pt-BR`).
- **Lançamentos com Captura Temporal e Categorias:**
  - **Entradas:** Descrição, valor, categoria (*Salário, Dividendos, Rendimentos, Estorno/Devolução, Outros*) e data específica do recebimento (com preenchimento automático para o dia atual).
  - **Saídas:** Descrição, valor, categoria (*Alimentação, Mercado, Transporte, Saúde, Educação, Comunicação, Compras, Serviços, Transferências, Não identificado*) e data do pagamento.
  - Histórico visual com remoção instantânea (`×`).
- **Distribuição Inteligente de Renda:**
  - **Investimentos:** Slider percentual (0% a 100%) sobre o Total Salário + campo de Aporte Extra livre + 100% dos Dividendos reinvestidos.
  - **Reserva de Emergência:** Slider percentual (0% a 100%) sobre o Total Salário com mini-visor de valor estimado.
  - Sincronização bidirecional em tempo real entre sliders e campos numéricos.
- **Efetivação de Investimentos no Histórico Real:**
  - Botão **"Efetivar Investimento"** que salva o montante investido calculado na data informada dentro do histórico real de patrimônio (`historicoInvestimentos`).

---

### 2. Dashboard Analítico Mensal (`dashboard/`)

- **Seletor de Mês Dinâmico:**
  - Agrupa automaticamente os lançamentos por ano/mês (ex.: *Setembro de 2026*) com base nas datas cadastradas.
- **Métricas Consolidadas:**
  - Total de Entradas do Mês.
  - Total de Saídas do Mês.
  - Saldo Líquido do Mês (com indicação visual verde/vermelho).
- **Gráficos Interativos (via Chart.js):**
  - **Fluxo de Caixa (Barras):** Comparativo visual direto entre Entradas e Saídas do mês de referência.
  - **Despesas por Categoria (Rosca / Doughnut):** Fatiamento percentual dos gastos por centro de custo, permitindo identificar onde o orçamento está mais comprometido.

---

### 3. Motor de Projeções — Juros Compostos (`dashboard/`)

O simulador de patrimônio calcula o futuro financeiro a partir de dados reais já consolidados pelo usuário:

- **Patrimônio Atual Acumulado ($PV$):**
  - Exibe a soma de todos os aportes reais efetivados na Calculadora, sem depender de valores arbitrários ou variáveis soltas.
- **Controles Paramétricos:**
  - **Taxa Mensal (% a.m.):** Taxa de rendimento esperada (padrão: 0,8% a.m.).
  - **Prazo em Anos:** Horizonte de investimento simulado (ex.: 5, 10, 20 ou 30 anos).
  - **Aporte Futuro ($PMT$):** Sugere automaticamente a média histórica dos aportes realizados ou o aporte mensal atual, permitindo edição manual a qualquer momento.
- **Resumo e Gráfico de Barras Empilhadas:**
  - Discrimina ano a ano o **Total Aportado** (capital próprio investido) vs. **Juros Compostos Acumulados** (efeito exponencial do rendimento sobre rendimento).

---

## 📐 Fórmulas e Matemática Financeira

### 1. Saldo Livre para Gastar
A lógica da função `calcular()` segue os seguintes passos estruturais:

1. **Isolamento de Dividendos:**
   Dividendos nunca são computados como renda livre de giro:
   $$\text{Entradas Comuns} = \sum \text{Entradas} - \text{Total Dividendos}$$

2. **Total Destinado a Investimentos:**
   $$\text{Investimento Total} = \left(\frac{\text{Total Salário} \times \%_{\text{investimento}}}{100}\right) + \text{Aporte Extra} + \text{Total Dividendos}$$

3. **Total Destinado à Reserva:**
   $$\text{Reserva Total} = \frac{\text{Total Salário} \times \%_{\text{reserva}}}{100}$$

4. **Saldo Final Livre:**
   $$\text{Livre para Gastar} = \text{Entradas Comuns} - \sum \text{Saídas} - \left(\frac{\text{Total Salário} \times \%_{\text{investimento}}}{100}\right) - \text{Aporte Extra} - \text{Reserva Total}$$

### 2. Projeção de Juros Compostos com Aportes Recorrentes
Para cada mês $n$ de $1$ até $N = \text{anos} \times 12$:
$$M_n = M_{n-1} \times (1 + i) + PMT$$
Onde:
- $M_0 = PV$ (Patrimônio Atual Acumulado real)
- $i$ = Taxa de juros mensal expressa em decimal ($\% \div 100$)
- $PMT$ = Aporte mensal futuro
- $\text{Rendimento Acumulado}_n = M_n - (PV + PMT \times n)$

---

## 🛠️ Detalhes Técnicos e Boas Práticas

- **Zero Dependências de Build:** Nenhum Node.js, Webpack, Vite ou npm é obrigatório. Funciona perfeitamente offline e direto do sistema de arquivos.
- **Normalização Decimal Brasileira:** Campos de moeda aceitam vírgula (`45,90`) e ponto de milhar (`1.500,00`) através de um parser que normaliza antes da conversão numérica.
- **Tratamento de Artefatos de Ponto Flutuante:** Subtrações em ponto flutuante que resultariam em `-0.00000000000001` são filtradas para exibir `0,00`, mantendo valores negativos reais quando há déficit legítimo.
- **Construção Segura do DOM:** Criação de nós HTML através de elementos nativos do DOM (`document.createElement`), protegendo contra injeção de scripts (XSS).
- **Persistência em Nuvem (Supabase):** Tabela remota `moneyhub_nuvem` indexada pelo ID seguro do usuário (`meu-cofre-secreto`), com sincronização assíncrona (`async/await`) e total substituição do armazenamento local.
- **Design System Dark Mode:** Paleta construída com variáveis CSS baseada em tons profundos de ardósia (`#0E121A`, `#171C27`), tipografia sem serifa para interface e monoespaçada para numerais monetários tabulares.

---

## 📋 Requisitos do Sistema

- Navegador moderno: Google Chrome, Mozilla Firefox, Microsoft Edge, Opera ou Safari (versões recentes).
- Chart.js carregado via CDN (para funcionamento com internet) ou baixado localmente para ambientes 100% isolados.
