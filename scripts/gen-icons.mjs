// Gera os icones PWA (PNG) a partir da arte de marca (brand/money_track.png).
// A arte ja e quadrada, full-bleed (fundo grafite) e com margem segura -> serve
// para "any" e "maskable". Rode com: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "brand", "money_track.png");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-maskable-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  await sharp(source).resize(size, size).png().toFile(join(outDir, file));
  console.log("wrote", file, size + "x" + size);
}
