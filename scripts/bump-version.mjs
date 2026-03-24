import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const versionPath = path.join(rootDir, "config", "version.json");
const packagePath = path.join(rootDir, "package.json");
const androidBuildGradlePath = path.join(rootDir, "android", "app", "build.gradle");
const iosProjectPath = path.join(rootDir, "ios", "App", "App.xcodeproj", "project.pbxproj");

const bumpType = process.argv[2];

const validTypes = ["patch", "minor", "major", "build-only"];
if (!validTypes.includes(bumpType)) {
  console.error(`Uso: node scripts/bump-version.mjs <${validTypes.join("|")}>`);
  process.exit(1);
}

function bumpSemver(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      return version;
  }
}

async function updateVersionJson(newVersion, newBuild) {
  const content = { version: newVersion, build: newBuild };
  await writeFile(versionPath, JSON.stringify(content, null, 2) + "\n", "utf8");
}

async function updatePackageJson(newVersion) {
  const content = JSON.parse(await readFile(packagePath, "utf8"));
  content.version = newVersion;
  await writeFile(packagePath, JSON.stringify(content, null, 2) + "\n", "utf8");
}

async function updateAndroidBuildGradle(newVersion, newBuild) {
  let content = await readFile(androidBuildGradlePath, "utf8");
  content = content.replace(/versionCode \d+/, `versionCode ${newBuild}`);
  content = content.replace(/versionName ".*?"/, `versionName "${newVersion}"`);
  await writeFile(androidBuildGradlePath, content, "utf8");
}

async function updateIosProject(newVersion, newBuild) {
  let content = await readFile(iosProjectPath, "utf8");
  content = content.replace(/MARKETING_VERSION = .*?;/g, `MARKETING_VERSION = ${newVersion};`);
  content = content.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${newBuild};`);
  await writeFile(iosProjectPath, content, "utf8");
}

async function main() {
  const versionConfig = JSON.parse(await readFile(versionPath, "utf8"));
  const currentVersion = versionConfig.version;
  const currentBuild = versionConfig.build;

  const newVersion = bumpType === "build-only" ? currentVersion : bumpSemver(currentVersion, bumpType);
  const newBuild = currentBuild + 1;

  await updateVersionJson(newVersion, newBuild);
  await updatePackageJson(newVersion);
  await updateAndroidBuildGradle(newVersion, newBuild);
  await updateIosProject(newVersion, newBuild);

  console.log(`Versão atualizada: ${newVersion} (build ${newBuild})`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
