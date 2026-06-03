import { defineConfig } from 'vitepress'

const cliSidebar = [
  {
    text: 'For AI agents',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/cli/guide/overview' },
      { text: 'Output contract', link: '/en/cli/guide/output-contract' },
      { text: 'Versioning', link: '/en/cli/guide/versioning' },
    ],
  },
  {
    text: 'Guide',
    items: [
      { text: 'Introduction', link: '/en/cli/guide/introduction' },
      { text: 'Installation', link: '/en/cli/guide/installation' },
      { text: 'Quickstart', link: '/en/cli/guide/quickstart' },
      { text: 'Authentication', link: '/en/cli/guide/authentication' },
      { text: 'CLI configuration (XDG)', link: '/en/cli/guide/configuration' },
      { text: 'spcode CLI', link: '/en/cli/guide/spcode' },
      { text: 'Concepts', link: '/en/cli/guide/concepts' },
    ],
  },
  {
    text: 'Commands',
    items: [
      { text: 'Overview', link: '/en/cli/commands/' },
      {
        text: 'Lifecycle',
        collapsed: false,
        items: [
          { text: 'setup', link: '/en/cli/commands/setup' },
          { text: 'agent', link: '/en/cli/commands/agent' },
          { text: 'diagnose', link: '/en/cli/commands/diagnose' },
        ],
      },
      {
        text: 'Platform',
        collapsed: false,
        items: [
          { text: 'config', link: '/en/cli/commands/config' },
          { text: 'auth', link: '/en/cli/commands/auth' },
          { text: 'app', link: '/en/cli/commands/app' },
          { text: 'policy', link: '/en/cli/commands/policy' },
          { text: 'replay', link: '/en/cli/commands/replay' },
          { text: 'health', link: '/en/cli/commands/health' },
        ],
      },
      {
        text: 'Investigation',
        collapsed: false,
        items: [
          { text: 'record', link: '/en/cli/commands/record' },
          { text: 'trace', link: '/en/cli/commands/trace' },
          { text: 'replay case', link: '/en/cli/commands/replay-case' },
          { text: 'replay diff & logs', link: '/en/cli/commands/replay-diff' },
          { text: 'extraction-rule', link: '/en/cli/commands/extraction-rule' },
        ],
      },
      {
        text: 'Administration',
        collapsed: true,
        items: [
          { text: 'group & grant', link: '/en/cli/commands/group' },
          { text: 'system & task', link: '/en/cli/commands/system' },
          { text: 'ops', link: '/en/cli/commands/ops' },
          { text: 'config legacy', link: '/en/cli/commands/config-legacy' },
        ],
      },
    ],
  },
  {
    text: 'Policies',
    items: [{ text: 'YAML policies', link: '/en/cli/policies/' }],
  },
  {
    text: 'Examples',
    items: [
      { text: 'Diagnose replay failure', link: '/en/cli/examples/agent-diagnose-replay' },
      { text: 'Attr → trace lookup', link: '/en/cli/examples/agent-attr-trace-lookup' },
      { text: 'CI policy gate', link: '/en/cli/examples/ci-policy-gate' },
      { text: 'GitOps policies', link: '/en/cli/examples/gitops-policies' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'API mapping', link: '/en/cli/reference/api-mapping' },
      { text: 'JSON types', link: '/en/cli/reference/json-types' },
      { text: 'Exit codes', link: '/en/cli/reference/exit-codes' },
    ],
  },
]

const platformSidebarEn = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Quick Start', link: '/en/platform/getting-started/quick-start' },
      { text: 'Account Setup', link: '/en/platform/getting-started/account-setup' },
    ],
  },
  {
    text: 'Deployment',
    items: [
      { text: 'Production Installation', link: '/en/platform/deployment/installation' },
      { text: 'GKE Autopilot + Istio', link: '/en/platform/deployment/GKE-Autopilot-Istio-Installation-Guide' },
    ],
  },
  {
    text: 'Production',
    items: [{ text: 'Dashboard User Guide', link: '/en/platform/production/dashboard-user-guide' }],
  },
  {
    text: 'Configuration',
    items: [{ text: 'Platform configuration (Istio)', link: '/en/platform/configuration/config' }],
  },
  {
    text: 'Advanced Guides',
    items: [
      { text: 'Core Concepts', link: '/en/platform/advanced-guides/concepts' },
      { text: 'Agent Architecture', link: '/en/platform/advanced-guides/agent-architecture' },
    ],
  },
  {
    text: 'Billing',
    items: [
      { text: 'Pricing', link: '/en/platform/billing/pricing' },
      { text: 'Subscriptions', link: '/en/platform/billing/subscriptions' },
    ],
  },
  { text: 'SESSIFY', link: '/en/platform/sessify' },
  {
    text: 'Support',
    items: [{ text: 'FAQ', link: '/en/platform/support/faq' }],
  },
]

const platformSidebarZh = [
  {
    text: '快速开始',
    items: [
      { text: '快速入门', link: '/zh/platform/getting-started/quick-start' },
      { text: '账户设置', link: '/zh/platform/getting-started/account-setup' },
    ],
  },
  {
    text: '部署',
    items: [
      { text: '生产环境安装', link: '/zh/platform/deployment/installation' },
      { text: 'GKE Autopilot + Istio', link: '/zh/platform/deployment/GKE-Autopilot-Istio-Installation-Guide' },
    ],
  },
  {
    text: '生产使用',
    items: [{ text: '仪表盘用户指南', link: '/zh/platform/production/dashboard-user-guide' }],
  },
  {
    text: '配置',
    items: [{ text: '平台配置（Istio）', link: '/zh/platform/configuration/config' }],
  },
  {
    text: '进阶指南',
    items: [
      { text: '核心概念', link: '/zh/platform/advanced-guides/concepts' },
      { text: 'Agent 架构', link: '/zh/platform/advanced-guides/agent-architecture' },
    ],
  },
  {
    text: '计费',
    items: [
      { text: '定价', link: '/zh/platform/billing/pricing' },
      { text: '订阅', link: '/zh/platform/billing/subscriptions' },
    ],
  },
  { text: 'SESSIFY', link: '/zh/platform/sessify' },
  {
    text: '支持',
    items: [{ text: '常见问题', link: '/zh/platform/support/faq' }],
  },
]

function sidebarForLocale(locale: 'en' | 'zh') {
  const platform = locale === 'zh' ? platformSidebarZh : platformSidebarEn
  const cliLabel = locale === 'zh' ? 'CLI 与自动化' : 'CLI & agents'
  const platformLabel = locale === 'zh' ? '平台' : 'Platform'
  const platformBase = locale === 'zh' ? '/zh/platform/' : '/en/platform/'
  const cliBase = locale === 'zh' ? '/zh/cli/' : '/en/cli/'
  return {
    [platformBase]: platform,
    [cliBase]: cliSidebar,
    '/': [
      { text: platformLabel, items: platform },
      { text: cliLabel, items: cliSidebar },
    ],
  }
}

const navEn = [
  { text: 'Home', link: '/en/' },
  { text: 'Platform', link: '/en/platform/getting-started/quick-start' },
  { text: 'CLI & agents', link: '/en/cli/guide/overview' },
]

const navZh = [
  { text: '首页', link: '/zh/' },
  { text: '平台', link: '/zh/platform/getting-started/quick-start' },
  { text: 'CLI 与自动化', link: '/zh/cli/guide/overview' },
]

export default defineConfig({
  title: 'Softprobe Documentation',
  description: 'Softprobe platform and sp CLI documentation',
  base: '/',
  appearance: true,
  head: [
    ['link', { rel: 'icon', href: '/img/sp-logo-trans.ico' }],
    ['meta', { name: 'theme-color', content: '#A14EFF' }],
  ],
  ignoreDeadLinks: true,
  srcExclude: [
    '**/implementer/**',
    'docs/**',
    'i18n/**',
    'content_backup*/**',
    'archive/**',
    'README.md',
    'REDIRECTS.md',
  ],
  rewrites: {
    // Pattern B shortcuts (default English) — /cli/* and /platform/* without /en/ prefix
    'cli/:path*': 'en/cli/:path*',
    'platform/:path*': 'en/platform/:path*',
    'commands-v2/:path*': 'en/cli/commands/:path*',
    'getting-started/:path*': 'en/platform/getting-started/:path*',
    'deployment/:path*': 'en/platform/deployment/:path*',
    'configuration/:path*': 'en/platform/configuration/:path*',
    'production/:path*': 'en/platform/production/:path*',
    'advanced-guides/:path*': 'en/platform/advanced-guides/:path*',
    'billing/:path*': 'en/platform/billing/:path*',
    'support/:path*': 'en/platform/support/:path*',
    'guide/:path*': 'en/cli/guide/:path*',
    'commands/:path*': 'en/cli/commands/:path*',
    'examples/:path*': 'en/cli/examples/:path*',
    'reference/:path*': 'en/cli/reference/:path*',
    'policies/:path*': 'en/cli/policies/:path*',
  },
  locales: {
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        nav: navEn,
        sidebar: sidebarForLocale('en'),
      },
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: navZh,
        sidebar: sidebarForLocale('zh'),
      },
    },
  },
  themeConfig: {
    logo: '/img/sp-logo-trans.png',
    siteTitle: 'Softprobe Documentation',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/softprobe/softprobe' },
      { icon: 'x', link: 'https://x.com/softprobeai' },
    ],
    footer: {
      message: 'Zero code changes · Full-context visibility · Cost optimization',
      copyright: `Copyright © ${new Date().getFullYear()} Softprobe`,
      links: [
        {
          title: 'Docs',
          items: [
            {
              text: 'Installation',
              link: '/en/platform/deployment/installation',
            },
            {
              text: 'CLI quickstart',
              link: '/en/cli/guide/quickstart',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            { text: 'Twitter', link: 'https://x.com/softprobeai' },
          ],
        },
        {
          title: 'More',
          items: [
            {
              text: 'SP-Istio GitHub',
              link: 'https://github.com/softprobe/softprobe',
            },
            {
              text: 'SESSIFY GitHub',
              link: 'https://github.com/softprobe/sessify',
            },
          ],
        },
      ],
    },
  },
})
