import type { LayerID, StackType } from './types.js';

type StackDefaults = Partial<Record<LayerID, string>>;

const nextjsDefaults: StackDefaults = {
  L1: 'pnpm eslint src/',
  L2: 'pnpm tsc --noEmit',
  L3: 'pnpm vitest run',
  L4: 'pnpm vitest run --project component',
  L5: 'pnpm vitest run --project integration',
  L6: 'pnpm vitest run --project contract',
  L7: 'curl -sf http://localhost:3000/api/health',
  L8: 'pnpm audit --audit-level=high',
  L9: 'pnpm playwright test',
  L10: 'pnpm playwright test --project=visual',
  L11: 'pnpm playwright test --project=chromium --project=firefox --project=webkit',
  L12: 'pnpm playwright test --project=mobile-chrome --project=mobile-safari',
  L13: 'pnpm lighthouse ci',
  L14: 'pnpm axe-core src/',
};

const reactDefaults: StackDefaults = {
  L1: 'pnpm eslint src/',
  L2: 'pnpm tsc --noEmit',
  L3: 'pnpm vitest run',
  L4: 'pnpm vitest run --project component',
  L5: 'pnpm vitest run --project integration',
  L6: 'pnpm vitest run --project contract',
  L7: 'curl -sf http://localhost:3000/health',
  L8: 'pnpm audit --audit-level=high',
  L9: 'pnpm playwright test',
  L10: 'pnpm playwright test --project=visual',
  L11: 'pnpm playwright test --project=chromium --project=firefox --project=webkit',
  L12: 'pnpm playwright test --project=mobile-chrome --project=mobile-safari',
  L13: 'pnpm lighthouse ci',
  L14: 'pnpm axe-core src/',
};

const vueDefaults: StackDefaults = {
  L1: 'pnpm eslint src/',
  L2: 'pnpm vue-tsc --noEmit',
  L3: 'pnpm vitest run',
  L4: 'pnpm vitest run --project component',
  L5: 'pnpm vitest run --project integration',
  L6: 'pnpm vitest run --project contract',
  L7: 'curl -sf http://localhost:5173/health',
  L8: 'pnpm audit --audit-level=high',
  L9: 'pnpm playwright test',
  L10: 'pnpm playwright test --project=visual',
  L11: 'pnpm playwright test --project=chromium --project=firefox --project=webkit',
  L12: 'pnpm playwright test --project=mobile-chrome --project=mobile-safari',
  L13: 'pnpm lighthouse ci',
  L14: 'pnpm axe-core src/',
};

const angularDefaults: StackDefaults = {
  L1: 'pnpm ng lint',
  L2: 'pnpm tsc --noEmit',
  L3: 'pnpm ng test --watch=false',
  L4: 'pnpm ng test --watch=false --include=**/*.component.spec.ts',
  L5: 'pnpm ng test --watch=false --include=**/*.integration.spec.ts',
  L6: 'pnpm ng test --watch=false --include=**/*.contract.spec.ts',
  L7: 'curl -sf http://localhost:4200/health',
  L8: 'pnpm audit --audit-level=high',
  L9: 'pnpm ng e2e',
  L10: 'pnpm ng e2e --project=visual',
  L11: 'pnpm ng e2e --browsers=chrome,firefox',
  L12: 'pnpm ng e2e --config=mobile',
  L13: 'pnpm lighthouse ci',
  L14: 'pnpm axe-core src/',
};

const flutterDefaults: StackDefaults = {
  L1: 'dart analyze --fatal-infos',
  L2: 'dart analyze --fatal-infos',
  L3: 'flutter test',
  L4: 'flutter test --tags=widget',
  L5: 'flutter test --tags=integration',
  L6: 'flutter test --tags=contract',
  L7: 'flutter drive --target=test_driver/smoke.dart',
  L8: 'flutter pub audit',
  L9: 'maestro test .maestro/',
  L10: 'maestro test .maestro/visual/',
  L11: 'flutter test --platform=chrome',
  L12: 'maestro test .maestro/mobile/',
  L13: 'flutter test --tags=performance',
  L14: 'flutter test --tags=accessibility',
};

const pythonDefaults: StackDefaults = {
  L1: 'ruff check .',
  L2: 'mypy .',
  L3: 'pytest tests/unit/',
  L4: 'pytest tests/component/',
  L5: 'pytest tests/integration/',
  L6: 'pytest tests/contract/',
  L7: 'curl -sf http://localhost:8000/health',
  L8: 'pip-audit && bandit -r app/',
  L9: 'pytest tests/e2e/',
  L10: 'pytest tests/visual/',
  L11: 'pytest tests/cross_browser/',
  L12: 'pytest tests/mobile/',
  L13: 'locust -f tests/perf/locustfile.py --headless -u 10 -r 2 --run-time 30s',
  L14: 'pytest tests/accessibility/',
};

const rustDefaults: StackDefaults = {
  L1: 'cargo clippy -- -D warnings',
  L2: 'cargo check',
  L3: 'cargo test --lib',
  L4: 'cargo test --test component',
  L5: 'cargo test --test integration',
  L6: 'cargo test --test contract',
  L7: 'curl -sf http://localhost:8080/health',
  L8: 'cargo audit',
  L9: 'cargo test --test e2e',
  L10: 'cargo test --test visual',
  L11: 'cargo test --test cross_browser',
  L12: 'cargo test --test mobile',
  L13: 'cargo bench',
  L14: 'cargo test --test accessibility',
};

const javaDefaults: StackDefaults = {
  L1: 'mvn checkstyle:check',
  L2: 'mvn compile',
  L3: 'mvn test -Dtest="*UnitTest"',
  L4: 'mvn test -Dtest="*ComponentTest"',
  L5: 'mvn verify -Dtest="*IntegrationTest"',
  L6: 'mvn test -Dtest="*ContractTest"',
  L7: 'curl -sf http://localhost:8080/actuator/health',
  L8: 'mvn dependency-check:check',
  L9: 'mvn verify -Dtest="*E2ETest"',
  L10: 'mvn test -Dtest="*VisualTest"',
  L11: 'mvn test -Dtest="*CrossBrowserTest"',
  L12: 'mvn test -Dtest="*MobileTest"',
  L13: 'mvn gatling:test',
  L14: 'mvn test -Dtest="*AccessibilityTest"',
};

const goDefaults: StackDefaults = {
  L1: 'golangci-lint run',
  L2: 'go vet ./...',
  L3: 'go test ./... -short',
  L4: 'go test ./... -run Component',
  L5: 'go test ./... -run Integration',
  L6: 'go test ./... -run Contract',
  L7: 'curl -sf http://localhost:8080/health',
  L8: 'govulncheck ./...',
  L9: 'go test ./... -run E2E',
  L10: 'go test ./... -run Visual',
  L11: 'go test ./... -run CrossBrowser',
  L12: 'go test ./... -run Mobile',
  L13: 'go test -bench=. ./...',
  L14: 'go test ./... -run Accessibility',
};

const dotnetDefaults: StackDefaults = {
  L1: 'dotnet format --verify-no-changes',
  L2: 'dotnet build --no-restore',
  L3: 'dotnet test --filter "Category=Unit"',
  L4: 'dotnet test --filter "Category=Component"',
  L5: 'dotnet test --filter "Category=Integration"',
  L6: 'dotnet test --filter "Category=Contract"',
  L7: 'curl -sf http://localhost:5000/health',
  L8: 'dotnet list package --vulnerable',
  L9: 'dotnet test --filter "Category=E2E"',
  L10: 'dotnet test --filter "Category=Visual"',
  L11: 'dotnet test --filter "Category=CrossBrowser"',
  L12: 'dotnet test --filter "Category=Mobile"',
  L13: 'dotnet test --filter "Category=Performance"',
  L14: 'dotnet test --filter "Category=Accessibility"',
};

const nodejsDefaults: StackDefaults = {
  L1: 'npx eslint .',
  L2: 'npx tsc --noEmit',
  L3: 'npx vitest run',
  L4: 'npx vitest run --project component',
  L5: 'npx vitest run --project integration',
  L6: 'npx vitest run --project contract',
  L7: 'curl -sf http://localhost:3000/health',
  L8: 'npm audit --audit-level=high',
  L9: 'npx playwright test',
  L10: 'npx playwright test --project=visual',
  L11: 'npx playwright test --project=chromium --project=firefox --project=webkit',
  L12: 'npx playwright test --project=mobile-chrome --project=mobile-safari',
  L13: 'npx autocannon -c 10 -d 10 http://localhost:3000',
  L14: 'npx axe-core .',
};

export const STACK_DEFAULTS: Record<StackType, StackDefaults> = {
  nextjs: nextjsDefaults,
  react: reactDefaults,
  vue: vueDefaults,
  angular: angularDefaults,
  flutter: flutterDefaults,
  python: pythonDefaults,
  rust: rustDefaults,
  java: javaDefaults,
  go: goDefaults,
  dotnet: dotnetDefaults,
  nodejs: nodejsDefaults,
};

export const DEFAULT_LAYER_TIMEOUTS: Partial<Record<LayerID, number>> = {
  L1: 60_000,
  L2: 120_000,
  L3: 300_000,
  L4: 300_000,
  L5: 600_000,
  L6: 300_000,
  L7: 30_000,
  L8: 120_000,
  L9: 900_000,
  L10: 600_000,
  L11: 900_000,
  L12: 900_000,
  L13: 600_000,
  L14: 120_000,
};

export const GLOBAL_DEFAULTS: {
  version: string;
  mode: string;
} = {
  version: '1',
  mode: 'full',
};
