# 📝 博客创建指南

## 🎯 新的自动化流程

现在您**不需要**手动更新 `astroBlogData.json` 文件了！所有文章都使用 Astro 的内容集合系统自动管理。

## 🚀 快速创建文章

### 方法 1: 使用自动化脚本（推荐）

```bash
npm run create-blog
```

然后按提示输入：
- 文章标题
- 文章摘要  
- 作者
- 标签（用逗号分隔）
- 是否推荐 (y/n)
- 文章类型 (Article/Video)

### 方法 2: 手动创建

1. 在 `src/content/blog/` 目录下创建新的 `.md` 文件
2. 使用以下 frontmatter 格式：

```yaml
---
title: "文章标题"
pubDate: 2025-01-20
author: "作者名"
authImage: "/blog/image1.png"
image: "image1.png"
tags: ["标签1", "标签2", "标签3"]
summary: "文章摘要"
type: "Article"
featured: false
---
```

## 📁 文件结构

```
src/
├── content/
│   └── blog/
│       ├── article-1.md
│       ├── article-2.md
│       └── ...
├── data/
│   ├── videoData.json    # 视频数据（手动管理）
│   └── ...               # 其他数据文件
└── pages/
    └── blog/
        └── index.astro   # 博客页面（自动读取所有内容）
```

## 🔄 自动化特性

### ✅ 自动功能
- **自动排序**: 按发布日期自动排序
- **自动搜索**: 支持标题、摘要、标签搜索
- **自动分页**: 自动处理分页
- **自动标签**: 自动生成标签筛选
- **自动链接**: 自动生成访问链接

### 📊 内容类型支持
- **Markdown 文章**: 存储在 `src/content/blog/`
- **YouTube 视频**: 存储在 `src/data/videoData.json`
- **混合展示**: 文章和视频在同一页面展示

## 🎨 文章格式

### Frontmatter 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 文章标题 |
| `pubDate` | date | ✅ | 发布日期 (YYYY-MM-DD) |
| `author` | string | ✅ | 作者名 |
| `authImage` | string | ✅ | 作者头像路径 |
| `image` | string | ✅ | 文章图片 |
| `tags` | array | ✅ | 标签数组 |
| `summary` | string | ✅ | 文章摘要 |
| `type` | string | ✅ | 文章类型 (Article/Video) |
| `featured` | boolean | ❌ | 是否推荐 (默认 false) |

### 示例文章

```markdown
---
title: "OGSM 战略规划框架详解"
pubDate: 2024-01-20
author: "Strategy Team"
authImage: "/blog/image2.png"
image: "image2.png"
tags: ["战略规划", "OGSM", "管理"]
summary: "深入解析 OGSM 战略规划框架，掌握目标设定、策略制定、衡量指标和行动计划的核心要素。"
type: "Article"
featured: true
---

# OGSM 战略规划框架详解

文章内容...

## 总结

文章总结...
```

## 🔍 搜索功能

### 搜索范围
- ✅ 文章标题
- ✅ 文章摘要
- ✅ 文章标签
- ✅ 视频标题
- ✅ 视频描述
- ✅ 视频标签

### 搜索方式
1. **搜索框**: 直接输入关键词
2. **标签筛选**: 点击标签快速筛选
3. **URL 参数**: `?search=关键词`

## 📱 访问链接

### 文章链接
- 博客页面: `http://localhost:4321/blog`
- 单篇文章: `http://localhost:4321/content/[slug]`
- 标签筛选: `http://localhost:4321/blog?search=[标签]`

## 🛠️ 维护说明

### 添加新文章
1. 运行 `npm run create-blog`
2. 按提示输入信息
3. 编辑生成的 `.md` 文件
4. 保存后自动出现在博客页面

### 添加新视频
1. 编辑 `src/data/videoData.json`
2. 添加新的视频数据
3. 保存后自动出现在博客页面

### 删除内容
- **文章**: 删除对应的 `.md` 文件
- **视频**: 从 `videoData.json` 中移除

## 🎯 优势

### 相比旧系统
- ✅ **无需手动更新 JSON 文件**
- ✅ **自动类型检查**
- ✅ **更好的开发体验**
- ✅ **统一的文件管理**
- ✅ **自动排序和搜索**

### 开发效率
- ✅ **快速创建**: 一个命令创建文章
- ✅ **自动验证**: 类型安全的 frontmatter
- ✅ **即时预览**: 保存后立即生效
- ✅ **版本控制**: 所有内容都是文件

## 🚨 注意事项

1. **文件命名**: 使用英文和连字符，避免特殊字符
2. **日期格式**: 使用 `YYYY-MM-DD` 格式
3. **标签格式**: 使用数组格式，如 `["标签1", "标签2"]`
4. **图片路径**: 确保图片文件存在于 `public/` 目录

## 📞 需要帮助？

如果遇到问题，请检查：
1. 文件格式是否正确
2. frontmatter 语法是否正确
3. 图片路径是否存在
4. 开发服务器是否运行

---

🎉 **现在您可以专注于内容创作，而不是文件管理！** 