import { getCollection } from 'astro:content';

export async function GET({ site }) {
  const base = (site ?? new URL('https://dev-blog.pages.dev')).toString().replace(/\/$/, '');
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const lines = [
    '# DevActivity',
    '',
    '> Learning Rust in public. Step-by-step Rust notes, code, and companion videos. Not an expert, just a learner.',
    '',
    `- Web: ${base}/`,
    '- YouTube: https://www.youtube.com/@devactivity',
    '- GitHub: https://github.com/devactivity',
    `- RSS: ${base}/rss.xml`,
    '',
    '## Posts',
    '',
    ...posts.map((p) => {
      const slug = p.id.replace(/\.mdx?$/, '');
      const date = p.data.pubDate.toISOString().slice(0, 10);
      const video = p.data.youtubeId
        ? ` (video: https://www.youtube.com/watch?v=${p.data.youtubeId})`
        : p.data.tiktokId
          ? ` (tiktok: https://www.tiktok.com/video/${p.data.tiktokId})`
          : '';
      return `- [${p.data.title}](${base}/blog/${slug}/) - ${p.data.description} [${date}]${video}`;
    }),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
