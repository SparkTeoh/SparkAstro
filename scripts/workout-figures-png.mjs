// 把 src/content/stacks/workout/*.svg 转成 1200×1200 PNG（网页用 PNG，字体在本机渲染好，不依赖访客字体）
import sharp from "sharp";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const dir = new URL("../src/content/stacks/workout/", import.meta.url).pathname;
for (const f of (await readdir(dir)).filter((f) => f.endsWith(".svg"))) {
  await sharp(join(dir, f), { density: 144 }).resize(1200, 1200).png({ compressionLevel: 9 }).toFile(join(dir, f.replace(/\.svg$/, ".png")));
  console.log("png", f);
}
