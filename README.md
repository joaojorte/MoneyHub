# MoneyHub — Gestão Financeira Inteligente & Dashboard Analítico

<div align="center">

![MoneyHub Banner](https://img.shields.io/badge/Versão-2.0.0-emerald?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.x-purple?style=for-the-badge&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8?style=for-the-badge&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ecf8e?style=for-the-badge&logo=supabase)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)

**Plataforma moderna de inteligência financeira pessoal e empresarial, unindo gestão de fluxo de caixa, controle avançado de cartões de crédito estilo Apple Wallet, gráficos analíticos de despesas e simulação exponencial de patrimônio.**

</div>

---

## 🌟 Visão Geral & Destaques da Versão 2.0

O **MoneyHub** passou por uma reformulação estrutural e de design inspirada nas melhores fintechs globais e no modelo executivo `MODEL.PDF`:

* **Hub Unificada (Dashboard & Cartões)**: Fusão das antigas telas de *Dashboard* e *Cartões* em uma experiência integrada e centralizada, eliminando redundâncias visuais e organizando os dados de crédito diretamente ao lado do fluxo de receitas e despesas.
* **Hub Exclusiva de Investimentos**: Módulo independente dedicado à saúde financeira de longo prazo, com metodologia 50/30/20, simulador de juros compostos com gráfico de projeção anual e histórico permanente de aportes.
* **Header Limpo & Executivo**:
  * **Canto Superior Esquerdo**: Exclusivamente a logo **MoneyHub** com tipografia refinada e acesso direto à navegação.
  * **Canto Superior Direito**: Informações de autenticação (e-mail do usuário ativo com indicador de status de sincronização em tempo real) e alternador dinâmico de Modo de Página (Escuro / Claro).
* **Padronização Tipográfica Dupla (Textos e Números)**:
  * **Textos e Interface**: Fonte primária **SF Pro Display** e secundária **Helvetica**.
  * **Números e Moedas**: 
    * **Fonte Numérica Primária (`font-num-primary`)**: Utiliza **SF Pro Display** com peso `font-black`, inspirada na métrica *"Quantia Utilizada"*. Aplicada nos saldos de destaque, fatura atual e títulos monetários principais.
    * **Fonte Numérica Secundária (`font-num-secondary`)**: Utiliza **Helvetica** com peso `font-bold` e suporte a números tabulares (`tabular-nums`), inspirada no quadro *"Limite Disponível"*. Aplicada em limites de crédito, valores de categorias, badges e médias mensais.
* **Gráfico de Barras com Filtro de Adesão**: Histórico mensal de despesas que projeta **estritamente os meses a partir da data de criação da conta** do usuário (`usuario.created_at` ou registro de conta local), evitando barras vazias ou meses anteriores à entrada no sistema.
* **Gastos por Categoria (Pizza 100% + Cartões)**: Gráfico de pizza vetorial SVG onde o círculo completo representa a totalidade das despesas do período, complementado por um grid de cartões detalhados por área de consumo.
* **Motor Avançado de Cartão de Crédito**:
  * Adição de parcelas já em andamento (ex.: compra cadastrada a partir da 3ª de 10 parcelas).
  * Lançamento de **Fatura Consolidada** com conciliação automática, permitindo lançar o valor total da fatura sem duplicação de saídas no saldo líquido.
  * Suporte a múltiplos cartões com Apple Wallet View e seletor rápido.

---

## 🏛️ Arquitetura das 3 Hubs

O MoneyHub divide as operações em 3 hubs complementares acessíveis pela barra lateral esquerda (desktop) ou seletor responsivo (mobile):

```text
MoneyHub/
├── 📊 Dashboard        → Visão unificada: métricas de crédito, Apple Wallet, gráfico de barras e categorias
├── 🧮 Calculadora      → Fluxo de caixa: entradas, saídas, parcelamentos em andamento e extrato temporal
└── 📈 Investimentos    → Planejamento patrimonial: regra 50/30/20, juros compostos e histórico de aportes
```

---

### 1. Hub Dashboard Unificado (`UnifiedDashboard.jsx`)

Desenvolvida seguindo rigorosamente a disposição e hierarquia de informações do `MODEL.PDF`:

* **Indicadores no Topo**:
  * **Fatura Atual**: Soma consolidada das despesas do cartão no ciclo vigente.
  * **Limite Disponível**: Crédito livre para utilização imediata (`Limite Cadastrado - Quantia Utilizada`).
  * **Limite Cadastrado**: Teto total de crédito atribuído ao cartão selecionado.
  * **Saldo Líquido do Mês**: Saldo real apurado entre Receitas Líquidas e Despesas Totais.
* **Seção de Cartões (Apple Wallet)**:
  * **Barra de Progresso com Quantia Utilizada**: Exibição destacada em `font-num-primary` com medidor percentual de consumo de crédito.
  * **Cartão Gráfico Realista**: Renderização visual do cartão com gradientes customizados por bandeira/emissor (Nubank, Itaú, Inter, Bradesco, etc.), chip de segurança EMV e alternador entre cartões cadastrados.
  * **Modal de Gestão Ampliado**: Interface moderna para cadastrar novos cartões ou editar limite, dia de vencimento e apelido.
  * **Barra de Conciliação**: Acompanhamento percentual entre saídas detalhadas e o total lançado para a fatura.
* **Gráfico de Barras de Despesas Mensais**:
  * Substituição de antigas timelines por colunas verticais interativas.
  * Filtro dinâmico que exibe apenas os meses desde o cadastro da conta do usuário.
  * Seleção interativa: ao clicar em uma barra, o dashboard filtra as métricas para o mês correspondente.
* **Gastos por Categoria**:
  * **Gráfico de Pizza SVG**: Visualização em rosca/pizza em que a totalidade das despesas compõe 100% da área do gráfico.
  * **Grid de Cartões**: Cada categoria (Alimentação, Moradia, Transporte, Saúde, Lazer, etc.) recebe um card elegante com ícone temático, valor total em BRL e badge de percentual relativo.

---

### 2. Hub Calculadora Financeira (`ExpenseForm.jsx`, `IncomeForm.jsx`)

* **Lançamento Ágil de Receitas**:
  * Registro de proventos, salários, dividendos e rendimentos extras.
  * Seletores de data rápida (*Hoje*, *Ontem*, *Anteontem*).
* **Lançamento Completo de Despesas**:
  * Formas de pagamento suportadas: Pix, Dinheiro, Transferência Bancária, Débito e Cartão de Crédito.
  * **Parcelas em Andamento**: Permite registrar gastos que já começaram em meses anteriores, definindo o número da parcela atual e o total de repetições (ex.: parcela 4 de 12).
  * **Lançamento de Fatura Total (Anti-Duplicação)**: Opção de registrar o valor total da fatura fechada do cartão. Ao ser ativado (`isFaturaTotal: true`), as saídas individuais do cartão atuam exclusivamente para detalhamento analítico (conciliação), assegurando que o saldo em conta não seja debitado duas vezes.
  * **Vinculação a Cartões Específicos**: Diferenciação automática caso o usuário possua mais de um cartão de crédito.
* **Extrato e Histórico (`TransactionList.jsx`)**:
  * Listagem cronológica dos lançamentos com busca e filtros por período e categoria.

---

### 3. Hub de Investimentos (`InvestmentsHub.jsx`)

* **Metodologia de Alocação 50 / 30 / 20**:
  * Divisão recomendada da renda líquida:
    * **50% — Necessidades Básicas** (moradia, contas fixas, alimentação básica).
    * **30% — Desejos Pessoais** (lazer, restaurantes, compras, bem-estar).
    * **20% — Investimentos & Poupança** (reserva de emergência, aportes patrimoniais).
  * Sliders interativos com cálculo instantâneo dos valores sugeridos e barra de distribuição proporcional.
* **Simulador de Juros Compostos**:
  * Variáveis customizáveis: Aporte Inicial (R$), Aporte Mensal (R$), Taxa Mensal (% a.m.) e Prazo (anos).
  * Gráfico de projeção anual comparando o **Total Investido pelo Usuário** vs. **Juros Acumulados** (efeito bola de neve).
* **Registro de Aportes**:
  * Histórico para acompanhamento sistemático dos aportes realizados ao longo do tempo.

---

## 🎨 Tipografia e Design System

O MoneyHub implementa um sistema tipográfico duplo tanto para interface textual quanto para exibição numérica:

### Fontes de Interface (Texto)
| Papel | Família Tipográfica | Aplicações |
| :--- | :--- | :--- |
| **Primária** | `SF Pro Display`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif` | Títulos, cabeçalhos, botões principais, nomes de abas e corpo geral. |
| **Secundária** | `Helvetica`, `'Helvetica Neue'`, `Arial`, `sans-serif` | Subtítulos, legendas de gráficos, descrições contextuais e rótulos auxiliares. |

### Fontes Numéricas (Moedas e Contadores)
| Classe CSS | Família & Estilo | Referência Visual | Aplicações Principais |
| :--- | :--- | :--- | :--- |
| `.font-num-primary` | `SF Pro Display`, `font-black`, `tabular-nums` | Bloco *"Quantia Utilizada"* | Saldo Líquido, Fatura Atual, Quantia Utilizada, grandes totais em destaque. |
| `.font-num-secondary` | `Helvetica`, `font-bold`, `tabular-nums` | Bloco *"Limite Disponível"* | Limite Disponível, Limite Cadastrado, badges de percentual, valores por categoria, médias. |

---

## 💻 Estrutura de Diretórios do Projeto

```text
MoneyHub/
├── index.html                                 → Ponto de entrada HTML com fontes pré-carregadas
├── package.json                               → Metadados e dependências do ecossistema React/Vite
├── tailwind.config.js                         → Configuração do TailwindCSS, temas e paleta refinada
├── vite.config.js                             → Configurações de bundling, aliases e otimização
├── vercel.json                                → Regras de redirecionamento SPA para produção na Vercel
├── GEMINI.md                                  → Diretrizes obrigatórias de sincronização contínua
│
├── .github_sync/                              → Pipeline de integração contínua
│   └── sync.ps1                               → Script de commit e push automático via GitHub REST API
│
└── src/
    ├── main.jsx                               → Inicialização do React 18 e montagem na DOM
    ├── App.jsx                                → Layout principal: Header, navegação por abas e renderização
    ├── index.css                              → Reset global, temas escuro/claro e utilitários tipográficos
    │
    ├── components/
    │   ├── layout/
    │   │   └── Sidebar.jsx                    → Barra lateral de navegação entre as 3 hubs principais
    │   ├── ui/
    │   │   ├── Button.jsx                     → Botão padrão com estados de loading e variantes
    │   │   ├── DateChips.jsx                  → Chips para seleção ágil de datas (Hoje/Ontem/etc.)
    │   │   ├── DueDateBadge.jsx               → Badge indicativo de dias para o vencimento da fatura
    │   │   ├── SegmentedControl.jsx           → Alternador de abas e filtros em formato de pílula
    │   │   ├── StatCard.jsx                   → Card de métricas com suporte a fontes numéricas padronizadas
    │   │   └── ThemeToggle.jsx                → Alternador suave entre modo claro e escuro
    │   ├── dashboard/
    │   │   ├── Dashboard.jsx                  → Componente base legado de métricas analíticas
    │   │   └── UnifiedDashboard.jsx           → Hub Unificada: Apple Wallet, Gráficos de Barra e Categorias
    │   ├── cards/
    │   │   └── CreditCardDashboard.jsx        → Gestão de cartões, Apple Wallet Card e modal de edição
    │   ├── calculator/
    │   │   ├── ExpenseForm.jsx                → Lançamento de despesas, parcelas em andamento e faturas
    │   │   ├── IncomeForm.jsx                 → Lançamento de receitas e proventos
    │   │   ├── DistributionBar.jsx            → Barra de distribuição de gastos por categoria
    │   │   └── SlidersSection.jsx             → Ajuste de proporções de gastos
    │   ├── history/
    │   │   ├── TransactionItem.jsx            → Linha individual de transação com ações de exclusão
    │   │   └── TransactionList.jsx            → Listagem paginada/filtrada de lançamentos
    │   └── investments/
    │       └── InvestmentsHub.jsx             → Hub completa de investimentos, 50/30/20 e simulador de juros
    │
    ├── hooks/
    │   ├── useCreditCards.js                  → Gerenciamento de múltiplos cartões, limites e vencimentos
    │   ├── useCreditCardDue.js                → Cálculo e contagem regressiva para vencimento de fatura
    │   ├── useDateChips.js                    → Estado e controle dos seletores de data rápida
    │   ├── useFinancialCalculator.js          → Motor de conciliação, totais do mês e balanço líquido
    │   ├── useTheme.js                        → Persistência de tema (dark/light) no localStorage
    │   └── useTransactions.js                 → CRUD de entradas/saídas com sincronização Supabase
    │
    ├── services/
    │   └── supabaseClient.js                  → Cliente oficial Supabase (Auth, Postgres e Realtime)
    │
    └── utils/
        ├── cashflow.js                        → Projeção de parcelas e conciliação de faturas
        ├── constants.js                       → Categorias de despesas, cores e definições de cartão
        ├── dataOptimizer.js                   → Otimização e indexação de dados para gráficos
        └── formatters.js                      → Formatação monetária (BRL), porcentagens e datas
```

---

## 🛠️ Instalação e Execução Local

### Pré-requisitos
* [Node.js](https://nodejs.org/) versão 18 ou superior instalada.
* Gerenciador de pacotes `npm` ou `yarn`.

### Como rodar o projeto
```bash
# 1. Clone o repositório
git clone https://github.com/joaojorte/MoneyHub.git
cd MoneyHub

# 2. Instale as dependências
npm install

# 3. Inicie o servidor local de desenvolvimento
npm run dev

# 4. Para validar o build de produção
npm run build
```

---

## ☁️ Deploy Contínuo (Vercel & GitHub)

O MoneyHub possui integração contínua com a **Vercel** através do repositório [`joaojorte/MoneyHub`](https://github.com/joaojorte/MoneyHub).

Cada evolução é sincronizada via script silencioso PowerShell:
```powershell
powershell.exe -ExecutionPolicy Bypass -File "c:\Users\Maria\Downloads\MoneyHub\.github_sync\sync.ps1"
```
Esse pipeline envia as modificações diretamente para a branch `main` no GitHub via REST API, disparando de forma 100% automatizada a compilação e publicação em produção na Vercel.

---

<div align="center">
  <sub>MoneyHub © 2026 — Inteligência Financeira Pessoal de Alta Performance</sub>
</div>
