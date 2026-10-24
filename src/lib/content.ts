// 内容中心的数据源：Markdown 文章 + .astro 富媒体文章 + YouTube 视频
import { getCollection } from "astro:content";
import videos from "../data/videos.json";

export type ContentItem = {
  title: string;
  summary: string;
  author: string;
  pubDate: Date;
  tags: string[];
  type: string;
  featured: boolean;
  link: string;
  kind: "markdown" | "astro" | "youtube";
  external: boolean;
};

type BlogData = Omit<ContentItem, "link" | "kind" | "external" | "pubDate"> & { pubDate: Date | string };

const astroPosts = import.meta.glob<{ blogData?: BlogData }>(
  ["../pages/blog/*.astro", "!**/index.astro", "!**/*slug*.astro"],
  { eager: true },
);

export async function getAllContent(): Promise<ContentItem[]> {
  const md = (await getCollection("blog", (e) => !e.data.draft)).map<ContentItem>((e) => ({
    ...e.data,
    link: `/blog/${e.id}`,
    kind: "markdown",
    external: false,
  }));

  const astro = Object.entries(astroPosts).flatMap<ContentItem>(([path, mod]) => {
    if (!mod.blogData) return [];
    const slug = path.split("/").pop()!.replace(/\.astro$/, "");
    return [{
      ...mod.blogData,
      pubDate: new Date(mod.blogData.pubDate),
      link: `/blog/${slug}`,
      kind: "astro",
      external: false,
    }];
  });

  const yt = (videos.featuredVideos as any[]).map<ContentItem>((v) => ({
    title: v.title,
    summary: v.description,
    author: "Spark Liang",
    pubDate: new Date(v.publishDate),
    tags: v.tags ?? [],
    type: "视频",
    featured: false,
    link: `https://www.youtube.com/watch?v=${v.videoId}`,
    kind: "youtube",
    external: true,
  }));

  return [...md, ...astro, ...yt].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
}
