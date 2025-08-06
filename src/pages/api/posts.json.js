import { getCollection } from 'astro:content';

export async function get({ url }) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const itemsPerPage = 12;

  const allPosts = await getCollection('blog');
  const sortedPosts = allPosts.sort((a, b) => new Date(b.data.pubDate).valueOf() - new Date(a.data.pubDate).valueOf());

  const totalPages = Math.ceil(sortedPosts.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const posts = sortedPosts.slice(startIndex, endIndex);

  const postData = posts.map(post => ({
    url: `/blog/${post.slug}/`,
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    author: post.data.author,
    image: post.data.image,
    tags: post.data.tags,
    type: post.data.type,
  }));

  return new Response(JSON.stringify({ posts: postData, totalPages }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}