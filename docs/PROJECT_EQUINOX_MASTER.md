# 🪐 Project Equinox: TrueW8
**Documento Master de Arquitetura, Produto e Regras de Negócio**

## 1. Visão Geral do Produto
O **TrueW8** é um Micro-SaaS focado em rebalanceamento inteligente de carteiras de investimentos globais. Ele consolida todo o patrimônio do usuário (B3, Exterior, Cripto, Renda Fixa) espalhado por **múltiplas corretoras** em um único painel, transformando a complexidade matemática da alocação de ativos em decisões claras.

### 1.1. Personas e Jobs to be Done (JTBD)
O sistema atende necessidades do mundo real:
1. **O Investidor Autônomo Multi-Contas:** Tem ativos no Brasil, EUA e Cripto em corretoras diferentes. Quer ver o bolo total e saber onde aportar.
2. **O Seguidor de Recomendações:** Quer sincronizar seu patrimônio com carteiras recomendadas via upload de prints.
3. **O Protetor (Cofre):** Deseja isolar partes do patrimônio (Reserva de Emergência, Garantias para Day Trade/Opções) do algoritmo de rebalanceamento.
4. **O Acumulador (Filosofia Buy & Hold / Bastter):** O investidor que *nunca* vende. Usa o sistema apenas para saber onde aportar dinheiro novo, convergindo a carteira para o alvo sem gerar ordens de venda.

---

## 2. Stack Tecnológico
- **Backend:** Java 17 + Spring Boot 3
- **Persistência:** PostgreSQL 16 + Spring Data JPA + Flyway
- **Segurança:** Spring Security + JWT
- **Frontend:** Expo (React Native) rodando na Web (Expo Router)
- **Inteligência Artificial:** Google Gemini 2.5 (SDK Java)
- **Infraestrutura:** VPS Hostinger (KVM4, Docker) + Traefik v3 + Vercel (Frontend)

---

## 3. Regras de Negócio Core (O Motor Equinox)

### 3.1. Visão Global e Multi-Mercado
O motor é agnóstico. Cada ativo possui `Market` (B3, NYSE, NASDAQ, CRYPTO) e `AssetType` (STOCK, FII, CRYPTO, FIXED_INCOME).
- **Regra B3:** Se mercado padrão, calcula lotes de 100 e separa o fracionário (sufixo 'F').
- **Regra Global:** Aceita frações nativamente (ex: 0.054 BTC), ignorando a regra de lotes.

### 3.2. Visão Multi-Corretora (Instituições)
Cada ativo na custódia está atrelado a uma `Brokerage` (Corretora/Instituição). 
- O cálculo de rebalanceamento é feito sobre o **Patrimônio Total Consolidado**, mas na hora de gerar as ordens, o sistema indica em qual corretora aquele ativo está custodiado para facilitar a execução.

### 3.3. Modo Acumulador (Strict Buy & Hold)
Se o usuário ativar a preferência `allow_sells = false`:
- O algoritmo **jamais** gerará uma ordem de `SELL`.
- Ativos acima do percentual alvo recebem o status `HOLD`.
- O aporte é distribuído apenas entre os ativos que estão *abaixo* do peso ideal.

### 3.4. Tolerância Financeira Personalizada
Para evitar ordens com valores irrisórios (gastando corretagem à toa), aplica-se uma margem:
- Se a diferença calculada for inferior à `tolerance_value` configurada, a ação vira **HOLD**.

### 3.5. A Trava de Segurança (O "Cofre")
Ativos com o "Cadeado" ativado (`is_locked = true`) são blindados. O financeiro deles é removido do bolo total antes do cálculo do rebalanceamento.

---

## 4. Arquitetura de UX, Personalização e Fluxos

### 4.1. Configurações (Settings)
- **Moeda Base:** Visão do patrimônio total unificada (ex: BRL, USD, EUR).
- **Tolerância Financeira:** Configurável pelo usuário (Padrão: R$ 10,00).
- **Modo Acumulador:** Toggle global "Nunca sugerir vendas".
- **Tema:** Light / Dark Mode.

### 4.2. Fluxos Principais
1. **Dashboard Consolidado:**
   - Gráfico unificando o patrimônio total (todas as corretoras).
   - Lista da custódia agrupada ou com *tags* da Corretora e do Mercado (🇧🇷 BTG, 🇺🇸 Avenue, 🪙 Binance).
   - O *toggle* de "Cadeado" visível e acionável por ativo.
2. **A Boleta (Tela de Resultados):**
   - **Crucial:** Agrupa as ordens de COMPRA/VENDA por Corretora. Exemplo: "Ordens para executar na Avenue", "Ordens para executar no BTG". Isso zera a fricção do usuário.

---

## 5. Integração com Inteligência Artificial (OCR)
- **Modelo:** Gemini 2.5 (`https://api.truew8.com/ocr/upload`)
- **Prompt Base:** Extrair um JSON limpo (`[{"ticker": "string", "quantity": "number", "brokerage": "string"}]`).
- A IA pode tentar inferir a corretora lendo o cabeçalho do print.

---

## 6. Modelo de Dados (Entidades Chave no PostgreSQL)
- `User`: Credenciais e limites (OCR).
- `UserPreferences`: Tabela 1:1 (moeda base, tolerância, modo acumulador).
- `UserHolding`: A custódia (ticker, mercado, corretora, tipo, quantidade, preço médio, `is_locked`).

---

## 7. Identidade Visual (Branding)
- **Conceito:** "O Equilíbrio Infinito".
- **Símbolo:** Símbolo do infinito (número 8 horizontal) contínuo e minimalista.
- **Cores:** Navy Blue (Estabilidade), Gold (Valor) e Emerald Green (Crescimento/Estratégia).