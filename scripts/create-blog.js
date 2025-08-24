#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createBlogPost() {
  console.log('📝 创建新的内容文章\n');

  // 获取用户输入
  const title = await question('文章标题: ');
  const summary = await question('文章摘要: ');
  const author = await question('作者: ');
  const tagsInput = await question('标签 (用逗号分隔): ');
  const featured = await question('是否推荐? (y/n): ');
  const type = await question('文章类型 (Article/Video): ');

  // 处理标签
  const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);

  // 生成 slug
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // 生成当前日期
  const now = new Date();
  const pubDate = now.toISOString().split('T')[0];

  // 创建 frontmatter
  const frontmatter = `---
title: "${title}"
pubDate: ${pubDate}
author: "${author}"
tags: ${JSON.stringify(tags)}
summary: "${summary}"
type: "${type}"
featured: ${featured.toLowerCase() === 'y'}
---

# ${title}

${summary}

## 内容

在这里添加您的文章内容...

## 总结

文章总结...
`;

  // 创建文件路径
  const contentDir = path.join(__dirname, '..', 'src', 'content', 'blog', 'MDFile');
  const filePath = path.join(contentDir, `${slug}.md`);

  // 确保MDFile目录存在
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }

  // 检查文件是否已存在
  if (fs.existsSync(filePath)) {
    console.log('❌ 文件已存在，请使用不同的标题');
    rl.close();
    return;
  }

  // 写入文件
  try {
    fs.writeFileSync(filePath, frontmatter, 'utf8');
    console.log(`\n✅ 文章创建成功！`);
    console.log(`📁 文件路径: ${filePath}`);
    console.log(`🔗 访问链接: http://localhost:4321/blog/${slug}`);
    console.log(`\n💡 提示:`);
    console.log(`   - 编辑文件: ${filePath}`);
    console.log(`   - 文章会自动出现在内容中心`);
    console.log(`   - 无需手动更新任何 JSON 文件`);
  } catch (error) {
    console.error('❌ 创建文件失败:', error.message);
  }

  rl.close();
}

// 运行脚本
createBlogPost().catch(console.error); 