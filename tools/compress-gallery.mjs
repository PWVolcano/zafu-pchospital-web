/**
 * 图集压缩脚本（一次性）
 *
 * 把 public/gallery/ 下的原图统一压到适合网页的尺寸与体积：
 * - 最长边限制到 1600px（3:2 画面 + cover 裁切，1600px 已足够 2x 屏）
 * - JPEG 质量 78，开启 mozjpeg 风格优化
 * - 保留原图到 public/gallery/_originals/，便于日后重新导出
 *
 * 运行：node tools/compress-gallery.mjs
 *
 * 注意：sharp 只作为 next 的传递依赖存在于 pnpm 的虚拟 store 里，
 * 项目根 node_modules 下没有软链，所以这里按绝对路径导入。
 */
import { readdir, mkdir, copyFile, stat, readFile, rename } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SHARP_DIR = resolve("node_modules/.pnpm");
const sharpPkg = (await readdir(SHARP_DIR)).find((d) => d.startsWith("sharp@"));
if (!sharpPkg) throw new Error("未找到 sharp，请先 pnpm install");
const { default: sharp } = await import(
  pathToFileURL(join(SHARP_DIR, sharpPkg, "node_modules/sharp/dist/index.mjs")).href
);

const DIR = "public/gallery";
const BACKUP = join(DIR, "_originals");
const MAX_EDGE = 1440;
const QUALITY = 74;

await mkdir(BACKUP, { recursive: true });

const files = (await readdir(DIR)).filter((f) => /\.jpe?g$/i.test(f));

for (const file of files) {
  const src = join(DIR, file);
  const before = (await stat(src)).size;

  // 原图先备份一次（已备份过就跳过，避免把压缩后的图当成原图覆盖备份）
  const backupPath = join(BACKUP, file);
  try {
    await stat(backupPath);
  } catch {
    await copyFile(src, backupPath);
  }

  const input = await readFile(backupPath);
  const meta = await sharp(input).metadata();
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;

  await sharp(input)
    .resize({
      width: Math.round((meta.width ?? 0) * scale),
      height: Math.round((meta.height ?? 0) * scale),
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
    .toFile(src + ".tmp");

  await rename(src + ".tmp", src);

  const after = (await stat(src)).size;
  console.log(
    `${file.padEnd(28)} ${(meta.width ?? 0)}x${meta.height ?? 0} -> ${Math.round((meta.width ?? 0) * scale)}x${Math.round((meta.height ?? 0) * scale)}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`,
  );
}
