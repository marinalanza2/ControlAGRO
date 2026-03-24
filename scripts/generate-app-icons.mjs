import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourcePath = path.join(rootDir, "logo-1024.png");
const svgPath = path.join(rootDir, "logo.svg");
const iosIconDir = path.join(rootDir, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset");
const androidResDir = path.join(rootDir, "android", "app", "src", "main", "res");
const iconsDir = path.join(rootDir, "icons");

const BG_COLOR = "#14532d";

const iosIcons = [
  { filename: "AppIcon-20@2x.png", size: 40, idiom: "iphone", scale: "2x", pointSize: "20x20" },
  { filename: "AppIcon-20@3x.png", size: 60, idiom: "iphone", scale: "3x", pointSize: "20x20" },
  { filename: "AppIcon-29@2x.png", size: 58, idiom: "iphone", scale: "2x", pointSize: "29x29" },
  { filename: "AppIcon-29@3x.png", size: 87, idiom: "iphone", scale: "3x", pointSize: "29x29" },
  { filename: "AppIcon-40@2x.png", size: 80, idiom: "iphone", scale: "2x", pointSize: "40x40" },
  { filename: "AppIcon-40@3x.png", size: 120, idiom: "iphone", scale: "3x", pointSize: "40x40" },
  { filename: "AppIcon-60@2x.png", size: 120, idiom: "iphone", scale: "2x", pointSize: "60x60" },
  { filename: "AppIcon-60@3x.png", size: 180, idiom: "iphone", scale: "3x", pointSize: "60x60" },
  { filename: "AppIcon-20.png", size: 20, idiom: "ipad", scale: "1x", pointSize: "20x20" },
  { filename: "AppIcon-20@2x-ipad.png", size: 40, idiom: "ipad", scale: "2x", pointSize: "20x20" },
  { filename: "AppIcon-29.png", size: 29, idiom: "ipad", scale: "1x", pointSize: "29x29" },
  { filename: "AppIcon-29@2x-ipad.png", size: 58, idiom: "ipad", scale: "2x", pointSize: "29x29" },
  { filename: "AppIcon-40.png", size: 40, idiom: "ipad", scale: "1x", pointSize: "40x40" },
  { filename: "AppIcon-40@2x-ipad.png", size: 80, idiom: "ipad", scale: "2x", pointSize: "40x40" },
  { filename: "AppIcon-76.png", size: 76, idiom: "ipad", scale: "1x", pointSize: "76x76" },
  { filename: "AppIcon-76@2x.png", size: 152, idiom: "ipad", scale: "2x", pointSize: "76x76" },
  { filename: "AppIcon-83.5@2x.png", size: 167, idiom: "ipad", scale: "2x", pointSize: "83.5x83.5" },
  { filename: "AppIcon-1024.png", size: 1024, idiom: "ios-marketing", scale: "1x", pointSize: "1024x1024" }
];

const androidIcons = [
  { dir: "mipmap-mdpi", size: 48 },
  { dir: "mipmap-hdpi", size: 72 },
  { dir: "mipmap-xhdpi", size: 96 },
  { dir: "mipmap-xxhdpi", size: 144 },
  { dir: "mipmap-xxxhdpi", size: 192 }
];

async function resizeToFile(sourceBuffer, outputPath, size) {
  await sharp(sourceBuffer)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath);
}

async function resizeWithBackground(sourceBuffer, outputPath, size, bgColor) {
  await sharp(sourceBuffer)
    .resize(size, size, { fit: "contain", background: bgColor })
    .flatten({ background: bgColor })
    .png()
    .toFile(outputPath);
}

async function generateForegroundWithPadding(sourceBuffer, outputPath, size) {
  const iconSize = Math.round(size * 0.5);
  const icon = await sharp(sourceBuffer)
    .resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: icon, gravity: "centre" }])
    .png()
    .toFile(outputPath);
}

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

async function generateIosIcons(sourceBuffer) {
  await mkdir(iosIconDir, { recursive: true });

  for (const icon of iosIcons) {
    const outputPath = path.join(iosIconDir, icon.filename);
    await resizeWithBackground(sourceBuffer, outputPath, icon.size, BG_COLOR);
  }

  const contents = {
    images: iosIcons.map(icon => ({
      filename: icon.filename,
      idiom: icon.idiom,
      scale: icon.scale,
      size: icon.pointSize
    })),
    info: {
      author: "generate-app-icons",
      version: 1
    }
  };

  await writeFile(path.join(iosIconDir, "Contents.json"), JSON.stringify(contents, null, 2), "utf8");
  console.log(`  iOS: ${iosIcons.length} icons generated`);
}

async function generateAndroidIcons(sourceBuffer) {
  for (const icon of androidIcons) {
    const targetDir = path.join(androidResDir, icon.dir);
    await mkdir(targetDir, { recursive: true });

    await resizeWithBackground(sourceBuffer, path.join(targetDir, "ic_launcher.png"), icon.size, BG_COLOR);
    await resizeWithBackground(sourceBuffer, path.join(targetDir, "ic_launcher_round.png"), icon.size, BG_COLOR);
    await generateForegroundWithPadding(sourceBuffer, path.join(targetDir, "ic_launcher_foreground.png"), icon.size);
  }
  console.log(`  Android: ${androidIcons.length} densities generated (launcher + round + foreground)`);
}

async function generatePwaIcons(sourceBuffer) {
  await mkdir(iconsDir, { recursive: true });

  await resizeWithBackground(sourceBuffer, path.join(iconsDir, "icon-192.png"), 192, BG_COLOR);
  await resizeWithBackground(sourceBuffer, path.join(iconsDir, "icon-512.png"), 512, BG_COLOR);
  console.log("  PWA: icon-192.png and icon-512.png generated");
}

async function main() {
  console.log("Generating app icons...");
  const sourceBuffer = await loadSourceBuffer();
  await generateIosIcons(sourceBuffer);
  await generateAndroidIcons(sourceBuffer);
  await generatePwaIcons(sourceBuffer);
  console.log("All icons generated successfully.");
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
