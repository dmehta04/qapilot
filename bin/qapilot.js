#!/usr/bin/env node
#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/config/types.ts
var LAYER_IDS, LAYER_NAMES, STACK_TYPES, PIPELINE_MODES;
var init_types = __esm({
  "src/config/types.ts"() {
    "use strict";
    LAYER_IDS = [
      "L1",
      "L2",
      "L3",
      "L4",
      "L5",
      "L6",
      "L7",
      "L8",
      "L9",
      "L10",
      "L11",
      "L12",
      "L13",
      "L14",
      "L15",
      "L16"
    ];
    LAYER_NAMES = {
      L1: "lint",
      L2: "types",
      L3: "unit",
      L4: "component",
      L5: "integration",
      L6: "contract",
      L7: "smoke",
      L8: "security",
      L9: "e2e",
      L10: "visual",
      L11: "cross-browser",
      L12: "mobile",
      L13: "performance",
      L14: "accessibility",
      L15: "chaos",
      L16: "custom"
    };
    STACK_TYPES = [
      "nextjs",
      "react",
      "vue",
      "angular",
      "flutter",
      "python",
      "rust",
      "java",
      "go",
      "dotnet"
    ];
    PIPELINE_MODES = ["fast", "full", "pre-release"];
  }
});

// src/config/schema.ts
var import_zod, layerIdSchema, layerConfigSchema, aiConfigSchema, notificationConfigSchema, buildConfigSchema, reportConfigSchema, layersConfigSchema, qaPilotConfigSchema;
var init_schema = __esm({
  "src/config/schema.ts"() {
    "use strict";
    import_zod = require("zod");
    init_types();
    layerIdSchema = import_zod.z.enum(LAYER_IDS);
    layerConfigSchema = import_zod.z.object({
      enabled: import_zod.z.boolean().optional(),
      command: import_zod.z.string().optional(),
      timeout: import_zod.z.number().positive().optional(),
      warnOnly: import_zod.z.boolean().optional(),
      reason: import_zod.z.string().optional(),
      threshold: import_zod.z.record(import_zod.z.string(), import_zod.z.number()).optional(),
      endpoints: import_zod.z.array(import_zod.z.string()).optional(),
      baseUrl: import_zod.z.string().url().optional()
    });
    aiConfigSchema = import_zod.z.object({
      enabled: import_zod.z.boolean().optional(),
      model: import_zod.z.string().optional(),
      apiKey: import_zod.z.string().optional(),
      provider: import_zod.z.enum(["anthropic", "openai"]).optional(),
      maxTokens: import_zod.z.number().positive().optional(),
      temperature: import_zod.z.number().min(0).max(2).optional()
    });
    notificationConfigSchema = import_zod.z.object({
      slack: import_zod.z.object({
        enabled: import_zod.z.boolean().optional(),
        channel: import_zod.z.string().optional(),
        webhookUrl: import_zod.z.string().url().optional()
      }).optional(),
      github: import_zod.z.object({
        enabled: import_zod.z.boolean().optional(),
        commentOnPr: import_zod.z.boolean().optional(),
        statusCheck: import_zod.z.boolean().optional()
      }).optional()
    });
    buildConfigSchema = import_zod.z.object({
      command: import_zod.z.string().optional(),
      preBuild: import_zod.z.string().optional(),
      postBuild: import_zod.z.string().optional(),
      env: import_zod.z.record(import_zod.z.string(), import_zod.z.string()).optional()
    });
    reportConfigSchema = import_zod.z.object({
      format: import_zod.z.enum(["html", "json", "markdown"]).optional(),
      outputDir: import_zod.z.string().optional(),
      upload: import_zod.z.object({
        enabled: import_zod.z.boolean().optional(),
        bucket: import_zod.z.string().optional(),
        prefix: import_zod.z.string().optional()
      }).optional()
    });
    layersConfigSchema = import_zod.z.object({
      skip: import_zod.z.array(layerIdSchema).optional(),
      warnOnly: import_zod.z.array(layerIdSchema).optional(),
      overrides: import_zod.z.record(layerIdSchema, layerConfigSchema).optional()
    });
    qaPilotConfigSchema = import_zod.z.object({
      version: import_zod.z.string(),
      stack: import_zod.z.enum(STACK_TYPES).optional(),
      mode: import_zod.z.enum(PIPELINE_MODES).optional(),
      layers: layersConfigSchema.optional(),
      ai: aiConfigSchema.optional(),
      build: buildConfigSchema.optional(),
      notifications: notificationConfigSchema.optional(),
      reports: reportConfigSchema.optional()
    });
  }
});

// src/config/defaults.ts
var nextjsDefaults, reactDefaults, vueDefaults, angularDefaults, flutterDefaults, pythonDefaults, rustDefaults, javaDefaults, goDefaults, dotnetDefaults, STACK_DEFAULTS, DEFAULT_LAYER_TIMEOUTS, GLOBAL_DEFAULTS;
var init_defaults = __esm({
  "src/config/defaults.ts"() {
    "use strict";
    nextjsDefaults = {
      L1: "pnpm eslint src/",
      L2: "pnpm tsc --noEmit",
      L3: "pnpm vitest run",
      L4: "pnpm vitest run --project component",
      L5: "pnpm vitest run --project integration",
      L6: "pnpm vitest run --project contract",
      L7: "curl -sf http://localhost:3000/api/health",
      L8: "pnpm audit --audit-level=high",
      L9: "pnpm playwright test",
      L10: "pnpm playwright test --project=visual",
      L11: "pnpm playwright test --project=chromium --project=firefox --project=webkit",
      L12: "pnpm playwright test --project=mobile-chrome --project=mobile-safari",
      L13: "pnpm lighthouse ci",
      L14: "pnpm axe-core src/"
    };
    reactDefaults = {
      L1: "pnpm eslint src/",
      L2: "pnpm tsc --noEmit",
      L3: "pnpm vitest run",
      L4: "pnpm vitest run --project component",
      L5: "pnpm vitest run --project integration",
      L6: "pnpm vitest run --project contract",
      L7: "curl -sf http://localhost:3000/health",
      L8: "pnpm audit --audit-level=high",
      L9: "pnpm playwright test",
      L10: "pnpm playwright test --project=visual",
      L11: "pnpm playwright test --project=chromium --project=firefox --project=webkit",
      L12: "pnpm playwright test --project=mobile-chrome --project=mobile-safari",
      L13: "pnpm lighthouse ci",
      L14: "pnpm axe-core src/"
    };
    vueDefaults = {
      L1: "pnpm eslint src/",
      L2: "pnpm vue-tsc --noEmit",
      L3: "pnpm vitest run",
      L4: "pnpm vitest run --project component",
      L5: "pnpm vitest run --project integration",
      L6: "pnpm vitest run --project contract",
      L7: "curl -sf http://localhost:5173/health",
      L8: "pnpm audit --audit-level=high",
      L9: "pnpm playwright test",
      L10: "pnpm playwright test --project=visual",
      L11: "pnpm playwright test --project=chromium --project=firefox --project=webkit",
      L12: "pnpm playwright test --project=mobile-chrome --project=mobile-safari",
      L13: "pnpm lighthouse ci",
      L14: "pnpm axe-core src/"
    };
    angularDefaults = {
      L1: "pnpm ng lint",
      L2: "pnpm tsc --noEmit",
      L3: "pnpm ng test --watch=false",
      L4: "pnpm ng test --watch=false --include=**/*.component.spec.ts",
      L5: "pnpm ng test --watch=false --include=**/*.integration.spec.ts",
      L6: "pnpm ng test --watch=false --include=**/*.contract.spec.ts",
      L7: "curl -sf http://localhost:4200/health",
      L8: "pnpm audit --audit-level=high",
      L9: "pnpm ng e2e",
      L10: "pnpm ng e2e --project=visual",
      L11: "pnpm ng e2e --browsers=chrome,firefox",
      L12: "pnpm ng e2e --config=mobile",
      L13: "pnpm lighthouse ci",
      L14: "pnpm axe-core src/"
    };
    flutterDefaults = {
      L1: "dart analyze --fatal-infos",
      L2: "dart analyze --fatal-infos",
      L3: "flutter test",
      L4: "flutter test --tags=widget",
      L5: "flutter test --tags=integration",
      L6: "flutter test --tags=contract",
      L7: "flutter drive --target=test_driver/smoke.dart",
      L8: "flutter pub audit",
      L9: "maestro test .maestro/",
      L10: "maestro test .maestro/visual/",
      L11: "flutter test --platform=chrome",
      L12: "maestro test .maestro/mobile/",
      L13: "flutter test --tags=performance",
      L14: "flutter test --tags=accessibility"
    };
    pythonDefaults = {
      L1: "ruff check .",
      L2: "mypy .",
      L3: "pytest tests/unit/",
      L4: "pytest tests/component/",
      L5: "pytest tests/integration/",
      L6: "pytest tests/contract/",
      L7: "curl -sf http://localhost:8000/health",
      L8: "pip-audit && bandit -r app/",
      L9: "pytest tests/e2e/",
      L10: "pytest tests/visual/",
      L11: "pytest tests/cross_browser/",
      L12: "pytest tests/mobile/",
      L13: "locust -f tests/perf/locustfile.py --headless -u 10 -r 2 --run-time 30s",
      L14: "pytest tests/accessibility/"
    };
    rustDefaults = {
      L1: "cargo clippy -- -D warnings",
      L2: "cargo check",
      L3: "cargo test --lib",
      L4: "cargo test --test component",
      L5: "cargo test --test integration",
      L6: "cargo test --test contract",
      L7: "curl -sf http://localhost:8080/health",
      L8: "cargo audit",
      L9: "cargo test --test e2e",
      L10: "cargo test --test visual",
      L11: "cargo test --test cross_browser",
      L12: "cargo test --test mobile",
      L13: "cargo bench",
      L14: "cargo test --test accessibility"
    };
    javaDefaults = {
      L1: "mvn checkstyle:check",
      L2: "mvn compile",
      L3: 'mvn test -Dtest="*UnitTest"',
      L4: 'mvn test -Dtest="*ComponentTest"',
      L5: 'mvn verify -Dtest="*IntegrationTest"',
      L6: 'mvn test -Dtest="*ContractTest"',
      L7: "curl -sf http://localhost:8080/actuator/health",
      L8: "mvn dependency-check:check",
      L9: 'mvn verify -Dtest="*E2ETest"',
      L10: 'mvn test -Dtest="*VisualTest"',
      L11: 'mvn test -Dtest="*CrossBrowserTest"',
      L12: 'mvn test -Dtest="*MobileTest"',
      L13: "mvn gatling:test",
      L14: 'mvn test -Dtest="*AccessibilityTest"'
    };
    goDefaults = {
      L1: "golangci-lint run",
      L2: "go vet ./...",
      L3: "go test ./... -short",
      L4: "go test ./... -run Component",
      L5: "go test ./... -run Integration",
      L6: "go test ./... -run Contract",
      L7: "curl -sf http://localhost:8080/health",
      L8: "govulncheck ./...",
      L9: "go test ./... -run E2E",
      L10: "go test ./... -run Visual",
      L11: "go test ./... -run CrossBrowser",
      L12: "go test ./... -run Mobile",
      L13: "go test -bench=. ./...",
      L14: "go test ./... -run Accessibility"
    };
    dotnetDefaults = {
      L1: "dotnet format --verify-no-changes",
      L2: "dotnet build --no-restore",
      L3: 'dotnet test --filter "Category=Unit"',
      L4: 'dotnet test --filter "Category=Component"',
      L5: 'dotnet test --filter "Category=Integration"',
      L6: 'dotnet test --filter "Category=Contract"',
      L7: "curl -sf http://localhost:5000/health",
      L8: "dotnet list package --vulnerable",
      L9: 'dotnet test --filter "Category=E2E"',
      L10: 'dotnet test --filter "Category=Visual"',
      L11: 'dotnet test --filter "Category=CrossBrowser"',
      L12: 'dotnet test --filter "Category=Mobile"',
      L13: 'dotnet test --filter "Category=Performance"',
      L14: 'dotnet test --filter "Category=Accessibility"'
    };
    STACK_DEFAULTS = {
      nextjs: nextjsDefaults,
      react: reactDefaults,
      vue: vueDefaults,
      angular: angularDefaults,
      flutter: flutterDefaults,
      python: pythonDefaults,
      rust: rustDefaults,
      java: javaDefaults,
      go: goDefaults,
      dotnet: dotnetDefaults
    };
    DEFAULT_LAYER_TIMEOUTS = {
      L1: 6e4,
      L2: 12e4,
      L3: 3e5,
      L4: 3e5,
      L5: 6e5,
      L6: 3e5,
      L7: 3e4,
      L8: 12e4,
      L9: 9e5,
      L10: 6e5,
      L11: 9e5,
      L12: 9e5,
      L13: 6e5,
      L14: 12e4
    };
    GLOBAL_DEFAULTS = {
      version: "1",
      mode: "full"
    };
  }
});

// src/config/loader.ts
function findUp(filename, startDir) {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;
  while (true) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate)) return candidate;
    if (dir === root) return null;
    dir = path.dirname(dir);
  }
}
function resolveEnvVars(value) {
  if (typeof value === "string") {
    return value.replace(/\$\{(\w+)\}/g, (_, varName) => process.env[varName] ?? "");
  }
  if (Array.isArray(value)) {
    return value.map(resolveEnvVars);
  }
  if (value !== null && typeof value === "object") {
    const resolved = {};
    for (const [k, v] of Object.entries(value)) {
      resolved[k] = resolveEnvVars(v);
    }
    return resolved;
  }
  return value;
}
function detectStackFromFiles(cwd) {
  const exists = (file) => fs.existsSync(path.join(cwd, file));
  if (exists("next.config.js") || exists("next.config.mjs") || exists("next.config.ts"))
    return "nextjs";
  if (exists("angular.json")) return "angular";
  if (exists("nuxt.config.ts") || exists("vue.config.js")) return "vue";
  if (exists("pubspec.yaml")) return "flutter";
  if (exists("Cargo.toml")) return "rust";
  if (exists("go.mod")) return "go";
  if (exists("pom.xml") || exists("build.gradle") || exists("build.gradle.kts")) return "java";
  if (exists("pyproject.toml") || exists("setup.py") || exists("requirements.txt")) return "python";
  if (exists("package.json")) return "react";
  return void 0;
}
function buildStackLayerDefaults(stack) {
  const stackDefaults = STACK_DEFAULTS[stack];
  const overrides = {};
  for (const layerId of LAYER_IDS) {
    const command = stackDefaults[layerId];
    if (command) {
      overrides[layerId] = { command, enabled: true };
    }
  }
  return { overrides };
}
function deepMerge(base, override) {
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === void 0) continue;
    const baseValue = result[key];
    if (baseValue !== null && value !== null && typeof baseValue === "object" && typeof value === "object" && !Array.isArray(baseValue) && !Array.isArray(value)) {
      result[key] = deepMerge(
        baseValue,
        value
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}
function mergeLayerIds(base, override) {
  if (!base && !override) return void 0;
  const merged = /* @__PURE__ */ new Set([...base ?? [], ...override ?? []]);
  return merged.size > 0 ? [...merged] : void 0;
}
function mergeLayers(base, override) {
  if (!base && !override) return void 0;
  if (!base) return override;
  if (!override) return base;
  return {
    skip: mergeLayerIds(base.skip, override.skip),
    warnOnly: mergeLayerIds(base.warnOnly, override.warnOnly),
    overrides: deepMerge(
      base.overrides ?? {},
      override.overrides ?? {}
    )
  };
}
function loadConfig(cwd, overrides) {
  const configPath = findUp(".qapilot.yml", cwd) ?? findUp(".qapilot.yaml", cwd);
  let fileConfig = {};
  if (configPath) {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = yaml.load(raw);
    const resolved = resolveEnvVars(parsed);
    fileConfig = qaPilotConfigSchema.parse(resolved);
  }
  const resolvedStack = overrides?.stack ?? fileConfig.stack ?? detectStackFromFiles(cwd);
  let config = {
    version: GLOBAL_DEFAULTS.version,
    mode: "full"
  };
  if (resolvedStack) {
    config.stack = resolvedStack;
    config.layers = buildStackLayerDefaults(resolvedStack);
  }
  const { layers: fileLayers, ...fileRest } = fileConfig;
  config = { ...config, ...fileRest };
  config.layers = mergeLayers(config.layers, fileLayers);
  if (overrides) {
    const { layers: overrideLayers, ...overrideRest } = overrides;
    config = { ...config, ...overrideRest };
    config.layers = mergeLayers(config.layers, overrideLayers);
  }
  return config;
}
var fs, path, yaml;
var init_loader = __esm({
  "src/config/loader.ts"() {
    "use strict";
    fs = __toESM(require("node:fs"), 1);
    path = __toESM(require("node:path"), 1);
    yaml = __toESM(require("js-yaml"), 1);
    init_schema();
    init_defaults();
    init_types();
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  DEFAULT_LAYER_TIMEOUTS: () => DEFAULT_LAYER_TIMEOUTS,
  GLOBAL_DEFAULTS: () => GLOBAL_DEFAULTS,
  LAYER_IDS: () => LAYER_IDS,
  LAYER_NAMES: () => LAYER_NAMES,
  PIPELINE_MODES: () => PIPELINE_MODES,
  STACK_DEFAULTS: () => STACK_DEFAULTS,
  STACK_TYPES: () => STACK_TYPES,
  generate: () => generate,
  init: () => init,
  loadConfig: () => loadConfig,
  qaPilotConfigSchema: () => qaPilotConfigSchema,
  scan: () => scan
});
async function scan(cwd) {
  const config = loadConfig(cwd);
  console.log(`Scanning ${cwd} with stack: ${config.stack ?? "auto"}, mode: ${config.mode}`);
}
async function init(cwd) {
  const config = loadConfig(cwd);
  console.log(`Initializing .qapilot.yml for stack: ${config.stack ?? "unknown"}`);
}
async function generate(cwd) {
  const config = loadConfig(cwd);
  console.log(`Generating tests for stack: ${config.stack ?? "unknown"}`);
}
var init_src = __esm({
  "src/index.ts"() {
    "use strict";
    init_loader();
    init_schema();
    init_defaults();
    init_types();
  }
});

// src/cli/index.ts
var import_commander = require("commander");
var program = new import_commander.Command();
program.name("qapilot").description("AI-powered multi-layer QA pipeline").version("0.1.0");
program.command("scan").description("Run QA pipeline on the current project").option("-m, --mode <mode>", "Pipeline mode: fast | full | pre-release", "full").option("-s, --stack <stack>", "Override detected stack").option("--skip <layers>", "Comma-separated layer IDs to skip").option("--only <layers>", "Run only these layer IDs").option("-v, --verbose", "Verbose output").option("-q, --quiet", "Minimal output").action(async (_options) => {
  const { scan: scan2 } = await Promise.resolve().then(() => (init_src(), src_exports));
  await scan2(process.cwd());
});
program.command("init").description("Generate .qapilot.yml config for the current project").option("-s, --stack <stack>", "Override detected stack").option("--force", "Overwrite existing config").action(async (_options) => {
  const { init: init2 } = await Promise.resolve().then(() => (init_src(), src_exports));
  await init2(process.cwd());
});
program.command("generate").description("AI-generate missing tests for the project").option("-l, --layer <layer>", "Generate tests for a specific layer").option("--dry-run", "Preview without writing files").action(async (_options) => {
  const { generate: generate2 } = await Promise.resolve().then(() => (init_src(), src_exports));
  await generate2(process.cwd());
});
function run(argv) {
  program.parse(argv);
}

// bin/qapilot.ts
run(process.argv);
