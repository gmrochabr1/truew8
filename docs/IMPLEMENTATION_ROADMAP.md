# Roadmap de Implementacao do TrueW8

_Baseado na documentacao de arquitetura e no estado atual do codigo em 2026-03-20._

## Resumo Executivo

O produto ja tem uma espinha dorsal funcional: autenticacao com JWT e cookies HttpOnly, carteiras, holdings, preferencias, OCR no backend, motor de rebalanceamento e UI principal no frontend.

O que ainda falta, de acordo com a documentacao, esta concentrado em quatro frentes:

1. Monetizacao completa com Stripe e paywall.
2. Fluxo de OCR no frontend com tratamento de limite em nivel de produto.
3. Camada de risco/insights com Gemini alem do OCR.
4. Ampliacao de testes E2E e validacoes de contrato para cobrir os fluxos criticos.

## O Que Ja Esta Implementado

### Backend

- Autenticacao com registro, login, refresh, logout e `me`, usando cookies HttpOnly e JWT em [AuthController](../truew8-api/src/main/java/com/truew8/controller/AuthController.java) e [AuthService](../truew8-api/src/main/java/com/truew8/service/AuthService.java).
- Schema com Flyway e JPA em modo `validate`, com tabelas base para users, preferences, portfolios e holdings em [V001__init_core_schema.sql](../truew8-api/src/main/resources/db/migration/V001__init_core_schema.sql).
- Holdings cifrados e chave de ativo deterministica para validar unicidade sem expor dados sensiveis em [V002__holdings_ciphertext_columns.sql](../truew8-api/src/main/resources/db/migration/V002__holdings_ciphertext_columns.sql) e [V004__add_asset_key_to_user_holdings.sql](../truew8-api/src/main/resources/db/migration/V004__add_asset_key_to_user_holdings.sql).
- Preferencias de locale e customizacao de carteira em [PreferenceController](../truew8-api/src/main/java/com/truew8/controller/PreferenceController.java).
- Carteiras e holdings com create, list, update, delete e lock/unlock em [PortfolioController](../truew8-api/src/main/java/com/truew8/controller/PortfolioController.java).
- Motor de rebalanceamento com calculo server-side em [RebalanceEngineService](../truew8-api/src/main/java/com/truew8/service/RebalanceEngineService.java) e endpoint em [RebalanceController](../truew8-api/src/main/java/com/truew8/controller/RebalanceController.java).
- OCR backend com limite por usuario e chamada ao Gemini em [OcrService](../truew8-api/src/main/java/com/truew8/service/OcrService.java), [OcrController](../truew8-api/src/main/java/com/truew8/controller/OcrController.java) e [GoogleGeminiApiClient](../truew8-api/src/main/java/com/truew8/service/GoogleGeminiApiClient.java).
- Campos e regras de dominio para carteira travada, tolerancia, permitir vendas, moeda base e limite OCR em [User](../truew8-api/src/main/java/com/truew8/entity/User.java), [UserPreference](../truew8-api/src/main/java/com/truew8/entity/UserPreference.java) e [UserHolding](../truew8-api/src/main/java/com/truew8/entity/UserHolding.java).

### Frontend

- Estrutura de rotas Expo Router com login, register, dashboard, portfolio e FAQ em [truew8-app/src/app](../truew8-app/src/app).
- Bootstrap de sessao e redirect inteligente no entrypoint em [index.tsx](../truew8-app/src/app/index.tsx).
- Dashboard com criacao de portfolio, lista, lock/unlock e menu de preferencias em [dashboard.tsx](../truew8-app/src/app/dashboard.tsx) e [DashboardHero](../truew8-app/src/components/dashboard/DashboardHero.tsx).
- Tela de portfolio com adicao manual de holdings, edicao, lock/unlock, delete e abertura do fluxo de rebalanceamento em [portfolio/[id].tsx](../truew8-app/src/app/portfolio/%5Bid%5D.tsx) e [CascadingRebalanceFlow](../truew8-app/src/components/rebalance/CascadingRebalanceFlow.tsx).
- Cliente HTTP centralizado e servicos de auth, portfolio, preferencias e rebalance em [truew8-app/src/services](../truew8-app/src/services).
- Persistencia local e segura de sessao e vault no frontend em [authStorage.ts](../truew8-app/src/services/authStorage.ts) e [cryptoService.ts](../truew8-app/src/services/cryptoService.ts).

### Infra e Base de Testes

- Docker Compose com Traefik, PostgreSQL 16 e API em [docker-compose.yml](../docker-compose.yml).
- Suite de testes existente para auth, OCR, rebalance, preferencias, portfolio e rate limit em [truew8-api/src/test/java/com/truew8](../truew8-api/src/test/java/com/truew8).
- E2E Playwright ja presente no repositorio em [truew8-app/tests/e2e](../truew8-app/tests/e2e).

## O Que Esta Parcialmente Implementado

### 1. OCR e Limites Freemium

- O backend ja reduz o saldo de OCR por usuario e bloqueia quando o contador chega a zero.
- Falta alinhar o contrato com a documentacao: a doc pede `402 Payment Required`, mas o backend hoje encerra o caso com outro status em [OcrService](../truew8-api/src/main/java/com/truew8/service/OcrService.java).
- Falta o fluxo completo no frontend para upload de imagem, tratamento do limite e redirecionamento para paywall.

### 2. Rebalanceamento de Carteira

- O motor server-side ja calcula BUY, SELL e HOLD.
- O frontend ja monta um fluxo visual de rebalanceamento com ordens agrupadas por corretora.
- Falta fechar o contrato com a documentacao de forma mais estrita para cenarios como blender de carteiras, consolidacao multiprotfolio e regras adicionais de lots em todos os mercados.

### 3. Infraestrutura de Deploy

- A base de deploy com Traefik, Postgres e variaveis de ambiente existe.
- Falta completar a historia operacional descrita na documentacao para producao real em swarm/KVM com observabilidade, rollout e seguranca operacional mais formalizada.

## O Que Falta Fazer

### P0 - Fechar Fluxos Criticos de Monetizacao e OCR

1. Criar o fluxo de paywall no frontend com rota dedicada e redirecionamento a partir de `402 Payment Required`.
2. Implementar Stripe de ponta a ponta: checkout session, webhook, assinatura ativa/inativa e rotas de suporte no backend.
3. Harmonizar o limite free de OCR com a documentacao: status correto, mensagem padronizada e UX consistente.
4. Criar o fluxo de upload de OCR no frontend e conectar ao backend existente.

### P1 - Completar Funcionalidades Core de Produto

1. Implementar a camada de risk score e insights com Gemini para alem do OCR.
2. Implementar o blender de carteiras com pesos multiplos e consolidacao de targets.
3. Reforcar a validacao de tickers e assets contra a base de dados para reduzir hallucinations do OCR.
4. Fechar a cobertura de regras de mercado global vs. B3 fracionario em todos os caminhos de rebalance.

### P2 - Robustez e Escala

1. Expandir a cobertura de testes unitarios para bordas numericas e regras de negocio.
2. Atualizar E2E para os CUJs da documentacao: sucesso do rebalance, erro de OCR e redirecionamento ao paywall.
3. Melhorar telemetria, logs e tratamento de erros padronizados em toda a stack.
4. Formalizar a operacao de deploy com os requisitos de producao descritos na documentacao.

## Prioridade Recomendada

Se eu fosse organizar a execucao agora, eu faria nesta ordem:

1. Fechar paywall + Stripe + status `402`.
2. Entregar o upload de OCR no frontend e o redirecionamento ao paywall.
3. Ajustar o contrato do OCR para validar tickers e endurecer a resposta do Gemini.
4. Completar os E2E dos fluxos criticos.
5. Evoluir o risk score e o blender de carteiras.

## Verificacao Por Documento

### Constitution / Arquitetura

- Regra de backend com DTOs, services e Flyway: atendida.
- Cookie auth e JWT: atendida.
- Rebalanceamento server-side: atendido.
- Freemium com limite backend e paywall: parcial, falta o `402` e o fluxo de UX.
- Stripe: nao implementado de ponta a ponta.
- Gemini OCR: parcialmente implementado.

### Project Equinox Master

- Onboarding magico com OCR: backend pronto, frontend ausente.
- Dashboard de abas / portfolio view: atendido em boa parte.
- Boleta limpa agrupada por corretora: atendida no fluxo de rebalance.
- Cofre / trava de ativos: atendido.
- Modo acumulador: atendido via `allow_sells = false`.
- Risk thermometer / AI insights: ainda nao entregue.
- Blender de carteiras: ainda nao entregue.

## Observacao Final

O codigo atual nao esta em estado inicial; ele ja entrega varios pilares centrais. O principal trabalho restante nao e criar a base, e sim completar os fluxos de produto que a documentacao usa como diferencial: monetizacao, OCR completo no frontend e inteligencia de risco.