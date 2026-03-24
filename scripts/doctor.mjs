import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const results = { pass: 0, warn: 0, fail: 0 };

function p(filePath) { return path.join(rootDir, filePath); }

async function exists(filePath) {
  try { await access(p(filePath)); return true; } catch { return false; }
}

async function readText(filePath) {
  try { return await readFile(p(filePath), "utf8"); } catch { return null; }
}

function ok(label, detail) {
  results.pass++;
  console.log(`  \x1b[32m✅\x1b[0m ${label.padEnd(38, ".")} ${detail || "OK"}`);
}

function warn(label, detail) {
  results.warn++;
  console.log(`  \x1b[33m⚠️\x1b[0m  ${label.padEnd(38, ".")} ${detail}`);
}

function fail(label, detail) {
  results.fail++;
  console.log(`  \x1b[31m❌\x1b[0m ${label.padEnd(38, ".")} ${detail}`);
}

// ── A) Required files ──────────────────────────────────
async function checkRequiredFiles() {
  const requiredFiles = [
    "config/version.json",
    "config/environments/prod.json",
    "capacitor.config.json",
    "package.json",
    "src/index.html",
    "src/scripts/app.js",
    "src/scripts/auth-engine.js",
    "src/scripts/auth-session.js",
    "src/scripts/offline-db.js",
    "src/scripts/data-loader.js",
    "src/scripts/sync-engine.js",
    "src/scripts/network-status.js",
    "src/scripts/camera-handler.js",
    "src/scripts/geo-handler.js",
    "src/scripts/bootstrap-state.js",
    "src/scripts/runtime-config.js",
    "src/scripts/app-config.js",
    "src/styles/app.css",
    "src/vendor/supabase-js.min.js",
    "src/legal/politica-privacidade.html",
    "src/legal/termos-de-uso.html",
    "logo.svg",
    "logo-1024.png",
    "manifest.json",
    "sw.js",
    "android/app/build.gradle",
    "android/keystore.properties.example",
    "ios/App/App.xcodeproj/project.pbxproj",
    "ios/App/App/Info.plist",
    "store/metadata.json",
    "store/SUBMISSION-GUIDE.md",
    "store/apple-privacy-questionnaire.md",
    "store/google-data-safety.md",
    "scripts/build-web.mjs",
    "scripts/build-release.mjs",
    "scripts/bump-version.mjs",
    "scripts/generate-app-icons.mjs",
    "scripts/generate-splash-screens.mjs",
    "scripts/generate-keystore.sh",
    "scripts/apply-native-branding.mjs",
    "scripts/generate-capacitor-config.mjs",
    "docs/ios-release-setup.md",
  ];

  let found = 0;
  const missing = [];
  for (const f of requiredFiles) {
    if (await exists(f)) { found++; } else { missing.push(f); }
  }

  if (missing.length === 0) {
    ok("Arquivos obrigatorios", `${found}/${requiredFiles.length}`);
  } else {
    fail("Arquivos obrigatorios", `${found}/${requiredFiles.length} — faltam: ${missing.join(", ")}`);
  }
}

// ── B1) Hardcoded passwords ────────────────────────────
async function checkHardcodedPasswords() {
  const targets = ["rodrigo26", "edmundoagro26", "fazendeiro26", "MASTER_PASSWORD", "VENDOR_PASSWORDS"];
  const jsFiles = [];

  async function collectJs(dir) {
    try {
      const entries = await readdir(p(dir), { withFileTypes: true });
      for (const e of entries) {
        const rel = dir + "/" + e.name;
        if (e.isDirectory() && !["node_modules", ".git", "android", "ios", "dist"].includes(e.name)) {
          await collectJs(rel);
        } else if (e.isFile() && e.name.endsWith(".js")) {
          jsFiles.push(rel);
        }
      }
    } catch { /* skip */ }
  }

  await collectJs("src/scripts");
  await collectJs("src/vendor");
  jsFiles.push("index.html");

  const hits = [];
  for (const f of jsFiles) {
    const content = await readText(f);
    if (!content) continue;
    for (const t of targets) {
      if (content.includes(t)) hits.push(`${f} contém "${t}"`);
    }
  }

  if (hits.length === 0) {
    ok("Seguranca (senhas hardcoded)", "Nenhuma encontrada");
  } else {
    fail("Seguranca (senhas hardcoded)", hits.join("; "));
  }
}

// ── B2) Merge conflicts ───────────────────────────────
async function checkMergeConflicts() {
  const markerRegex = /^(<{7}|>{7}|={7})\s/m;
  const filesToCheck = ["database.sql", "index.html", "src/index.html", "src/scripts/app.js"];
  const hits = [];

  for (const f of filesToCheck) {
    const content = await readText(f);
    if (!content) continue;
    if (markerRegex.test(content)) {
      hits.push(f);
    }
  }

  if (hits.length === 0) {
    ok("Conflitos de merge", "Nenhum encontrado");
  } else {
    fail("Conflitos de merge", `Encontrados em: ${hits.join(", ")}`);
  }
}

// ── B3) Supabase bundled locally ──────────────────────
async function checkSupabaseBundled() {
  const html = await readText("src/index.html");
  if (!html) { fail("Supabase bundled local", "src/index.html nao encontrado"); return; }

  const hasCdnScript = /src=["'].*cdn\.jsdelivr\.net.*supabase/.test(html);
  const hasLocalVendor = html.includes("vendor/supabase-js.min.js");

  if (hasCdnScript) {
    fail("Supabase bundled local", "CDN ainda presente em src/index.html");
  } else if (hasLocalVendor) {
    ok("Supabase bundled local", "vendor/supabase-js.min.js");
  } else {
    warn("Supabase bundled local", "Referencia nao encontrada");
  }
}

// ── B4) Prod credentials ─────────────────────────────
async function checkProdCredentials() {
  const content = await readText("config/environments/prod.json");
  if (!content) { warn("Credenciais prod", "prod.json nao encontrado"); return; }

  try {
    const config = JSON.parse(content);
    const hasUrl = config.supabaseUrl && config.supabaseUrl.length > 10;
    const hasKey = config.supabaseAnonKey && config.supabaseAnonKey.length > 10;
    if (hasUrl && hasKey) {
      ok("Credenciais prod", "Preenchidas");
    } else {
      warn("Credenciais prod", "Vazias (preencher antes de publicar)");
    }
  } catch {
    fail("Credenciais prod", "JSON invalido");
  }
}

// ── B5) Version sync ─────────────────────────────────
async function checkVersionSync() {
  const versionJson = await readText("config/version.json");
  const pkgJson = await readText("package.json");
  const gradle = await readText("android/app/build.gradle");
  const pbxproj = await readText("ios/App/App.xcodeproj/project.pbxproj");

  if (!versionJson) { fail("Versao sincronizada", "config/version.json nao encontrado"); return; }

  try {
    const vc = JSON.parse(versionJson);
    const ver = vc.version;
    const build = vc.build;
    const issues = [];

    if (pkgJson) {
      const pkg = JSON.parse(pkgJson);
      if (pkg.version !== ver) issues.push(`package.json: ${pkg.version}`);
    }
    if (gradle) {
      const m = gradle.match(/versionName\s+"([^"]+)"/);
      if (m && m[1] !== ver) issues.push(`build.gradle: ${m[1]}`);
      const bc = gradle.match(/versionCode\s+(\d+)/);
      if (bc && parseInt(bc[1]) !== build) issues.push(`build.gradle versionCode: ${bc[1]}`);
    }
    if (pbxproj) {
      const mv = pbxproj.match(/MARKETING_VERSION\s*=\s*([^;]+)/);
      if (mv && mv[1].trim() !== ver) issues.push(`pbxproj: ${mv[1].trim()}`);
    }

    if (issues.length === 0) {
      ok("Versao sincronizada", `${ver} (build ${build})`);
    } else {
      fail("Versao sincronizada", `${ver} esperado, divergencias: ${issues.join(", ")}`);
    }
  } catch (e) {
    fail("Versao sincronizada", e.message);
  }
}

// ── B6) Android icons ────────────────────────────────
async function checkAndroidIcons() {
  const densities = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];
  let found = 0;
  for (const d of densities) {
    if (await exists(`android/app/src/main/res/mipmap-${d}/ic_launcher.png`)) found++;
  }
  if (found === densities.length) {
    ok("Icones Android", `${found}/${densities.length} densidades`);
  } else {
    fail("Icones Android", `${found}/${densities.length} densidades`);
  }
}

// ── B6b) iOS icons ───────────────────────────────────
async function checkIosIcons() {
  const contentsPath = "ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json";
  const content = await readText(contentsPath);
  if (!content) { fail("Icones iOS", "Contents.json nao encontrado"); return; }

  try {
    const parsed = JSON.parse(content);
    const images = parsed.images || [];
    const withFile = images.filter(i => i.filename);
    let found = 0;
    for (const img of withFile) {
      if (await exists(`ios/App/App/Assets.xcassets/AppIcon.appiconset/${img.filename}`)) found++;
    }
    if (found === withFile.length && found > 0) {
      ok("Icones iOS", `${found}/${withFile.length} tamanhos`);
    } else {
      fail("Icones iOS", `${found}/${withFile.length} tamanhos`);
    }
  } catch {
    fail("Icones iOS", "Contents.json invalido");
  }
}

// ── B7) Splash screens ───────────────────────────────
async function checkSplashScreens() {
  const androidVariants = [
    "drawable-port-hdpi", "drawable-port-mdpi", "drawable-port-xhdpi",
    "drawable-port-xxhdpi", "drawable-port-xxxhdpi",
    "drawable-land-hdpi", "drawable-land-mdpi", "drawable-land-xhdpi",
    "drawable-land-xxhdpi", "drawable-land-xxxhdpi",
    "drawable",
  ];
  let aFound = 0;
  for (const v of androidVariants) {
    if (await exists(`android/app/src/main/res/${v}/splash.png`)) aFound++;
  }
  if (aFound === androidVariants.length) {
    ok("Splash Android", `${aFound}/${androidVariants.length} variantes`);
  } else if (aFound > 0) {
    warn("Splash Android", `${aFound}/${androidVariants.length} variantes`);
  } else {
    fail("Splash Android", "Nenhuma encontrada");
  }

  const iosSplash = await exists("ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png");
  if (iosSplash) {
    ok("Splash iOS", "OK");
  } else {
    // Check for any splash image
    const altSplash = await exists("ios/App/App/Assets.xcassets/Splash.imageset");
    if (altSplash) {
      warn("Splash iOS", "Diretorio existe mas splash-2732x2732.png nao encontrado");
    } else {
      fail("Splash iOS", "Nao encontrado");
    }
  }
}

// ── B8) Manifest PWA ─────────────────────────────────
async function checkManifest() {
  const content = await readText("manifest.json");
  if (!content) { fail("Manifest PWA", "Nao encontrado"); return; }

  try {
    const manifest = JSON.parse(content);
    const icons = manifest.icons || [];
    let valid = 0;
    for (const icon of icons) {
      if (await exists(icon.src)) valid++;
    }
    if (valid === icons.length && icons.length > 0) {
      ok("Manifest PWA", `Icones validos (${valid})`);
    } else {
      fail("Manifest PWA", `${valid}/${icons.length} icones encontrados`);
    }
  } catch {
    fail("Manifest PWA", "JSON invalido");
  }
}

// ── B9) Gitignore keystores ──────────────────────────
async function checkGitignore() {
  const content = await readText(".gitignore");
  if (!content) { warn(".gitignore (keystores)", "Arquivo nao encontrado"); return; }

  const hasKeystore = content.includes("*.keystore") || content.includes("*.jks");
  const hasProps = content.includes("keystore.properties");

  if (hasKeystore && hasProps) {
    ok(".gitignore (keystores)", "Configurado");
  } else {
    warn(".gitignore (keystores)", "Falta exclusao de keystores/properties");
  }
}

// ── B10) Anon policies in database.sql ───────────────
async function checkAnonPolicies() {
  const content = await readText("database.sql");
  if (!content) { warn("Policies anon", "database.sql nao encontrado"); return; }

  const hasAnon = /TO\s+anon/i.test(content);
  if (hasAnon) {
    warn("Policies anon", "Encontradas policies TO anon (remover para producao)");
  } else {
    ok("Policies anon", "Nenhuma encontrada");
  }
}

// ── B11) Placeholders ────────────────────────────────
async function checkPlaceholders() {
  const placeholders = ["[NOME DA EMPRESA]", "[CNPJ]", "[EMAIL DE CONTATO]", "[EMAIL DE SUPORTE]", "[URL DO SITE]"];
  const filesToCheck = [
    "store/metadata.json",
    "src/legal/politica-privacidade.html",
    "src/legal/termos-de-uso.html",
  ];

  let total = 0;
  for (const f of filesToCheck) {
    const content = await readText(f);
    if (!content) continue;
    for (const ph of placeholders) {
      if (content.includes(ph)) total++;
    }
  }

  if (total === 0) {
    ok("Placeholders a preencher", "Todos preenchidos");
  } else {
    warn("Placeholders a preencher", `${total} encontrados`);
  }
}

// ── B12) Auth engine uses Supabase Auth ──────────────
async function checkAuthEngine() {
  const content = await readText("src/scripts/auth-engine.js");
  if (!content) { fail("Autenticacao", "auth-engine.js nao encontrado"); return; }

  if (content.includes("signInWithPassword")) {
    ok("Autenticacao", "Supabase Auth");
  } else {
    fail("Autenticacao", "signInWithPassword nao encontrado");
  }
}

// ── B13) Store metadata ──────────────────────────────
async function checkStoreMetadata() {
  const content = await readText("store/metadata.json");
  if (!content) { fail("Metadata da loja", "Nao encontrado"); return; }

  try {
    const meta = JSON.parse(content);
    const hasName = meta.app_name && meta.app_name.length > 0;
    const hasShort = meta.short_description && meta.short_description.length > 0;
    const hasFull = meta.full_description && meta.full_description.length >= 800;

    if (hasName && hasShort && hasFull) {
      ok("Metadata da loja", "Completo");
    } else {
      const issues = [];
      if (!hasName) issues.push("app_name");
      if (!hasShort) issues.push("short_description");
      if (!hasFull) issues.push("full_description curta");
      warn("Metadata da loja", `Incompleto: ${issues.join(", ")}`);
    }
  } catch {
    fail("Metadata da loja", "JSON invalido");
  }
}

// ── B14) Legal pages ─────────────────────────────────
async function checkLegalPages() {
  const pp = await exists("src/legal/politica-privacidade.html");
  const tu = await exists("src/legal/termos-de-uso.html");

  if (pp && tu) {
    ok("Politica e Termos", "Ambos existem");
  } else {
    const missing = [];
    if (!pp) missing.push("politica-privacidade.html");
    if (!tu) missing.push("termos-de-uso.html");
    fail("Politica e Termos", `Faltam: ${missing.join(", ")}`);
  }
}

// ── Main ─────────────────────────────────────────────
async function main() {
  console.log("");
  console.log("\x1b[36m╔══════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[36m║     ControlAGRO — Diagnostico v2.0      ║\x1b[0m");
  console.log("\x1b[36m╚══════════════════════════════════════════╝\x1b[0m");
  console.log("");

  await checkRequiredFiles();
  await checkHardcodedPasswords();
  await checkMergeConflicts();
  await checkSupabaseBundled();
  await checkProdCredentials();
  await checkVersionSync();
  await checkAndroidIcons();
  await checkIosIcons();
  await checkSplashScreens();
  await checkManifest();
  await checkGitignore();
  await checkAnonPolicies();
  await checkPlaceholders();
  await checkStoreMetadata();
  await checkLegalPages();
  await checkAuthEngine();

  console.log("");
  console.log("\x1b[36m═══════════════════════════════════════════\x1b[0m");
  console.log(`  Resultado: ${results.pass} \x1b[32m✅\x1b[0m  |  ${results.warn} \x1b[33m⚠️\x1b[0m  |  ${results.fail} \x1b[31m❌\x1b[0m`);

  if (results.fail > 0) {
    console.log("  Status: \x1b[31mFALHA CRITICA — corrigir antes de publicar\x1b[0m");
  } else if (results.warn > 0) {
    console.log("  Status: \x1b[33mPRONTO PARA BUILD (resolver avisos antes de publicar)\x1b[0m");
  } else {
    console.log("  Status: \x1b[32mPRONTO PARA PUBLICACAO\x1b[0m");
  }

  console.log("\x1b[36m═══════════════════════════════════════════\x1b[0m");
  console.log("");

  if (results.fail > 0) process.exitCode = 1;
}

main().catch(error => {
  console.error("Erro no diagnostico:", error.message);
  process.exitCode = 1;
});
