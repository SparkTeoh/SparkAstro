// Markdown 文章的文件夹：在这里新建 my-post.md，网址就是 /blog/my-post
// 文件夹里还没有 .md 时，content.config.ts、lib/content.ts 和 blog/[slug].astro 会直接跳过，
// 避免 Astro 在构建日志里打印「目录不存在」「collection 为空」的警告。
// 注意：开着 npm run dev 时放进第一篇 .md，要重启 dev 才会出现。
import { existsSync, readdirSync } from "node:fs";

export const BLOG_DIR = "./src/content/blog";

export function hasMarkdownPosts(): boolean {
  return existsSync(BLOG_DIR) && readdirSync(BLOG_DIR).some((f) => f.endsWith(".md"));
}
