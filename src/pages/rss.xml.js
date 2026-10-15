import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { postUrl, slugOf, ui } from '../i18n';

export async function GET(context) {
  const t = ui.en;
  const posts = (await getCollection('blog', ({ data }) => !data.draft && data.lang === 'en'))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  return rss({
    title: t.rssTitle,
    description: t.rssDesc,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: postUrl('en', slugOf(post.id)),
    })),
  });
}
