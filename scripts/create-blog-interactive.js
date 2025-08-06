#!/usr/bin/env node

import { quickCreateBlog } from '../src/utils/blogManager.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createBlogInteractive() {
  console.log('🎉 欢迎使用内容创建工具！\n');
  
  try {
    // 获取用户输入
    const slug = await question('请输入文章 slug (例如: my-new-article): ');
    const title = await question('请输入文章标题: ');
    const author = await question('请输入作者名: ');
    const summary = await question('请输入文章摘要: ');
    const tagsInput = await question('请输入标签 (用逗号分隔): ');
    const type = await question('请输入文章类型 (默认: Article): ') || 'Article';
    
    // 处理标签
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    // 确认信息
    console.log('\n📝 请确认文章信息:');
    console.log('Slug:', slug);
    console.log('标题:', title);
    console.log('作者:', author);
    console.log('摘要:', summary);
    console.log('标签:', tags.join(', '));
    console.log('类型:', type);
    
    const confirm = await question('\n确认创建文章？(y/N): ');
    
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      // 创建文章
      const result = quickCreateBlog(slug, title, author, summary, tags, type);
      
      console.log('\n🎉 文章创建成功！');
      console.log('📝 文件位置:', result.filePath);
      console.log('🔗 访问地址: /blog/' + result.blogData.slug);
      console.log('\n💡 提示: 现在你可以编辑文章内容了！');
    } else {
      console.log('❌ 已取消创建文章');
    }
    
  } catch (error) {
    console.error('❌ 创建文章时出错:', error);
  } finally {
    rl.close();
  }
}

// 运行交互式创建工具
createBlogInteractive(); 