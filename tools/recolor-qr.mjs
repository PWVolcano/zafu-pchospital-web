/**
 * 二维码改色：把蓝紫渐变码点替换为全站强调黄，深色文字反白，背景铺页面深底。
 *
 * 背景与动因：
 *   原图是「近白底 + 蓝紫码点 + 黑字 + 红印章」的浅色卡片，直接放进深色页面
 *   会显得像一张贴上去的纸。本脚本把它重绘为「深底 + 黄码点」的版本，
 *   让二维码直接融入页面，同时保留红色印章的识别度。
 *
 * 处理逻辑（逐像素）：
 *   1. 码点像素（原蓝紫：B 显著高于 R）-> 强调黄
 *   2. 深色文字像素（原近黑）-> 浅色（反白），否则在深底上完全看不见
 *   3. 近白背景像素 -> 页面深底
 *   4. 其余像素（红色印章等）原样保留
 *
 * 用法：node tools/recolor-qr.mjs
 * 输入：public/qq-group-qrcode.jpg（彩色原版，保留可随时切回）
 * 输出：public/qq-group-qrcode-accent.png
 */
import { pathToFileURL } from "node:url";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SRC = "public/qq-group-qrcode.jpg";
const OUT_DIR = "public";

/** 定位 pnpm store 里的 sharp（next 的传递依赖，根目录无软链） */
function resolveSharp() {
  const store = "node_modules/.pnpm";
  for (const d of readdirSync(store)) {
    if (!d.startsWith("sharp@")) continue;
    const entry = join(store, d, "node_modules", "sharp", "dist", "index.mjs");
    if (existsSync(entry)) return entry;
  }
  throw new Error("未找到 sharp，请确认已安装依赖");
}

/** #rrggbb -> [r,g,b] */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** 码点：原蓝紫渐变，B 显著高于 R 且整体偏亮。红印章/黑字不满足 */
function isCodePixel(r, g, b) {
  return b - r > 25 && b > 140;
}

/** 深色文字：近黑（实测 15~30），用于反白 */
function isInkPixel(r, g, b) {
  return r < 110 && g < 110 && b < 120;
}

/** 近白背景：用于铺深底。实测 ≈ rgb(242..248, 243..249, 248..255)，略偏蓝 */
function isBgPixel(r, g, b) {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return min > 225 && max - min < 20;
}

/**
 * 目标色取自 src/app/globals.css 的设计令牌（oklch -> sRGB 换算）：
 *   --accent oklch(85% 0.175 99) -> #ebce0a
 *   --ink    oklch(96% 0.008 95) -> #f3f2ec
 *   --bg     oklch(14.5% 0.006 95) -> #0b0a08
 * 令牌若调整，需同步这里并重新运行脚本。
 */
const VARIANTS = [
  {
    file: "qq-group-qrcode-accent.png",
    dot: "#ebce0a", // --accent
    ink: "#f3f2ec", // --ink
    bg: "#0b0a08", // --bg
    label: "黄码点 + 反白文字 + 页面底色",
  },
];

async function main() {
  const sharp = (await import(pathToFileURL(resolveSharp()).href)).default;

  const { width, height } = await sharp(SRC).metadata();
  const raw = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
  const src = Buffer.from(raw.data);
  const ch = raw.info.channels;

  if (ch < 3) throw new Error(`预期至少 3 通道，实际 ${ch}`);

  for (const v of VARIANTS) {
    const [dr, dg, db] = hex(v.dot);
    const [ir, ig, ib] = hex(v.ink);
    const [br, bgc, bb] = hex(v.bg);
    const out = Buffer.from(src); // 每次都从原图字节开始

    let code = 0;
    let ink = 0;
    let bg = 0;

    for (let i = 0; i < out.length; i += ch) {
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];

      if (isCodePixel(r, g, b)) {
        out[i] = dr;
        out[i + 1] = dg;
        out[i + 2] = db;
        code++;
      } else if (isInkPixel(r, g, b)) {
        out[i] = ir;
        out[i + 1] = ig;
        out[i + 2] = ib;
        ink++;
      } else if (isBgPixel(r, g, b)) {
        out[i] = br;
        out[i + 1] = bgc;
        out[i + 2] = bb;
        bg++;
      }
    }

    await sharp(out, { raw: { width, height, channels: ch } })
      .png({ compressionLevel: 9, palette: true })
      .toFile(join(OUT_DIR, v.file));

    console.log(
      `${v.label} -> public/${v.file}\n  码点 ${code} / 文字 ${ink} / 底色 ${bg} 像素`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
