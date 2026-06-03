import { defineConfig } from 'vitepress'

const cliSidebar = [
  {
    text: 'For AI agents',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/cli/guide/for-agents' },
      { text: 'Output contract', link: '/cli/guide/output-contract' },
      { text: 'Versioning', link: '/cli/guide/versioning' },
    ],
  },
  {
    text: 'Guide',
    items: [
      { text: 'Introduction', link: '/cli/guide/introduction' },
      { text: 'Installation', link: '/cli/guide/installation' },
      { text: 'Quickstart', link: '/cli/guide/quickstart' },
      { text: 'Authentication', link: '/cli/guide/authentication' },
      { text: 'CLI configuration (XDG)', link: '/cli/guide/configuration' },
      { text: 'spcode CLI', link: '/cli/guide/spcode' },
      { text: 'Concepts', link: '/cli/guide/concepts' },
    ],
  },
  {
    text: 'Commands',
    items: [
      { text: 'Overview', link: '/cli/commands/' },
      {
        text: 'Lifecycle',
        collapsed: false,
        items: [
          { text: 'setup', link: '/cli/commands/setup' },
          { text: 'agent', link: '/cli/commands/agent' },
          { text: 'diagnose', link: '/cli/commands/diagnose' },
        ],
      },
      {
        text: 'Platform',
        collapsed: false,
        items: [
          { text: 'config', link: '/cli/commands/config' },
          { text: 'auth', link: '/cli/commands/auth' },
          { text: 'app', link: '/cli/commands/app' },
          { text: 'policy', link: '/cli/commands/policy' },
          { text: 'replay', link: '/cli/commands/replay' },
          { text: 'health', link: '/cli/commands/health' },
        ],
      },
      {
        text: 'Investigation',
        collapsed: false,
        items: [
          { text: 'record', link: '/cli/commands/record' },
          { text: 'trace', link: '/cli/commands/trace' },
          { text: 'replay case', link: '/cli/commands/replay-case' },
          { text: 'replay diff & logs', link: '/cli/commands/replay-diff' },
          { text: 'extraction-rule', link: '/cli/commands/extraction-rule' },
        ],
      },
      {
        text: 'Administration',
        collapsed: true,
        items: [
          { text: 'group & grant', link: '/cli/commands/group' },
          { text: 'system & task', link: '/cli/commands/system' },
          { text: 'ops', link: '/cli/commands/ops' },
          { text: 'config legacy', link: '/cli/commands/config-legacy' },
        ],
      },
    ],
  },
  {
    text: 'Policies',
    items: [{ text: 'YAML policies', link: '/cli/policies/' }],
  },
  {
    text: 'Examples',
    items: [
      { text: 'Diagnose replay failure', link: '/cli/examples/agent-diagnose-replay' },
      { text: 'Attr → trace lookup', link: '/cli/examples/agent-attr-trace-lookup' },
      { text: 'CI policy gate', link: '/cli/examples/ci-policy-gate' },
      { text: 'GitOps policies', link: '/cli/examples/gitops-policies' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'API mapping', link: '/cli/reference/api-mapping' },
      { text: 'JSON types', link: '/cli/reference/json-types' },
      { text: 'Exit codes', link: '/cli/reference/exit-codes' },
    ],
  },
]

const platformSidebarEn = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Quick Start', link: '/platform/getting-started/quick-start' },
      { text: 'Account Setup', link: '/platform/getting-started/account-setup' },
    ],
  },
  {
    text: 'Deployment',
    items: [
      { text: 'Production Installation', link: '/platform/deployment/installation' },
      { text: 'GKE Autopilot + Istio', link: '/platform/deployment/GKE-Autopilot-Istio-Installation-Guide' },
    ],
  },
  {
    text: 'Production',
    items: [{ text: 'Dashboard User Guide', link: '/platform/production/dashboard-user-guide' }],
  },
  {
    text: 'Configuration',
    items: [{ text: 'Platform configuration (Istio)', link: '/platform/configuration/config' }],
  },
  {
    text: 'Advanced Guides',
    items: [
      { text: 'Core Concepts', link: '/platform/advanced-guides/concepts' },
      { text: 'Agent Architecture', link: '/platform/advanced-guides/agent-architecture' },
    ],
  },
  {
    text: 'Billing',
    items: [
      { text: 'Pricing', link: '/platform/billing/pricing' },
      { text: 'Subscriptions', link: '/platform/billing/subscriptions' },
    ],
  },
  { text: 'SESSIFY', link: '/platform/sessify' },
  {
    text: 'Support',
    items: [{ text: 'FAQ', link: '/platform/support/faq' }],
  },
]

const platformSidebarZh = [
  {
    text: '快速开始',
    items: [
      { text: '快速入门', link: '/platform/getting-started/quick-start' },
      { text: '账户设置', link: '/platform/getting-started/account-setup' },
    ],
  },
  {
    text: '部署',
    items: [
      { text: '生产环境安装', link: '/platform/deployment/installation' },
      { text: 'GKE Autopilot + Istio', link: '/platform/deployment/GKE-Autopilot-Istio-Installation-Guide' },
    ],
  },
  {
    text: '生产使用',
    items: [{ text: '仪表盘用户指南', link: '/platform/production/dashboard-user-guide' }],
  },
  {
    text: '配置',
    items: [{ text: '平台配置（Istio）', link: '/platform/configuration/config' }],
  },
  {
    text: '进阶指南',
    items: [
      { text: '核心概念', link: '/platform/advanced-guides/concepts' },
      { text: 'Agent 架构', link: '/platform/advanced-guides/agent-architecture' },
    ],
  },
  {
    text: '计费',
    items: [
      { text: '定价', link: '/platform/billing/pricing' },
      { text: '订阅', link: '/platform/billing/subscriptions' },
    ],
  },
  { text: 'SESSIFY', link: '/platform/sessify' },
  {
    text: '支持',
    items: [{ text: '常见问题', link: '/platform/support/faq' }],
  },
]

function sidebarForLocale(locale: 'en' | 'zh') {
  const platform = locale === 'zh' ? platformSidebarZh : platformSidebarEn
  const cliLabel = locale === 'zh' ? 'CLI 与自动化（英文）' : 'CLI & agents'
  const platformLabel = locale === 'zh' ? '平台' : 'Platform'
  return {
    '/platform/': platform,
    '/cli/': cliSidebar,
    '/': [
      { text: platformLabel, items: platform },
      { text: cliLabel, items: cliSidebar },
    ],
  }
}

const navEn = [
  { text: 'Home', link: '/' },
  { text: 'Platform', link: '/platform/getting-started/quick-start' },
  { text: 'CLI & agents', link: '/cli/guide/for-agents' },
]

const navZh = [
  { text: '首页', link: '/' },
  { text: '平台', link: '/platform/getting-started/quick-start' },
  { text: 'CLI 与自动化', link: '/en/cli/guide/for-agents' },
]

export default defineConfig({
  title: 'Softprobe Documentation',
  description: 'Softprobe platform and sp CLI documentation',
  base: '/',
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
    socialLinks: [
      { icon: 'github', link: 'https://github.com/softprobe/softprobe' },
    ],
  },
})
