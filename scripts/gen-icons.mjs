// Gera os icones PWA (PNG) a partir de um SVG vetorial (sem depender de fonte).
// Rode com: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

// Fundo full-bleed (seguro para maskable) + 3 barras ascendentes (financas).
const BG = "#1e88e5";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  <g fill="#ffffff">
    <rect x="140" y="300" width="56" height="104" rx="16"/>
    <rect x="228" y="236" width="56" height="168" rx="16"/>
    <rect x="316" y="160" width="56" height="244" rx="16"/>
  </g>
</svg>`;
const buf = Buffer.from(svg);

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-maskable-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  await sharp(buf).resize(size, size).png().toFile(join(outDir, file));
  console.log("wrote", file, size + "x" + size);
}
