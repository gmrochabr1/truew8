# TrueW8 Architecture Constitution

**Codename**: Project Equinox | **Version**: 1.0 | **Philosophy**: _"Build for scale, launch for validation. Keep it simple."_

---

## 🛑 CODE REVIEW BLOCKERS

### Frontend (React/Expo - reject PR if violated)

| ❌ DON'T | ✅ DO |
|----------|-------|
| `import from '../../'` | `import from '@/'` (Use path aliases) |
| `axios.get('http://localhost...')` | `apiClient.get('/endpoint')` (Use centralized Axios instance) |
| Hardcoded colors/spacing | Use theme constants (e.g., `theme.colors.primary`) |
| `<window.alert>` or `Alert.alert` | Use `<Snackbar>` or custom `<Toast>` component |
| Mobile-only libraries without web fallback | Verify `Platform.OS === 'web'` compatibility |
| Complex local state for global data | Use Zustand or Context API for global state |
| Expose Stripe Secret Key | ONLY expose `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (or Expo equivalent) |

### Backend (Spring Boot/Java - reject PR if violated)

| ❌ DON'T | ✅ DO |
|----------|-------|
| Return `Entity` to the controller | Return `ResponseDTO` |
| Business logic in `@RestController` | Business logic in `@Service` |
| `@GetMapping` without Auth (unless public) | Use `@PreAuthorize` or standard Spring Security config |
| Hardcode Stripe/Gemini API Keys | Use `${STRIPE_SECRET_KEY}` in `application.yml` |
| JPA auto-ddl (`update` or `create`) | MUST use **Flyway** (`V1__...sql`) for all schema changes |
| Trust client calculation | Re-calculate rebalancing math on the server |

---

## 📁 PROJECT STRUCTURE

### Frontend (`truew8-app/`) - Expo / React Native
```text
src/
  app/                    # Expo Router pages (e.g., /dashboard, /rebalance)
  components/
    common/               # Buttons, Inputs, Cards, Modals
    portfolio/            # Feature-specific (RebalanceCard, AssetList)
  services/               # API calls (api.ts, gemini.service.ts, stripe.service.ts)
  store/                  # Zustand or Context for state management
  theme/                  # Colors, typography, spacing
  utils/                  # Formatters (currency, percentages), math helpers
```

### Backend (`truew8-api/`) - Spring Boot 3.x
```text
src/main/java/com/truew8/
  controller/             # REST endpoints (Auth, Portfolio, StripeWebhooks)
  service/                # Business logic (RebalancingEngine, GeminiVisionService)
  repository/             # Spring Data JPA
  entity/                 # JPA Entities (User, ModelPortfolio, UserHoldings)
  dto/                    # Request/Response DTOs
  config/                 # Security, CORS, Stripe Config
  exception/              # GlobalExceptionHandler
src/main/resources/
  db/migration/           # Flyway SQL scripts
```

---

## 🎯 ESSENTIAL ARCHITECTURE PATTERNS

### 1. The Rebalancing Engine (Backend Core)
The math must be isolated and pure. The backend is the single source of truth for calculations to avoid frontend discrepancies.
- **Input**: User's current holdings + Target Model Portfolio + New Deposit Amount.
- **Output**: DTO containing a list of `Action` (BUY, SELL, HOLD), `AssetTicker`, `Quantity` (handling Fractional vs Standard lots), and `EstimatedValue`.

### 2. Freemium & Limits Strategy
Enforce usage limits strictly at the **Backend level**.
- Free users have a limit of **2 successful OCR/Rebalance operations**.
- The `UserService` must check the `operation_count` and `plan_type` (FREE vs PRO) before calling the Gemini API.
- If the limit is reached, return a `402 Payment Required` to trigger the Paywall UI on the frontend.

### 3. Stripe Integration Pattern
- **Checkout**: Frontend calls backend -> Backend creates Stripe Checkout Session -> Frontend redirects user.
- **Webhooks**: Subscription status updates MUST be handled asynchronously via Stripe Webhooks (e.g., `checkout.session.completed`, `customer.subscription.deleted`).
- **Security**: Always verify the Stripe webhook signature using the endpoint secret.

### 4. Gemini Vision OCR Pattern
- **Flow**: Frontend converts image to Base64 (or uploads to S3/tmp) -> Sends to Backend -> Backend calls Gemini API.
- **Prompt Engineering**: The backend must enforce a strict JSON output format from Gemini (e.g., `[{ "ticker": "VALE3", "percentage": 0.10 }]`).
- **Resilience**: Handle Gemini API timeouts and hallucinated tickers (cross-reference output with the `assets` table in the DB).

---

## 🔐 SECURITY & INFRASTRUCTURE

### Deployment (Docker Swarm on KVM4)
- **Proxy**: Use `Traefik` as the entry point to automatically manage Let's Encrypt SSL certificates and route traffic to the backend/frontend.
- **Stateless API**: The Spring Boot container must be stateless to allow Swarm to scale replicas easily.
- **Database**: Run PostgreSQL 16 on a fixed Swarm node using a named volume (`/var/lib/postgresql/data`) to guarantee data persistence.

### JWT & Authentication
- Since it's a B2C PLG tool, keep sign-ups frictionless.
- Passwords must be hashed using `BCrypt`.
- Use stateless JWT tokens. Store the token securely on the frontend (SecureStore for mobile, HttpOnly Cookie or memory for Web).

---

## 🛠️ ERROR HANDLING

Standardized API responses for errors. The frontend must map these to user-friendly Snackbars/Toasts.

```json
{
  "timestamp": "2026-03-15T10:30:00",
  "status": 400,
  "errorCode": "OCR_EXTRACTION_FAILED",
  "message": "We couldn't read the image clearly. Please upload a sharper screenshot.",
  "path": "/api/v1/portfolios/extract"
}
```

### Common Error Codes
- `LIMIT_REACHED` -> Triggers Paywall.
- `INVALID_TICKER` -> Asset not found in B3/Database.
- `STRIPE_WEBHOOK_ERROR` -> Internal alert for billing.

---

## 🧪 TESTING STRATEGY (Definition of Done)

A nossa filosofia é: **"Confiança na Matemática, Resiliência na Conversão."** Nenhuma *Pull Request* (PR) deve ser aprovada sem que a pirâmide de testes seja respeitada.

### 1. Backend: Testes Unitários (Spring Boot + JUnit 5 + Mockito)
O motor de cálculo não pode falhar. O backend deve garantir a integridade matemática de forma isolada e rápida.

| ❌ DON'T | ✅ DO |
|----------|-------|
| Chamar a API real do Gemini ou da Stripe. | Usar `@MockBean` para isolar o `GeminiVisionService` e a integração de pagamentos. |
| Testar apenas o "Caminho Feliz". | Testar limites (arredondamentos, divisão zero, dízimas e margens de tolerância). |
| Fazer *assert* a propriedades de infraestrutura. | Fazer *assert* estrito à matemática do `ResponseDTO` na `RebalancingEngine`. |
| Assumir que o lote padrão é universal. | Criar casos de teste específicos separando múltiplos de 100 e Mercado Fracionário. |

**Cobertura de Testes Obrigatória (Backend):**
- `RebalancingEngine`: Deve possuir 100% de cobertura nos métodos de divisão de lotes e cálculo de alvo vs. custódia.
- `UserService`: Validação rigorosa do incremento do contador `ocr_operations_count` e bloqueio de utilizadores `FREE` que atinjam o limite.

### 2. Frontend & E2E: Playwright (Expo Web)
Os testes End-to-End (E2E) devem validar as **Jornadas Críticas do Utilizador (CUJs)**. O Playwright irá testar a versão Web da aplicação simulando um utilizador real no browser.

| ❌ DON'T | ✅ DO |
|----------|-------|
| Usar `page.waitForTimeout()` (esperas fixas/rígidas). | Usar asserções com *auto-wait* do Playwright (ex: `expect(locator).toBeVisible()`). |
| Selecionar elementos por tags HTML ou estilos. | Usar atributos de teste dedicados (ex: mapear `testID` no React Native para `data-testid`). |
| Testar permutações matemáticas no E2E. | Deixar a matemática para o JUnit. O E2E valida apenas se o ecrã reage corretamente aos *outputs* da API. |

**Cenários E2E Obrigatórios (CUJs):**
1. **O Fluxo de Valor (Sucesso):** Preencher ativos -> Submeter -> Validar se a "Boleta Inteligente" é renderizada no ecrã com as colunas corretas (Ação, Ticker, Quantidade).
2. **Resiliência do OCR (Mocking de Rede):** Intercetar a chamada (`page.route`) para `/api/v1/ocr/extract` -> Forçar um erro 500 (simulando falha do Gemini/imagem ilegível) -> Validar se a aplicação exibe o `Snackbar` de erro de forma elegante.
3. **A Conversão (Paywall):** Intercetar a API para devolver o código `402 Payment Required` após o clique no botão de Upload -> Validar se o *router* do Expo redireciona imediatamente o utilizador para o ecrã de subscrição (`/paywall`).