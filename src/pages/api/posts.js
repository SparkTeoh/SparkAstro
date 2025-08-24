import videoData from '../../content/blog/videoData.json';


export async function GET({ url }) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const itemsPerPage = 12;

  // 获取并处理 Markdown 文章
  const mdPostImports = import.meta.glob('/src/content/blog/MDFile/*.{md,mdx}');
  const mdPosts = await Promise.all(
    Object.values(mdPostImports).map(importer => importer())
  );

  const allMarkdownArticles = mdPosts.map(post => ({
    ...post.frontmatter,
    url: post.url,
    isExternal: false,
    contentType: 'markdown',
  }));

  // 处理视频数据
  const allVideos = videoData.featuredVideos.map(video => ({
    ...video,
    type: 'Video',
    contentType: 'youtube',
    pubDate: video.publishDate,
    author: 'Spark Liang',
    isExternal: true,
    url: `https://www.youtube.com/watch?v=${video.videoId}`,
  }));

  // 处理 Astro 文章
  const astroPostImports = import.meta.glob('/src/content/blog/AstroFile/*.astro');
  const astroPosts = await Promise.all(
    Object.entries(astroPostImports)
      .filter(([path, _]) => !path.endsWith('index.astro'))
      .map(([_, importer]) => importer())
  );

  const allAstroArticles = astroPosts.map(post => {
    const data = post.frontmatter || post.blogData;
    if (!data) {
      console.error(`No frontmatter or blogData found in ${post.url}`);
      return null;
    }
    return {
      ...data,
      url: post.url,
      summary: data.summary || '',
      contentType: 'astro',
      isExternal: false,
    };
  }).filter(p => p !== null);

  // 合并并排序所有内容
  const allContent = [...allMarkdownArticles, ...allVideos, ...allAstroArticles].sort((a, b) => new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf());

  // 调试代码：找出没有标题的内容
  const problematicContent = allContent.filter(item => !item.title);
  if (problematicContent.length > 0) {
    console.log('--- Found Content Without Titles ---');
    problematicContent.forEach(p => {
      console.log(`URL: ${p.url}, Type: ${p.contentType}`);
      console.log('Data:', p);
    });
    console.log('------------------------------------');
  }

  const totalPages = Math.ceil(allContent.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContent = allContent.slice(startIndex, endIndex);

  return new Response(JSON.stringify({ posts: paginatedContent, totalPages }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}