import type { DefaultTheme } from 'vitepress'

export type DocLocale = 'en' | 'zh'

const year = new Date().getFullYear()

/** Logo, site title, social — identical chrome on every page and locale */
export const sharedChrome: Pick<
  DefaultTheme.Config,
  'logo' | 'siteTitle' | 'socialLinks'
> = {
  logo: {
    src: '/img/sp-logo-trans.png',
    alt: 'Softprobe',
  },
  siteTitle: 'Softprobe Documentation',
  socialLinks: [
    { icon: 'github', link: 'https://github.com/softprobe/softprobe' },
    { icon: 'x', link: 'https://x.com/softprobeai' },
  ],
}

/** Top nav: same three slots (Home · Platform · CLI), locale-aware links */
export function navForLocale(locale: DocLocale): DefaultTheme.NavItem[] {
  const p = locale === 'zh' ? '/zh' : '/en'
  if (locale === 'zh') {
    return [
      { text: '首页', link: `${p}/` },
      { text: '平台', link: `${p}/platform/getting-started/quick-start` },
      { text: 'CLI 与自动化', link: `${p}/cli/guide/overview` },
    ]
  }
  return [
    { text: 'Home', link: `${p}/` },
    { text: 'Platform', link: `${p}/platform/getting-started/quick-start` },
    { text: 'CLI & agents', link: `${p}/cli/guide/overview` },
  ]
}

/** Footer: same columns and links, translated labels, locale-prefixed doc paths */
export function footerForLocale(locale: DocLocale): DefaultTheme.Footer {
  const p = locale === 'zh' ? '/zh' : '/en'
  if (locale === 'zh') {
    return {
      message: '零代码改动 · 全上下文可见性 · 成本优化',
      copyright: `Copyright © ${year} Softprobe`,
      links: [
        {
          title: '文档',
          items: [
            { text: '安装指南', link: `${p}/platform/deployment/installation` },
            { text: 'CLI 快速入门', link: `${p}/cli/guide/quickstart` },
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
    message: 'Zero code changes · Full-context visibility · Cost optimization',
    copyright: `Copyright © ${year} Softprobe`,
    links: [
      {
        title: 'Docs',
        items: [
          { text: 'Installation', link: `${p}/platform/deployment/installation` },
          { text: 'CLI quickstart', link: `${p}/cli/guide/quickstart` },
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

export function themeConfigForLocale(
  locale: DocLocale,
  sidebar: DefaultTheme.Sidebar
): DefaultTheme.Config {
  return {
    ...sharedChrome,
    nav: navForLocale(locale),
    sidebar,
    footer: footerForLocale(locale),
  }
}
