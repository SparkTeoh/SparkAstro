// 博客管理工具
// 用于创建新的 .astro 博客文章

import fs from 'fs';
import path from 'path';

/**
 * 创建新的 .astro 博客文章
 * @param {Object} blogData - 博客数据
 * @param {string} blogData.slug - 文章 slug
 * @param {string} blogData.title - 文章标题
 * @param {string} blogData.author - 作者
 * @param {string} blogData.summary - 摘要
 * @param {Array} blogData.tags - 标签数组
 * @param {string} blogData.type - 文章类型
 * @param {string} content - 文章内容
 */
export function createAstroBlogPost(blogData, content = '') {
  const { slug, title, author, summary, tags, type = 'Article' } = blogData;
  
  // 生成当前日期
  const pubDate = new Date().toISOString().split('T')[0];
  
  // 创建 .astro 文件内容
  const astroContent = `---
import BlogLayout from "../../layouts/BlogLayout.astro";
import Card from "../../components/ui/Card.astro";
import SectionTitle from "../../components/ui/SectionTitle.astro";
import ServiceCard from "../../components/ui/ServiceCard.astro";
import AccordionItem from "../../components/ui/AccordionItem.astro";

const blogData = {
  title: "${title}",
  pubDate: new Date("${pubDate}"),
  author: "${author}",
  authImage: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/jese-leos.png",
  image: "image1.png", // 请更换为实际图片
  tags: ${JSON.stringify(tags)},
  summary: "${summary}",
  type: "${type}"
};
---

<BlogLayout {...blogData}>
  <!-- 文章引言 -->
  <div class="mb-12">
    <p class="text-xl leading-relaxed text-gray-600 font-light">
      ${summary}
    </p>
  </div>

  <!-- 主要内容区域 -->
  <div class="space-y-12">
    <h2>主要内容标题</h2>
    
    <p>
      在这里添加你的文章内容。你可以使用现有的 UI 组件来丰富内容展示。
    </p>

    <!-- 使用卡片组件展示重点内容 -->
    <Card isUnderline={true}>
      <div class="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[45px]">
        <h3 class="text-2xl font-bold text-gray-900 mb-4">💡 重点提示</h3>
        <p class="text-lg text-gray-700">
          这里可以放置重要的信息或提示内容。
        </p>
      </div>
    </Card>

    <!-- 更多内容... -->
    ${content}
  </div>

  <!-- 总结部分 -->
  <div class="my-16">
    <Card isUnderline={true}>
      <div class="p-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-[45px] text-center">
        <h3 class="text-3xl font-bold text-gray-900 mb-6">📝 总结</h3>
        <p class="text-lg text-gray-700 mb-6 leading-relaxed">
          在这里添加文章的总结内容。
        </p>
      </div>
    </Card>
  </div>

</BlogLayout>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    console.log('${title} 文章已加载！');
  });
</script>`;

  // 文件路径
  const filePath = path.join(process.cwd(), 'src', 'pages', 'blog', `${slug}.astro`);
  
  // 写入文件
  fs.writeFileSync(filePath, astroContent, 'utf8');
  
  console.log(`✅ 博客文章已创建: ${filePath}`);
  
  return {
    filePath,
    blogData: {
      slug,
      title,
      pubDate,
      author,
      authImage: "https://flowbite.s3.amazonaws.com/blocks/marketing-ui/avatars/jese-leos.png",
      image: "image1.png",
      tags,
      summary,
      type,
      featured: false
    }
  };
}

/**
 * 更新博客数据文件
 * @param {Object} newBlogData - 新的博客数据
 */
export function updateBlogDataFile(newBlogData) {
  const dataFilePath = path.join(process.cwd(), 'src', 'data', 'astroBlogData.json');
  
  // 读取现有数据
  let existingData = [];
  if (fs.existsSync(dataFilePath)) {
    const fileContent = fs.readFileSync(dataFilePath, 'utf8');
    existingData = JSON.parse(fileContent);
  }
  
  // 添加新数据
  existingData.push(newBlogData);
  
  // 按日期排序
  existingData.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  
  // 写入文件
  fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2), 'utf8');
  
  console.log('✅ 博客数据文件已更新');
}

/**
 * 快速创建博客文章的便捷函数
 * @param {string} slug - 文章 slug
 * @param {string} title - 文章标题
 * @param {string} author - 作者
 * @param {string} summary - 摘要
 * @param {Array} tags - 标签数组
 * @param {string} type - 文章类型
 * @param {string} content - 自定义内容
 */
export function quickCreateBlog(slug, title, author, summary, tags, type = 'Article', content = '') {
  const blogData = { slug, title, author, summary, tags, type };
  
  // 创建 .astro 文件
  const result = createAstroBlogPost(blogData, content);
  
  // 更新数据文件
  updateBlogDataFile(result.blogData);
  
  console.log(`🎉 博客文章 "${title}" 创建完成！`);
  console.log(`📝 文件位置: ${result.filePath}`);
  console.log(`🔗 访问地址: /blog/${slug}`);
  
  return result;
}

// 使用示例：
// quickCreateBlog(
//   'my-new-blog-post',
//   '我的新博客文章',
//   'Spark',
//   '这是一篇关于新主题的精彩文章',
//   ['技术', '教程'],
//   'Tutorial'
// );