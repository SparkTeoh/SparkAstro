import siteData from "../data/siteData.json";

const person = {
  "@type": "Person",
  name: siteData.name,
  url: siteData.url,
  sameAs: siteData.socials.map((s) => s.url),
};

export default function jsonLDGenerator({ type, post, url }) {
  const data =
    type === "post" && post
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          headline: post.title,
          description: post.summary,
          author: person,
          datePublished: new Date(post.pubDate).toISOString(),
          keywords: post.tags,
          inLanguage: "zh-CN",
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteData.title,
          url: siteData.url,
          inLanguage: "zh-CN",
          author: person,
        };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}
