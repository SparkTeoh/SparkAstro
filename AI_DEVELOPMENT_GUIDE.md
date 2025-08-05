# SparkAstro 项目 AI 开发指南

## 项目概述
这是一个基于 Astro 的现代网站项目，使用 TypeScript 和 Tailwind CSS，具有完整的组件系统和自定义设计系统。

## AI 提示词模板

当你需要AI帮助开发Astro文件时，请使用以下提示词：

```
你好！我需要你帮我开发一个Astro文件。以下是我的项目信息：

**项目技术栈：**
- Astro (静态站点生成器)
- TypeScript
- Tailwind CSS (自定义配置)
- 组件化架构

**自定义颜色系统：**
请使用以下颜色类而不是标准Tailwind颜色：
- `text-primary` (主要文字颜色)
- `text-dark` (深色文字)
- `text-accent` (强调色文字)
- `bg-background` (背景色)
- `bg-gray` (灰色背景)
- `bg-accent` (强调色背景)
- `border-primary` (主要边框)
- `border-accent` (强调色边框)

**可用组件列表：**

1. **布局组件：**
   - `<MainLayout>` - 主要页面布局
   - `<BlogLayout>` - 博客页面布局

2. **UI组件：**
   - `<Card isUnderline={boolean}>` - 卡片组件
   - `<ServiceCard {...props}>` - 服务卡片
   - `<TeamCard {...props}>` - 团队成员卡片
   - `<AccordionItem index={number} title={string} description={string}>` - 手风琴项目
   - `<SectionTitle sectionTitle={string} description={string}>` - 章节标题

3. **图标组件：**
   - `<ChevronIcon />` - 箭头图标
   - `<BarsIcon />` - 菜单图标
   - `<MinusIcon />` - 减号图标

**组件导入示例：**
```astro
---
import MainLayout from '../layouts/MainLayout.astro';
import Card from '../components/ui/Card.astro';
import ServiceCard from '../components/ui/ServiceCard.astro';
import SectionTitle from '../components/ui/SectionTitle.astro';
---
```

**样式规范：**
- 使用 `rounded-[45px]` 作为主要圆角样式
- 间距使用 `space-y-*` 和 `gap-*`
- 响应式设计：`md:*` 和 `lg:*`
- 悬停效果：`hover:*` 和 `transition-*`

**代码示例格式：**
如果需要显示代码示例，请使用以下格式：
```astro
<Card isUnderline={true}>
  <div class="bg-slate-800 text-white p-6 rounded-[45px] border border-slate-600">
    <h4 class="text-white text-lg font-semibold mb-4">💻 代码示例</h4>
    <pre class="text-emerald-300 text-sm overflow-x-auto bg-slate-900 p-4 rounded-lg font-mono leading-relaxed">
      <code>
        // 你的代码内容
        // 记住使用 HTML 实体编码：&#123; 和 &#125; 代替 { }
      </code>
    </pre>
  </div>
</Card>
```

**博客页面最佳实践：**
1. **数据传递方式**：使用统一的 `blogData` 对象和展开运算符
2. **内容结构**：使用语义化的 HTML 标签和清晰的章节划分
3. **交互功能**：添加平滑滚动、按钮效果等用户体验增强功能

**请帮我创建：** [在这里描述你需要的具体功能]

**要求：**
1. 使用上述组件和颜色系统
2. 确保响应式设计
3. 遵循项目的设计风格
4. 包含适当的TypeScript类型定义
5. 添加必要的交互功能
```

## 详细教程

### 1. 项目结构理解

```
src/
├── components/          # 可复用组件
│   ├── ui/             # UI组件
│   ├── sections/       # 页面区块组件
│   └── Icons/          # 图标组件
├── layouts/            # 布局模板
├── pages/              # 页面文件
├── data/               # 数据文件
└── styles/             # 样式文件
```

### 2. 组件使用指南

#### Card 组件
```astro
<Card isUnderline={true}>
  <div class="p-6">
    <!-- 内容 -->
  </div>
</Card>
```

#### ServiceCard 组件
```astro
<ServiceCard 
  title="服务标题"
  description="服务描述"
  icon="icon-name"
/>
```

#### SectionTitle 组件
```astro
<SectionTitle 
  sectionTitle="章节标题" 
  description="章节描述"
/>
```

### 3. 博客页面开发最佳实践

#### 3.1 数据传递方式

**✅ 推荐写法：**
```astro
---
import BlogLayout from '../../layouts/BlogLayout.astro';

// 统一的博客数据对象
const blogData = {
  title: "文章标题",
  pubDate: new Date(),
  author: "作者名",
  authImage: "/blog/image1.png",
  image: "image1.png",
  tags: ["标签1", "标签2"],
  summary: "文章摘要",
  type: "文章类型"
};

// 额外的页面信息
const pageInfo = {
  description: "详细描述",
  additionalData: "其他数据"
};
---

<BlogLayout {...blogData}>
  <!-- 页面内容 -->
</BlogLayout>
```

**❌ 避免的写法：**
```astro
<BlogLayout 
  title={pageMeta.title} 
  pubDate={new Date()}
  author="作者名"
  authImage="/blog/image1.png"
  image="image1.png"
  tags={["标签1", "标签2"]}
  summary={pageMeta.description}
  type="文章类型"
>
```

#### 3.2 内容结构最佳实践

**章节划分：**
```astro
<main class="space-y-24">
  <!-- 引言部分 -->
  <section id="introduction" class="scroll-mt-24">
    <SectionTitle sectionTitle="引言" description="章节描述" />
    <!-- 内容 -->
  </section>

  <!-- 主要内容 -->
  <section id="main-content" class="scroll-mt-24">
    <SectionTitle sectionTitle="主要内容" description="章节描述" />
    <!-- 内容 -->
  </section>

  <!-- 总结部分 -->
  <section id="conclusion" class="scroll-mt-24">
    <SectionTitle sectionTitle="总结" description="章节描述" />
    <!-- 内容 -->
  </section>
</main>
```

**导航结构：**
```astro
<nav class="bg-background/80 backdrop-blur-md sticky top-4 z-50 py-3 my-12 rounded-full border border-primary/20 max-w-2xl mx-auto">
  <ul class="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 px-4">
    <li><a href="#introduction" class="text-primary hover:text-accent transition-colors">引言</a></li>
    <li><a href="#main-content" class="text-primary hover:text-accent transition-colors">主要内容</a></li>
    <li><a href="#conclusion" class="text-primary hover:text-accent transition-colors">总结</a></li>
  </ul>
</nav>
```

#### 3.3 交互功能最佳实践

**平滑滚动：**
```astro
<script>
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
</script>
```

**按钮交互效果：**
```astro
<button class="bg-accent text-white px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-colors interactive-btn">
  点击按钮
</button>

<style>
  .interactive-btn {
    transform: scale(1);
    transition: transform 0.2s ease;
  }
  
  .interactive-btn:hover {
    transform: scale(1.05);
  }
  
  .interactive-btn:active {
    transform: scale(0.95);
  }
</style>
```

#### 3.4 数据组织最佳实践

**循环渲染数据：**
```astro
---
// 用于循环渲染的数据，使代码更简洁
const features = {
  intro: [
    { icon: '🧠', title: '功能1', text: '描述1' },
    { icon: '⚠️', title: '功能2', text: '描述2' },
    { icon: '👥', title: '功能3', text: '描述3' }
  ],
  tools: [
    { icon: '❓', title: '工具1', text: '描述1' },
    { icon: '🗣️', title: '工具2', text: '描述2' }
  ]
};
---

<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
  {features.intro.map(feature => (
    <div class="p-6 text-center bg-gray rounded-[45px] h-full border border-primary/20 transition-all hover:border-accent hover:shadow-lg">
      <div class="text-4xl mb-4">{feature.icon}</div>
      <h3 class="text-lg font-bold text-accent">{feature.title}</h3>
      <p class="text-dark mt-2 text-sm leading-relaxed">{feature.text}</p>
    </div>
  ))}
</div>
```

### 4. 数据处理

项目使用JSON文件存储数据，位于 `src/data/` 目录：

```astro
---
import siteData from '../data/siteData.json';
import clientData from '../data/clientData.json';

// 使用数据
const { services } = siteData;
---
```

### 5. 样式最佳实践

#### 颜色使用
```css
/* 正确 ✅ */
text-primary
text-dark
bg-accent

/* 错误 ❌ */
text-gray-900
text-blue-500
bg-red-100
```

#### 布局模式
```astro
<!-- 网格布局 -->
<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
  <!-- 内容 -->
</div>

<!-- 弹性布局 -->
<div class="flex flex-col md:flex-row gap-6">
  <!-- 内容 -->
</div>
```

### 6. TypeScript 集成

```astro
---
// 定义接口
export interface Props {
  title: string;
  description?: string;
  items: Array<{
    name: string;
    value: string;
  }>;
}

// 获取props
const { title, description, items } = Astro.props;
---
```

### 7. 交互功能

```astro
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // 你的JavaScript代码
    console.log('页面已加载');
  });
</script>
```

## 博客页面开发模板

```astro
---
import BlogLayout from '../../layouts/BlogLayout.astro';
import SectionTitle from '../../components/ui/SectionTitle.astro';
import Card from '../../components/ui/Card.astro';

// 博客数据
const blogData = {
  title: "文章标题",
  pubDate: new Date(),
  author: "作者名",
  authImage: "/blog/image1.png",
  image: "image1.png",
  tags: ["标签1", "标签2"],
  summary: "文章摘要",
  type: "文章类型"
};

// 页面内容数据
const contentData = {
  sections: [
    { id: "intro", title: "引言", description: "章节描述" },
    { id: "main", title: "主要内容", description: "章节描述" },
    { id: "conclusion", title: "总结", description: "章节描述" }
  ]
};
---

<BlogLayout {...blogData}>
  <!-- 页面导航 -->
  <nav class="bg-background/80 backdrop-blur-md sticky top-4 z-50 py-3 my-12 rounded-full border border-primary/20 max-w-2xl mx-auto">
    <ul class="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 px-4">
      {contentData.sections.map(section => (
        <li>
          <a href={`#${section.id}`} class="text-primary hover:text-accent transition-colors">
            {section.title}
          </a>
        </li>
      ))}
    </ul>
  </nav>

  <!-- 主要内容 -->
  <main class="space-y-24">
    {contentData.sections.map(section => (
      <section id={section.id} class="scroll-mt-24">
        <SectionTitle 
          sectionTitle={section.title} 
          description={section.description} 
        />
        <div class="mt-12">
          <!-- 章节内容 -->
        </div>
      </section>
    ))}
  </main>
</BlogLayout>

<script>
  // 平滑滚动
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
</script>
```

## 常见问题解答

### Q: 如何添加新的页面？
A: 在 `src/pages/` 目录下创建 `.astro` 文件，使用适当的布局组件。

### Q: 如何自定义组件？
A: 在 `src/components/` 相应目录下创建新组件，遵循现有的命名和结构规范。

### Q: 如何处理响应式设计？
A: 使用 Tailwind 的响应式前缀：`sm:`、`md:`、`lg:`、`xl:`。

### Q: 如何添加动画效果？
A: 使用 Tailwind 的 `transition-*` 类和 `hover:*` 状态。

### Q: 博客页面应该使用哪种数据传递方式？
A: 推荐使用统一的 `blogData` 对象和展开运算符 `{...blogData}`，这样代码更简洁、可维护性更好。

### Q: 如何组织博客页面的内容结构？
A: 使用语义化的章节划分，添加页面内导航，确保良好的用户体验。

## 示例：创建新页面

```astro
---
import MainLayout from '../layouts/MainLayout.astro';
import SectionTitle from '../components/ui/SectionTitle.astro';
import Card from '../components/ui/Card.astro';

// 页面数据
const pageData = {
  title: "页面标题",
  description: "页面描述"
};
---

<MainLayout title={pageData.title} description={pageData.description}>
  <div class="container mx-auto px-4 py-16">
    <SectionTitle 
      sectionTitle={pageData.title}
      description={pageData.description}
    />
    
    <div class="mt-12">
      <Card isUnderline={true}>
        <div class="p-8 bg-background rounded-[45px]">
          <h3 class="text-2xl font-bold text-primary mb-4">内容标题</h3>
          <p class="text-dark leading-relaxed">
            页面内容...
          </p>
        </div>
      </Card>
    </div>
  </div>
</MainLayout>
```

## 注意事项

1. **始终使用项目的自定义颜色系统**
2. **保持组件的一致性和可复用性**
3. **确保TypeScript类型安全**
4. **遵循响应式设计原则**
5. **使用语义化的HTML结构**
6. **添加适当的无障碍功能**
7. **博客页面使用统一的 `blogData` 对象和展开运算符**
8. **合理组织页面内容结构，添加导航和交互功能**

---

使用这个指南，AI将能够更好地理解你的项目结构，并创建符合项目规范的Astro文件。