export const I18N = {
  nav: {
    blog: { zh: '博客', en: 'Blog' },
    projects: { zh: '项目', en: 'Projects' },
    about: { zh: '关于', en: 'About' },
  },
  hero: {
    tagline: { zh: '嵌入式 · AI', en: 'Embedded · AI' },
    intro: {
      zh: '在这里记录折腾、复盘，和正在做的事。',
      en: "Tinkering, reviews, and things I'm working on.",
    },
  },
  section: {
    recent: { zh: '最近', en: 'Recent' },
    blog: { zh: '博客', en: 'Blog' },
    projects: { zh: '项目', en: 'Projects' },
  },
  kind: {
    article: { zh: '文章', en: 'Article' },
    essay: { zh: '随笔', en: 'Essay' },
    project: { zh: '项目', en: 'Project' },
  },
  empty: {
    noContent: { zh: '还没有内容。', en: 'No content yet.' },
    comingSoon: { zh: '敬请期待', en: 'Coming soon' },
    toAdd: { zh: '待添加', en: 'To be added' },
  },
  filter: {
    all: { zh: '全部', en: 'All' },
    article: { zh: '文章', en: 'Articles' },
    essay: { zh: '随笔', en: 'Essays' },
  },
  guestbook: {
    title: { zh: '留言', en: 'Guestbook' },
    intro: { zh: '匿名留言，留下你想说的话。', en: 'Leave an anonymous message.' },
    pending: {
      zh: '留言功能即将上线（Waline 后端部署中）。',
      en: 'Comments coming soon (Waline backend deploying).',
    },
  },
  room: {
    board: { zh: '留言板', en: 'Message Board' },
    ep: { zh: 'EP小车', en: 'EP Robot' },
    home: { zh: '主页', en: 'Home' },
    room: { zh: '房间', en: 'Room' },
  },
  aria: {
    lang: { zh: '切换中英文', en: 'Switch language' },
    theme: { zh: '切换亮暗模式', en: 'Toggle theme' },
    prev: { zh: '上一页', en: 'Previous' },
    next: { zh: '下一页', en: 'Next' },
  },
} as const;

export type I18NKey = string;

export function getI18N(key: string): { zh: string; en: string } {
  const parts = key.split('.');
  let obj: any = I18N;
  for (const p of parts) {
    obj = obj?.[p];
  }
  return obj ?? { zh: key, en: key };
}
