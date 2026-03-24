import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const versionPath = path.join(rootDir, "config", "version.json");

function run(cmd, args, options = {}) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { stdio: "inherit", cwd: rootDir, ...options });
}

async function main() {
  console.log("=== ControlAGRO Release Build ===\n");

  // Step 1: Run doctor diagnostics
  console.log("[1/4] Executando diagnostico...\n");
  try {
    run("node", ["scripts/doctor.mjs"]);
  } catch (e) {
    console.error("\n  Falha critica detectada. Corrija os erros antes de gerar o release.\n");
    process.exitCode = 1;
    return;
  }

  // Step 2: Bump build number
  console.log("\n[2/4] Incrementando build number...");
  run("node", ["scripts/bump-version.mjs", "build-only"]);

  // Read updated version
  const versionConfig = JSON.parse(await readFile(versionPath, "utf8"));
  console.log(`\n  Versao: ${versionConfig.version} (build ${versionConfig.build})\n`);

  // Step 3: Full prod sync
  console.log("[3/4] Executando cap:sync:prod...");
  run("npm", ["run", "cap:sync:prod"]);

  // Step 4: Print next steps
  console.log("\n[4/4] Build preparado com sucesso!\n");
  console.log("=== Proximos passos ===\n");
  console.log("  Android (AAB para Google Play):");
  console.log("    cd android && ./gradlew bundleRelease\n");
  console.log("  Android (APK para testes):");
  console.log("    cd android && ./gradlew assembleRelease\n");
  console.log("  iOS:");
  console.log("    Abra ios/App/App.xcworkspace no Xcode");
  console.log("    Product → Archive → Distribute App\n");
  console.log(`  Versao: ${versionConfig.version} | Build: ${versionConfig.build}`);
}

main().catch(error => {
  console.error("Erro no build de release:", error.message);
  process.exitCode = 1;
});
