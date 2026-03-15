# 🪐 Project Equinox: TrueW8
**Documento Master de Arquitetura, Produto e Regras de Negócio**

## 1. Visão Geral do Produto
O **TrueW8** é uma plataforma inteligente (Micro-SaaS) para consolidação, análise de risco e rebalanceamento de carteiras de investimentos globais. Ele centraliza o patrimônio do usuário (espalhado por múltiplas corretoras e mercados) e transforma a complexidade matemática da alocação de ativos em decisões claras, automatizadas e seguras.

### 1.1. Personas e Jobs to be Done (JTBD)
O sistema foi desenhado para atender quatro perfis do mundo real:
1. **O Investidor Autônomo:** Quer organizar a bagunça, ver o patrimônio consolidado e saber exatamente onde colocar o dinheiro novo.
2. **O Seguidor de Recomendações:** Assina relatórios e quer o "Blender" para sincronizar seu dinheiro com múltiplas carteiras sugeridas por analistas.
3. **O Protetor (Trader/Conservador):** Precisa isolar margens de garantia ou reservas de emergência do algoritmo de rebalanceamento.
4. **O Acumulador (Filosofia Bastter):** Nunca vende ativos. Usa o sistema apenas para direcionar aportes aos ativos que ficaram para trás.

---

## 2. Stack Tecnológico
- **Backend:** Java 17 + Spring Boot 3
- **Persistência:** PostgreSQL 16 + Spring Data JPA + Flyway
- **Segurança:** Spring Security + JWT
- **Frontend:** Expo (React Native) rodando na Web (Expo Router)
- **Inteligência Artificial:** Google Gemini 2.5 (SDK Java)
- **Infraestrutura:** VPS Hostinger (KVM4, Docker Bridge) + Traefik v3 (SSL) + Vercel (Frontend)
- **Pagamentos:** Stripe (Futura integração)

---

## 3. Estrutura de Dados (O Coração do Sistema)
A arquitetura baseia-se em "Cestas" para permitir o rebalanceamento isolado.
- `User`: Credenciais, limites da IA (OCR) e plano de assinatura.
- `UserPreferences`: Moeda base (BRL, USD), tolerância financeira, e flag do Modo Acumulador.
- `Portfolio`: As "Cestas" lógicas do usuário (ex: "Ações XP", "FIIs Modal", "Cripto Binance").
- `UserHolding`: O ativo em si (Ticker), pertencente a um `Portfolio`. Possui campos de mercado (B3, NYSE, CRYPTO), corretora, quantidade (precisão de 8 casas decimais) e preço médio.

---

## 4. Regras de Negócio e Funcionalidades Core

### 4.1. Visão Global e Multi-Mercado (Domínios)
- **Américas:** B3, NYSE, NASDAQ, TSX
- **Europa:** LSE, EURONEXT, XETRA
- **Ásia/Pacífico:** TSE, HKEX, ASX
- **Outros:** CRYPTO, FOREX
- *Regra B3:* Calcula ordens em lotes padrão (múltiplos de 100) e separa o mercado fracionário (F).
- *Regra Global:* Aceita frações nativamente, ignorando a regra de lotes.

### 4.2. O Blender de Carteiras (Sincronização)
O usuário faz upload de múltiplas carteiras (via IA) e define os "pesos" através de barras deslizantes (ex: 60% Dividendos, 40% Small Caps). O motor mescla os ativos, normaliza para 100% e gera as ordens necessárias cruzando com a custódia atual.

### 4.3. Raio-X de Risco (Termômetro & IA)
- **Camada 1 (Matemática):** Cálculo determinístico baseado no peso dos ativos (Renda Fixa = 1, Ações = 5, Cripto = 9). Gera uma barra de cor (Verde ao Vermelho).
- **Camada 2 (Inteligência Artificial):** O backend envia um JSON anonimizado (apenas tickers e %) para o Gemini 2.5, que atua como analista de risco e retorna um *Risk Score* (1-100) e *Insights* sobre exposição setorial e volatilidade.

### 4.4. O "Cofre" (Trava de Ativos)
Ativos marcados com `is_locked = true` são blindados. O financeiro deles é removido do total daquela carteira antes do cálculo de rebalanceamento, garantindo que nunca sejam vendidos ou diluídos pelas regras do motor.

### 4.5. Modo Acumulador (Strict Buy & Hold)
Se `allow_sells = false`, o algoritmo **jamais** gera uma ordem de VENDA. Ativos acima do peso ideal recebem status "HOLD", e o dinheiro novo é distribuído apenas entre os que estão abaixo da meta.

---

## 5. Fluxos de UX Inteligentes
1. **Onboarding Mágico:** Elimina a fricção inicial. O usuário cadastra a custódia enviando um print da corretora (OCR) ou colando a tabela do Home Broker (Smart Paste).
2. **Dashboard de Abas:** Visão Consolidada (Gráfico total) vs. Visão por Carteira (Portfolios).
3. **A Boleta Limpa:** Tela de resultados que agrupa as ordens geradas por **Corretora**, facilitando a execução manual pelo usuário.

---

## 6. Modelo de Monetização (Freemium com Paywall)

| Funcionalidade | TrueW8 Free (Iniciante) | TrueW8 PRO (Investidor) |
| :--- | :--- | :--- |
| **Mercados** | 1 "Home Market" à escolha | Ilimitado (Global + Cripto) |
| **Corretoras** | Apenas 1 corretora permitida | Ilimitado (Visão Consolidada) |
| **Onboarding Mágico** | 1 uso (apenas no cadastro inicial) | Ilimitado |
| **OCR para Recomendações**| Manual ou 2 envios totais | Ilimitado (Gemini 2.5) |
| **Blender de Carteiras** | Apenas 1 alvo | Múltiplas carteiras simultâneas |
| **Análise de Risco** | Apenas Termômetro Matemático | Raio-X avançado com IA (Insights) |
| **O "Cofre" (Trava)** | Indisponível | Ativo |
| **Modo Acumulador** | Indisponível | Ativo (Sem vendas) |

---

## 7. Identidade Visual e Legal
- **Conceito Visual:** "O Equilíbrio Infinito".
- **Símbolo:** Símbolo do infinito (8 horizontal) estilizado e contínuo.
- **Cores:** Navy Blue (Estabilidade), Gold (Valor Algorítmico), Emerald Green (Estratégia e Risco Controlado).
- **Disclaimer Legal:** "O TrueW8 é uma ferramenta matemática e analítica. Os cálculos de rebalanceamento e os *insights* de risco gerados por Inteligência Artificial não constituem recomendação de compra, venda ou manutenção de valores mobiliários. A execução de ordens é de inteira responsabilidade do usuário."