# Spark Liang 官方网站

[sparkliang.com](https://sparkliang.com) 的源码。Astro 5 + Tailwind 3 全静态站点，部署在 Netlify。

网站的核心任务是**身份认证与防诈骗**：告诉访客哪些账号是真的 Spark、Spark 绝对不会做什么、以及遇到假冒该怎么办。其余页面是关于、官方合作伙伴、内容中心（文章 + 视频）和联系表单。

## 开发

```bash
nvm use            # Node 20（.nvmrc）
npm install
npm run dev        # http://localhost:4321
npm run build      # astro check + astro build → dist/
npm run preview
```

## 目录结构

```
src/
├── pages/                 # 路由
│   ├── index.astro        # 首页
│   ├── about / contact / fraud-prevention / partners / wealth / 404
│   ├── contact/thanks.astro   # 表单提交后的感谢页
│   └── blog/
│       ├── index.astro    # 内容中心（文章 + 视频，前端搜索）
│       ├── [slug].astro   # 渲染 Markdown 文章
│       └── <slug>.astro   # 富媒体 .astro 文章（见下）
├── content/blog/*.md      # Markdown 文章（content collection）
├── content.config.ts      # Markdown 文章的 schema
├── components/
│   ├── sections/          # 页面区块（Hero、OfficialAccount、HowToVerify…）
│   ├── ui/                # 通用组件（Button、Card、Accordion、Navbar、Footer…）
│   └── WealthGame.tsx     # /wealth 的 React 小游戏
├── data/                  # 站点数据（见 src/data/README.md）
├── layouts/               # MainLayout / BlogLayout / MainHead
├── styles/global.css      # 品牌 token、字体、文章排版
└── assets/                # 图片、SVG
```

## 添加内容

### Markdown 文章

在 `src/content/blog/` 新建 `my-post.md`，URL 为 `/blog/my-post`：

```md
---
title: "文章标题"
pubDate: 2026-01-01
author: "Spark Liang"
tags: ["理财", "投资"]
summary: "一两句话的摘要，会显示在列表卡片和分享预览里。"
type: "文章"
featured: false   # 可选，列表里显示「推荐」
draft: false      # 可选，true 时不出现在列表、不生成页面
---

正文……
```

图片放到 `src/assets/blog/`，用 `![说明](../../assets/blog/xxx.png)` 引用。

### 富媒体 .astro 文章（有意设计，不是错误）

需要交互组件、复杂排版时，用 `.astro` 写文章。在 `src/pages/blog/` 新建 `my-post.astro`：

```astro
---
import BlogLayout from "../../layouts/BlogLayout.astro";
import Card from "../../components/ui/Card.astro";

// 必须 export，内容中心靠它生成列表卡片
export const blogData = {
  title: "文章标题",
  pubDate: new Date("2026-01-01"),
  author: "Spark Liang",
  tags: ["自我成长"],
  summary: "摘要",
  type: "深度思考",
  featured: true,
};
---

<BlogLayout {...blogData}>
  <h2>小标题</h2>
  <p>正文……</p>
  <Card isUnderline={true}><div class="p-8">可以用任何 UI 组件</div></Card>
</BlogLayout>
```

`BlogLayout` 内部已经套了 `.prose` 排版，正文里的 `h2/h3/p/ul/blockquote` 会自动有样式。

### YouTube 视频

编辑 `src/data/videos.json`，视频会出现在内容中心：

```json
{ "title": "视频标题", "description": "一句话介绍", "videoId": "dQw4w9WgXcQ", "publishDate": "2026-01-01", "tags": ["理财"] }
```

### 我的清单（/stack）

每个清单是一个 YAML 文件，放在 `src/content/stacks/`，文件名就是网址：`hair.yaml` → `/stack/hair`。参考 `hair.yaml` 的写法：

- **每一项**要有 `id`（小写英文，会变成单项链接 `/stack/hair#id`）、`name`、`status`（必备 / 进阶 / 可选 / 已淘汰）、`role`、`why`、`how`。
- **价位、用了多久、购买链接**（`price`、`since`、`link`）可以先不填，填上后网页自动显示。带佣金的链接加 `affiliate: true`，网页会标出「佣金链接」。
- **健康类清单**设 `medical: true`，并在 `safety` 里写安全提醒，页面顶部会显示免责声明。
- 还可以加 `principles`（原则）、`schedule`（一周排程）、`notRecommended`（试过但不推荐）、`faq`（常见问题）。没填的区块不显示。
- 新清单上线前设 `draft: true`。总入口页会把还没做的清单显示成「整理中」。
- 分享图放在 `public/og/stack-<slug>.png`（1200×630）。短网址在 `netlify.toml` 里加，例如 `/hair` → `/stack/hair`。

### 其它数据

首页的内容方向卡、辨别真假步骤、合作伙伴、学员评价、官方社交账号都在 `src/data/*.json`，改数据即可，不用动组件。说明见 [src/data/README.md](src/data/README.md)。

## 设计系统

全站样式在 `src/styles/site.css`（`sp-` 前缀），Tailwind 只给 `.astro` 富媒体文章和 `/wealth` 小游戏用。

| 名称 | 值 | 用途 |
|---|---|---|
| `--sp-ink` | `#0A0A0D` | 主色：文字、1.5px 描边、实色偏移阴影 |
| `--sp-accent` | `#3D5AFE` | 点缀蓝：主按钮、眉标小方块、导航下划线、标题高亮。蓝底上用白字 |
| `--sp-soft` | `#5A5A60` | 次要文字 |
| `--sp-alt` | `#F1EFE9` | 交替区块底色（暖白） |
| `--sp-danger` | `#C62828` | 只用于防诈骗警示 |

- **组件**：按钮用 `components/ui/Button.astro`（`primary` 蓝底 / `ghost` 白底 / `ink` 黑底），主按钮每屏最多两个；区块开头用 `SectionIntro.astro`（眉标 → 大标题 → 说明）；内页顶部用 `PageHero.astro`；卡片用 `.sp-card`，可点击的加 `.sp-card--link`。
- **版式**：内容宽 72rem（`.sp-wrap`），区块之间用 `.sp-section`，交替底色加 `.sp-section--alt`。断点只有 980px 和 720px。
- **字体**：Bricolage Grotesque（英文标题）、Inter（英文正文）、Noto Sans SC（中文），从 Google Fonts 加载。
- Tailwind 里的 `primary` / `accent` / `background` 与上表同值，文章里可以继续用 `text-primary/70`、`bg-accent/10`。

## 部署

Netlify 自动从 `main` 构建（`netlify.toml`：Node 20，发布 `dist/`）。旧 URL 的 301 跳转也在 `netlify.toml`。

**商业合作表单**走 Netlify Forms。需要在 Netlify 后台 → Forms 开启 *Form detection*，否则提交会 404。

## 待补充（搜索代码里的 `TODO(spark)`）

- [ ] `public/og-cover.png`：1200×630 的分享预览图（目前是占位）
- [ ] 关于页真人照片（`AboutHero.astro`）
- [ ] `src/data/videos.json`：真实 YouTube 视频
- [ ] `src/data/testimonials.json`：学员评价（有内容后首页自动显示）
- [ ] Netlify 后台开启 Forms
- [ ] `/wealth` 小游戏目前是英文，未放进导航
- [ ] 生发清单：每一项的价位、用了多久、购买链接（`src/content/stacks/hair.yaml`）
- [ ] 其余四个清单：Tech、健康、穿搭、皮肤管理

## 致谢与许可

页面版式与导航经 Jackson Yew 同意，改编自他的个人网站 jacksonyew-website 的 v2 设计系统；配色、字体和全部内容为本站自有。项目最初由 Astro 模版 [manulthanura/Positivus](https://github.com/manulthanura/Positivus) 生成（MIT，见 [LICENSE](LICENSE)）。网站内容 © Spark Liang。
