# TrueW8 Project Guidelines

## Architecture
- This workspace is a two-app monorepo:
- Backend: `truew8-api` (Spring Boot 3, Java 17, Maven, Flyway, PostgreSQL).
- Frontend: `truew8-app` (Expo Router, React Native Web, TypeScript, Playwright).
- Keep boundaries strict:
- Backend controllers in `truew8-api/src/main/java/com/truew8/controller` should delegate business logic to services in `truew8-api/src/main/java/com/truew8/service`.
- DTOs in `truew8-api/src/main/java/com/truew8/dto` define API contracts; do not leak entities directly in API responses.
- Frontend route screens live in `truew8-app/src/app`; reusable UI lives in `truew8-app/src/components`; API access stays in `truew8-app/src/services`.

## Build and Test
- Backend (`truew8-api`):
- `mvn clean install`
- `mvn test`
- `mvn spring-boot:run`
- Frontend (`truew8-app`):
- `yarn web`
- `yarn build`
- `yarn type-check`
- `yarn test:e2e`
- Full stack infra (repo root):
- `docker compose up -d`

## Conventions
- Use Flyway migrations in `truew8-api/src/main/resources/db/migration` for schema changes; do not rely on JPA auto-DDL.
- Security filter ordering in backend must be anchored against Spring Security core filters (for example `UsernamePasswordAuthenticationFilter`) to avoid test context breakage.
- Frontend uses Expo Router typed routes; route type generation can lag after adding files. Avoid broad refactors that depend on immediate route type refresh.
- This repo uses Yarn Berry (`yarn@4.x`). Prefer plain `yarn <script>` commands.
- When running shell commands on Expo route paths containing parentheses (example: `src/app/(tabs)/...`), quote or escape the path.

## Testing Notes
- Prefer targeted backend tests under `truew8-api/src/test/java/com/truew8` before broad suites.
- Playwright tests should prefer stable `getByTestId` selectors and keyboard activation where RN Web overlays cause flaky pointer clicks.
- For authenticated frontend/e2e flows, session bootstrap relies on `truew8.session`; E2E vault scenarios also require seeding user vault keys.

## Key References
- Governance and scope: `constitution.md`
- Project context: `docs/PROJECT_EQUINOX_MASTER.md`
- E2EE validation plan: `docs/E2EE_VAULT_TEST_PLAN.md`
