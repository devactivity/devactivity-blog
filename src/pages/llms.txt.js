import { getCollection } from 'astro:content';
import { postUrl, slugOf } from '../i18n';

export async function GET({ site }) {
  const base = (site ?? new URL('https://dev-blog.pages.dev')).toString().replace(/\/$/, '');
  const all = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  const section = (lang) => all
    .filter((p) => p.data.lang === lang)
    .map((p) => {
      const date = p.data.pubDate.toISOString().slice(0, 10);
      const video = p.data.youtubeId
        ? ` (video: https://www.youtube.com/watch?v=${p.data.youtubeId})`
        : p.data.tiktokId
          ? ` (tiktok: https://www.tiktok.com/video/${p.data.tiktokId})`
          : '';
      return `- [${p.data.title}](${base}${postUrl(lang, slugOf(p.id))}) - ${p.data.description} [${date}]${video}`;
    });

  const lines = [
    '# DevActivity',
    '',
    '> Learning Rust in public. Step-by-step Rust notes, code, and companion videos. Not an expert, just a learner.',
    '> Belajar Rust secara terbuka. Catatan Rust langkah demi langkah, kode, dan video pendamping.',
    '',
    `- Web (EN): ${base}/`,
    `- Web (ID): ${base}/id/`,
    '- YouTube: https://www.youtube.com/@devactivity',
    '- GitHub: https://github.com/devactivity',
    `- RSS (EN): ${base}/rss.xml`,
    `- RSS (ID): ${base}/id/rss.xml`,
    '',
    '## Posts (EN)',
    '',
    ...section('en'),
    '',
    '## Postingan (ID)',
    '',
    ...section('id'),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
