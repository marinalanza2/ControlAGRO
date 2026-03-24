import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourcePath = path.join(rootDir, "logo-1024.png");
const svgPath = path.join(rootDir, "logo.svg");
const androidResDir = path.join(rootDir, "android", "app", "src", "main", "res");
const iosSplashDir = path.join(rootDir, "ios", "App", "App", "Assets.xcassets", "Splash.imageset");

const BG_COLOR = { r: 20, g: 83, b: 45 }; // #14532d

const androidSplashes = [
  { dir: "drawable", width: 480, height: 480 },
  { dir: "drawable-land-mdpi", width: 480, height: 320 },
  { dir: "drawable-land-hdpi", width: 800, height: 480 },
  { dir: "drawable-land-xhdpi", width: 1280, height: 720 },
  { dir: "drawable-land-xxhdpi", width: 1600, height: 960 },
  { dir: "drawable-land-xxxhdpi", width: 1920, height: 1080 },
  { dir: "drawable-port-mdpi", width: 320, height: 480 },
  { dir: "drawable-port-hdpi", width: 480, height: 800 },
  { dir: "drawable-port-xhdpi", width: 720, height: 1280 },
  { dir: "drawable-port-xxhdpi", width: 960, height: 1600 },
  { dir: "drawable-port-xxxhdpi", width: 1080, height: 1920 }
];

async function loadSourceBuffer() {
  try {
    return await sharp(sourcePath).png().toBuffer();
  } catch {
    console.log("logo-1024.png not found, generating from logo.svg...");
    const svgBuffer = await sharp(svgPath).resize(1024, 1024).png().toBuffer();
    await sharp(svgBuffer).toFile(sourcePath);
    return svgBuffer;
  }
}

async function generateSplash(sourceBuffer, outputPath, width, height) {
  const minDim = Math.min(width, height);
  const logoSize = Math.round(minDim * 0.3);

  const logo = await sharp(sourceBuffer)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { ...BG_COLOR, alpha: 255 }
    }
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(outputPath);
}

async function generateAndroidSplashes(sourceBuffer) {
  for (const splash of androidSplashes) {
    const targetDir = path.join(androidResDir, splash.dir);
    await mkdir(targetDir, { recursive: true });
    await generateSplash(sourceBuffer, path.join(targetDir, "splash.png"), splash.width, splash.height);
  }
  console.log(`  Android: ${androidSplashes.length} splash screens generated`);
}

async function generateIosSplash(sourceBuffer) {
  await mkdir(iosSplashDir, { recursive: true });

  const size = 2732;
  const files = ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"];

  for (const filename of files) {
    await generateSplash(sourceBuffer, path.join(iosSplashDir, filename), size, size);
  }
  console.log("  iOS: 2732x2732 splash screen generated (3 scales)");
}

async function main() {
  console.log("Generating splash screens...");
  const sourceBuffer = await loadSourceBuffer();
  await generateAndroidSplashes(sourceBuffer);
  await generateIosSplash(sourceBuffer);
  console.log("All splash screens generated successfully.");
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
