import type { DefaultTheme } from 'vitepress'

export type DocLocale = 'en' | 'zh'

const year = new Date().getFullYear()

/** Logo, site title, social — identical chrome on every page and locale */
export const sharedChrome: Pick<
  DefaultTheme.Config,
  'logo' | 'siteTitle' | 'socialLinks'
> = {
  logo: {
    light: '/img/softprobe-wordmark.svg',
    dark: '/img/softprobe-wordmark-dark.svg',
    alt: 'Softprobe',
  },
  // Wordmark already includes the name; keep title empty to avoid duplication.
  siteTitle: false,
  socialLinks: [
    { icon: 'github', link: 'https://github.com/softprobe/thelake' },
    { icon: 'x', link: 'https://x.com/softprobeai' },
  ],
}

/** Top nav: Agent QA first, then Evaluation · Testing · Observability */
export function navForLocale(locale: DocLocale): DefaultTheme.NavItem[] {
  const p = locale === 'zh' ? '/zh' : '/en'
  if (locale === 'zh') {
    return [
      { text: '首页', link: `${p}/` },
      { text: '流量回放测试', link: `${p}/testing/`, activeMatch: '/zh/testing/' },
      { text: 'Agent QA', link: `${p}/agent-qa/`, activeMatch: '/zh/agent-qa/' },
      { text: 'Agent Evaluation', link: `${p}/evaluation/`, activeMatch: '/zh/evaluation/' },
      { text: '业务观测', link: `${p}/platform/getting-started/quick-start`, activeMatch: '/zh/platform/' },
    ]
  }
  return [
    { text: 'Home', link: `${p}/` },
    { text: 'Replay Testing', link: `${p}/testing/`, activeMatch: '/en/testing/' },
    { text: 'Agent QA', link: `${p}/agent-qa/`, activeMatch: '/en/agent-qa/' },
    { text: 'Agent Evaluation', link: `${p}/evaluation/`, activeMatch: '/en/evaluation/' },
    { text: 'Business Observability', link: `${p}/platform/getting-started/quick-start`, activeMatch: '/en/platform/' },
  ]
}

/** Footer: same columns and links, translated labels, locale-prefixed doc paths */
export function footerForLocale(locale: DocLocale): DefaultTheme.Footer {
  const p = locale === 'zh' ? '/zh' : '/en'
  if (locale === 'zh') {
    return {
      message: '捕获 Session · 审查 Steps · 改进关键所在',
      copyright: `Copyright © ${year} Softprobe`,
      links: [
        {
          title: '文档',
          items: [
            { text: '流量回放测试', link: `${p}/testing/` },
            { text: '部署平台', link: `${p}/testing/installation/deployment` },
            { text: '回放报告', link: `${p}/testing/replay-report` },
            { text: '命令参考', link: `${p}/testing/commands/` },
            { text: 'Agent QA', link: `${p}/agent-qa/` },
            { text: 'Agent Evaluation', link: `${p}/evaluation/` },
          ],
        },
        {
          title: '社区',
          items: [{ text: 'Twitter', link: 'https://x.com/softprobeai' }],
        },
        {
          title: '更多',
          items: [
            { text: 'SP-Istio GitHub', link: 'https://github.com/softprobe/softprobe' },
            { text: 'SESSIFY GitHub', link: 'https://github.com/softprobe/sessify' },
          ],
        },
      ],
    }
  }
  return {
    message: 'Capture Sessions · Review Steps · Improve what matters',
    copyright: `Copyright © ${year} Softprobe`,
    links: [
        {
          title: 'Docs',
          items: [
            { text: 'Replay Testing', link: `${p}/testing/` },
            { text: 'Deploy the platform', link: `${p}/testing/installation/deployment` },
            { text: 'Replay report', link: `${p}/testing/replay-report` },
            { text: 'Command reference', link: `${p}/testing/commands/` },
            { text: 'Agent QA', link: `${p}/agent-qa/` },
            { text: 'Agent Evaluation', link: `${p}/evaluation/` },
          ],
        },
      {
        title: 'Community',
        items: [{ text: 'Twitter', link: 'https://x.com/softprobeai' }],
      },
      {
        title: 'More',
        items: [
          { text: 'SP-Istio GitHub', link: 'https://github.com/softprobe/softprobe' },
          { text: 'SESSIFY GitHub', link: 'https://github.com/softprobe/sessify' },
        ],
      },
    ],
  }
}

/** Local (offline) search — MiniSearch index, no external service. Labels per locale. */
function searchForLocale(locale: DocLocale): DefaultTheme.Config['search'] {
  if (locale === 'zh') {
    return {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                displayDetails: '显示详情',
                resetButtonTitle: '清除查询',
                backButtonTitle: '关闭搜索',
                noResultsText: '未找到相关结果',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
      },
    }
  }
  return { provider: 'local' }
}

/** GitHub "edit this page" link — points at the source file on the default branch. */
function editLinkForLocale(locale: DocLocale): DefaultTheme.EditLink {
  return {
    pattern: 'https://github.com/softprobe/document-website/edit/main/:path',
    text: locale === 'zh' ? '在 GitHub 上编辑本页' : 'Edit this page on GitHub',
  }
}

export function themeConfigForLocale(
  locale: DocLocale,
  sidebar: DefaultTheme.Sidebar
): DefaultTheme.Config {
  const zh = locale === 'zh'
  return {
    ...sharedChrome,
    nav: navForLocale(locale),
    sidebar,
    footer: footerForLocale(locale),
    search: searchForLocale(locale),
    editLink: editLinkForLocale(locale),
    lastUpdated: {
      text: zh ? '最近更新' : 'Last updated',
    },
    docFooter: {
      prev: zh ? '上一页' : 'Previous page',
      next: zh ? '下一页' : 'Next page',
    },
    outline: {
      level: [2, 3],
      label: zh ? '本页目录' : 'On this page',
    },
    notFound: {
      title: zh ? '页面不存在' : 'Page not found',
      quote: zh
        ? '这个页面可能已迁移或尚未翻译。'
        : 'This page may have moved, or may not be translated yet.',
      linkText: zh ? '返回首页' : 'Back to home',
      linkLabel: zh ? '返回首页' : 'Back to home',
    },
    darkModeSwitchLabel: zh ? '主题' : 'Appearance',
    lightModeSwitchTitle: zh ? '切换到浅色模式' : 'Switch to light theme',
    darkModeSwitchTitle: zh ? '切换到深色模式' : 'Switch to dark theme',
    sidebarMenuLabel: zh ? '菜单' : 'Menu',
    returnToTopLabel: zh ? '返回顶部' : 'Return to top',
    langMenuLabel: zh ? '切换语言' : 'Change language',
  }
}
