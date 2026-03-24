import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const versionPath = path.join(rootDir, "config", "version.json");

async function main() {
  console.log("\n=== ControlAGRO Preflight ===\n");

  // Step 1: Run doctor
  console.log("[1/2] Executando diagnostico...\n");
  try {
    execFileSync("node", ["scripts/doctor.mjs"], { stdio: "inherit", cwd: rootDir });
  } catch (e) {
    console.error("\n❌ Falha critica detectada. Corrija os erros acima antes de continuar.\n");
    process.exitCode = 1;
    return;
  }

  // Step 2: Show version and next steps
  const versionConfig = JSON.parse(await readFile(versionPath, "utf8"));
  console.log(`[2/2] Versao atual: ${versionConfig.version} (build ${versionConfig.build})\n`);

  console.log("=== Pronto para build ===\n");
  console.log("  Android (AAB para Google Play):");
  console.log("    npm run release:android\n");
  console.log("  Android (APK para teste):");
  console.log("    npm run release:android:apk\n");
  console.log("  iOS (App Store):");
  console.log("    Xcode Archive — ver docs/ios-release-setup.md\n");
  console.log("  Guia completo: store/SUBMISSION-GUIDE.md\n");
}

main().catch(error => {
  console.error("Erro no preflight:", error.message);
  process.exitCode = 1;
});
