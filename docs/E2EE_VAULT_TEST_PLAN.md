# Roteiro de Testes - E2EE / Vault / Zero-Knowledge

## 1. Objetivo
Validar de ponta a ponta a implementacao de cofre local (PIN/biometria), criptografia client-side e persistencia zero-knowledge no backend.

## 2. Escopo
- Frontend (Expo Web/Mobile): VaultGuard, cryptoService, portfolio service, dashboard/portfolio UX.
- Backend (Spring): API de portfolio/holdings/rebalance sob modelo ciphertext-only.
- Banco: colunas sensiveis em TEXT e sem dependencia semantica server-side para dados cifrados.

## 3. Matriz de Cenarios

### 3.1 Cofre e Sessao
1. Usuario autenticado sem cofre deve ver tela de criacao de PIN.
2. Aviso explicito de privacidade e irreversibilidade deve aparecer.
3. PIN invalido (nao numerico/menos de 6) deve falhar.
4. Confirmacao de PIN divergente deve falhar.
5. PIN correto deve desbloquear acesso ao dashboard.
6. Logout deve limpar chave volatil em memoria.

### 3.2 Persistencia (Lembrar PIN)
1. Com "Lembrar" ativado, chave derivada deve ser persistida.
2. Em mobile com suporte, persistencia deve usar requisito de autenticacao do dispositivo.
3. Com "Lembrar" desativado, nenhuma chave deve permanecer em armazenamento persistente.
4. Em nova sessao com "Lembrar" desativado, usuario deve ser obrigado a informar PIN.

### 3.3 Biometria
1. Opcao de biometria so deve ser habilitavel quando "Lembrar" estiver ativo e device suportar.
2. App deve tentar desbloqueio biometrico automatico quando configurado.
3. Falha/cancelamento biometrico deve cair em fallback imediato para PIN.

### 3.4 E2EE Holdings
1. POST de holding deve enviar `ticker`, `brokerage`, `quantity`, `averagePrice` cifrados (`v1:*`).
2. GET de holdings deve ser decriptado no frontend antes de renderizar UI.
3. Valor fora do formato cifrado para campo sensivel deve ser tratado como erro.

### 3.5 Zero-Knowledge Backend
1. Backend deve aceitar e persistir ciphertext como string opaca.
2. Backend nao deve calcular valor investido com base em campos sensiveis cifrados.
3. Rebalance endpoint deve operar com holdings enviados pelo cliente.
4. Rebalance service deve ser resiliente a valores ciphertext-like em holdings persistidos.

### 3.6 Responsabilidade no Frontend
1. Dashboard deve calcular `holdingsCount` e `totalInvested` no cliente a partir de holdings decriptados.
2. Em falha de fetch/decrypt de holdings, app deve manter fallback seguro sem quebrar tela.

## 4. Matriz de Rastreabilidade Automatizada

### Frontend E2E (Playwright)
| Cenario | Teste automatizado |
| --- | --- |
| Cofre bloqueia sessao sem PIN e desbloqueia apos criacao valida | `truew8-app/tests/e2e/vault.spec.ts` -> `shows vault creation barrier and unlocks app after valid PIN creation` |
| Persistencia desligada nao grava chave local | `truew8-app/tests/e2e/vault.spec.ts` -> `does not persist vault key when remember toggle is disabled` |
| Persistencia ligada grava chave e fingerprint | `truew8-app/tests/e2e/vault.spec.ts` -> `persists vault key when remember toggle is enabled` |
| Logout pelo header retorna para login | `truew8-app/tests/e2e/portfolio.spec.ts` -> `moves logout to dashboard top bar and logs out` |
| Criacao de carteira via drawer lateral | `truew8-app/tests/e2e/portfolio.spec.ts` -> `creates a new portfolio via right drawer without closing on input focus` |
| Inclusao manual de holding via drawer lateral | `truew8-app/tests/e2e/portfolio.spec.ts` -> `adds manual holding using right drawer flow` |
| Fluxo de rebalance em cascata no desktop/mobile | `truew8-app/tests/e2e/rebalance.spec.ts` -> `keeps cascading flow stable across desktop and mobile directions` |

### Backend Unit/Service
| Cenario | Teste automatizado |
| --- | --- |
| Persistencia zero-knowledge com ciphertext opaco | `truew8-api/src/test/java/com/truew8/controller/PortfolioControllerZeroKnowledgeTest.java` |
| Normalizacao de payload de rebalance com holdings ausentes/nulos | `truew8-api/src/test/java/com/truew8/controller/RebalanceControllerTest.java` |
| Resiliencia do motor de rebalance para valores ciphertext-like | `truew8-api/src/test/java/com/truew8/service/RebalanceEngineServiceTest.java` |

## 5. Criterios de Aceitacao
- 100% dos testes automatizados existentes e novos verdes.
- Sem erros de type-check.
- Fluxos criticos de cofre e holdings cifrados validados manualmente em web + ao menos um device real mobile.
