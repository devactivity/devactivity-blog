export type Lang = 'en' | 'id';

export const langs: Lang[] = ['en', 'id'];

export function slugOf(id: string): string {
  return id.replace(/^(en|id)\//, '').replace(/\.mdx?$/, '');
}

export function postUrl(lang: Lang, slug: string): string {
  return lang === 'id' ? `/id/blog/${slug}/` : `/blog/${slug}/`;
}

export function blogIndexUrl(lang: Lang): string {
  return lang === 'id' ? '/id/blog/' : '/blog/';
}

export function homeUrl(lang: Lang): string {
  return lang === 'id' ? '/id/' : '/';
}

export function privacyUrl(lang: Lang): string {
  return lang === 'id' ? '/id/privacy/' : '/privacy/';
}

const en = {
  tagline: 'LEARN RUST IN PUBLIC',
  navHome: 'HOME',
  navPosts: 'POSTS',
  menu: 'MENU',
  close: 'CLOSE',
  themeDark: 'DARK',
  themeLight: 'LIGHT',
  heroKicker: 'BUILD IN PUBLIC',
  heroTitle: 'Rust notes, code, and videos.',
  heroDescA: 'Not an expert, just a learner. This blog mirrors my ',
  heroDescB: ' and ',
  heroDescC:
    ': step-by-step Rust related, apps and tools.',
  readPosts: 'READ POSTS',
  heroMeta: 'RUSTACEAN',
  latest: 'LATEST',
  newBadge: 'NEW',
  viewAll: 'VIEW ALL',
  feat1t: 'ARTICLES',
  feat1d: 'Long-form tutorials, technical notes, opinions and guides. Organized by tags.',
  feat2t: 'VIDEO CONTENTS',
  feat2d: 'Sourced from my existing content, with thumbnails, descriptions, topics, and embedded playback.',
  feat3t: 'CODE SNIPPETS',
  feat3d: 'Share reusable code, practical examples, and technical solutions.',
  blogTitle: 'POSTS',
  blogTotal: 'total',
  blogSub: 'Rust learning notes with companion videos. Select a card to read.',
  backToPosts: 'BACK TO POSTS',
  home: 'HOME',
  footerTitle: 'DEVACTIVITY - LEARN IN PUBLIC',
  footerSub: 'Not an expert, just a learner.',
  footerNo: 'V0.0.1',
  footerNote: 'Rust notes, code, and videos',
  privacyLink: 'PRIVACY',
  privacyTitle: 'Privacy Policy',
  privacyDesc: 'How DevActivity handles analytics, cookies, and third-party content.',
  cookieSettings: 'COOKIE SETTINGS',
  consentLabel: 'Cookie consent',
  consentText:
    'This site uses Google Analytics cookies to see which posts are read. They are only set if you accept, and you can change your choice anytime.',
  consentAccept: 'Accept',
  consentDecline: 'Decline',
  adLabel: 'Advertisement',
  videoBadge: 'VIDEO',
  liveNow: 'LIVE NOW',
  scheduled: 'LIVE SCHEDULED',
  soon: 'SOON',
  metaDesc:
    'DevActivity - learning Rust in public. Step-by-step Rust notes, code, and companion videos.',
  rssTitle: 'DevActivity - Learn Rust in Public',
  rssDesc: 'Rust notes, code, and videos. Not an expert, just a learner.',
  homeTitle: 'DevActivity - Learn Rust in Public',
  blogIndexTitle: 'Posts - DevActivity',
  ogLocale: 'en_US',
  inLanguage: 'en',
};

export type UIStrings = typeof en;

const id: UIStrings = {
  tagline: 'LEARN RUST IN PUBLIC',
  navHome: 'BERANDA',
  navPosts: 'ARTIKEL',
  menu: 'MENU',
  close: 'TUTUP',
  themeDark: 'GELAP',
  themeLight: 'TERANG',
  heroKicker: 'BUILD IN PUBLIC',
  heroTitle: 'Catatan, kode, dan video Rust.',
  heroDescA: 'Blog hasil belajar. Blog ini mengacu ke ',
  heroDescB: ' dan ',
  heroDescC:
    ' saya: Dasar pemograman Rust, tips, dan tools.',
  readPosts: 'BACA ARTIKEL',
  heroMeta: 'RUSTACEAN',
  latest: 'TERBARU',
  newBadge: 'BARU',
  viewAll: 'LIHAT SEMUA',
  feat1t: 'ARTIKEL',
  feat1d: 'Tutorial, catatan teknis, opini dan panduan. Diorganisir dengan tags.',
  feat2t: 'KONTEN VIDEO',
  feat2d: 'Sumber dari konten yg pernah dibuat, disertai gambar, deskripsi, topik dan pemutar video.',
  feat3t: 'POTONGAN KODE',
  feat3d: 'Berbagi kode-kode kecil, contoh praktikal, dan solusi teknis.',
  blogTitle: 'ARTIKEL',
  blogTotal: 'total',
  blogSub: 'Catatan belajar Rust disertai video. Pilih kartu untuk membaca.',
  backToPosts: 'KEMBALI KE ARTIKEL',
  home: 'BERANDA',
  footerTitle: 'DEVACTIVITY - LEARN IN PUBLIC',
  footerSub:
    'Bukan ahli, hanya belajar.',
  footerNo: 'V0.0.1',
  footerNote: 'Catatan, kode, dan video Rust',
  privacyLink: 'PRIVASI',
  privacyTitle: 'Kebijakan Privasi',
  privacyDesc: 'Cara DevActivity menangani analitik, cookie, dan konten pihak ketiga.',
  cookieSettings: 'PENGATURAN COOKIE',
  consentLabel: 'Persetujuan cookie',
  consentText:
    'Situs ini memakai cookie Google Analytics untuk mengetahui artikel mana yang dibaca. Cookie hanya dipasang jika Anda setuju, dan pilihan bisa diubah kapan saja.',
  consentAccept: 'Setuju',
  consentDecline: 'Tolak',
  adLabel: 'Iklan',
  videoBadge: 'VIDEO',
  liveNow: 'SEDANG LIVE',
  scheduled: 'LIVE TERJADWAL',
  soon: 'SEGERA',
  metaDesc:
    'DevActivity - belajar Rust dengan terbuka. Catatan Rust langkah demi langkah, kode, dan video.',
  rssTitle: 'DevActivity - Learn Rust in Public',
  rssDesc: 'Catatan, kode, dan video Rust. Bukan ahli, hanya belajar.',
  homeTitle: 'DevActivity - Learn Rust in Public',
  blogIndexTitle: 'Artikel - DevActivity',
  ogLocale: 'id_ID',
  inLanguage: 'id',
};

export const ui: Record<Lang, UIStrings> = { en, id };
