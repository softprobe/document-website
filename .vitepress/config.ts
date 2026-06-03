import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import {
  footerForLocale,
  navForLocale,
  sharedChrome,
  themeConfigForLocale,
  type DocLocale,
} from './theme/shared'

function cliSidebar(locale: DocLocale) {
  const p = locale === 'zh' ? '/zh' : '/en'
  return [
    {
      text: 'For AI agents',
      collapsed: false,
      items: [
        { text: 'Overview', link: `${p}/cli/guide/overview` },
        { text: 'Output contract', link: `${p}/cli/guide/output-contract` },
        { text: 'Versioning', link: `${p}/cli/guide/versioning` },
      ],
    },
    {
      text: 'Guide',
      items: [
        { text: 'Introduction', link: `${p}/cli/guide/introduction` },
        { text: 'Installation', link: `${p}/cli/guide/installation` },
        { text: 'Quickstart', link: `${p}/cli/guide/quickstart` },
        { text: 'Authentication', link: `${p}/cli/guide/authentication` },
        { text: 'CLI configuration (XDG)', link: `${p}/cli/guide/configuration` },
        { text: 'spcode CLI', link: `${p}/cli/guide/spcode` },
        { text: 'Concepts', link: `${p}/cli/guide/concepts` },
      ],
    },
    {
      text: 'Commands',
      items: [
        { text: 'Overview', link: `${p}/cli/commands/` },
        {
          text: 'Lifecycle',
          collapsed: false,
          items: [
            { text: 'setup', link: `${p}/cli/commands/setup` },
            { text: 'agent', link: `${p}/cli/commands/agent` },
            { text: 'diagnose', link: `${p}/cli/commands/diagnose` },
          ],
        },
        {
          text: 'Business Observability',
          collapsed: false,
          items: [
            { text: 'config', link: `${p}/cli/commands/config` },
            { text: 'auth', link: `${p}/cli/commands/auth` },
            { text: 'app', link: `${p}/cli/commands/app` },
            { text: 'policy', link: `${p}/cli/commands/policy` },
            { text: 'replay', link: `${p}/cli/commands/replay` },
            { text: 'health', link: `${p}/cli/commands/health` },
          ],
        },
        {
          text: 'Investigation',
          collapsed: false,
          items: [
            { text: 'record', link: `${p}/cli/commands/record` },
            { text: 'trace', link: `${p}/cli/commands/trace` },
            { text: 'replay case', link: `${p}/cli/commands/replay-case` },
            { text: 'replay diff & logs', link: `${p}/cli/commands/replay-diff` },
            { text: 'extraction-rule', link: `${p}/cli/commands/extraction-rule` },
          ],
        },
        {
          text: 'Administration',
          collapsed: true,
          items: [
            { text: 'group & grant', link: `${p}/cli/commands/group` },
            { text: 'system & task', link: `${p}/cli/commands/system` },
            { text: 'ops', link: `${p}/cli/commands/ops` },
            { text: 'config legacy', link: `${p}/cli/commands/config-legacy` },
          ],
        },
      ],
    },
    {
      text: 'Policies',
      items: [{ text: 'YAML policies', link: `${p}/cli/policies/` }],
    },
    {
      text: 'Examples',
      items: [
        { text: 'Diagnose replay failure', link: `${p}/cli/examples/agent-diagnose-replay` },
        { text: 'Attr → trace lookup', link: `${p}/cli/examples/agent-attr-trace-lookup` },
        { text: 'CI policy gate', link: `${p}/cli/examples/ci-policy-gate` },
        { text: 'GitOps policies', link: `${p}/cli/examples/gitops-policies` },
      ],
    },
    {
      text: 'Reference',
      items: [
        { text: 'API mapping', link: `${p}/cli/reference/api-mapping` },
        { text: 'JSON types', link: `${p}/cli/reference/json-types` },
        { text: 'Exit codes', link: `${p}/cli/reference/exit-codes` },
      ],
    },
  ]
}

const testingSidebarEn = [
  {
    text: 'Overview',
    items: [
      { text: 'What is Softprobe Testing', link: '/en/testing/' },
      { text: 'How it works', link: '/en/testing/how-it-works' },
      { text: 'Getting started', link: '/en/testing/getting-started' },
    ],
  },
  {
    text: 'Java agent',
    items: [
      { text: 'Attach and configure', link: '/en/testing/java-agent' },
      { text: 'Supported frameworks', link: '/en/testing/supported-frameworks' },
    ],
  },
  {
    text: 'Recording',
    items: [
      { text: 'How to record', link: '/en/testing/recording' },
      { text: 'Recording policy', link: '/en/testing/policies#recording-policy' },
    ],
  },
  {
    text: 'Replay',
    items: [
      { text: 'Replay and diff', link: '/en/testing/replay-and-diff' },
      { text: 'Mock and compare policies', link: '/en/testing/policies#mock-policy' },
      { text: 'Policy YAML guide', link: '/en/testing/policy-yaml-guide' },
    ],
  },
  {
    text: 'Automate',
    items: [
      { text: 'Webhook and CI/CD', link: '/en/testing/webhook-and-ci' },
      { text: 'CLI quickstart', link: '/en/cli/guide/quickstart' },
    ],
  },
]

const testingSidebarZh = [
  {
    text: '概览',
    items: [
      { text: 'Softprobe 测试', link: '/zh/testing/' },
      { text: '工作原理', link: '/zh/testing/how-it-works' },
      { text: '快速开始', link: '/zh/testing/getting-started' },
    ],
  },
  {
    text: 'Java Agent',
    items: [
      { text: '安装与配置', link: '/zh/testing/java-agent' },
      { text: '支持的框架', link: '/zh/testing/supported-frameworks' },
    ],
  },
  {
    text: '录制',
    items: [
      { text: '如何录制', link: '/zh/testing/recording' },
      { text: '录制策略', link: '/zh/testing/policies#recording-policy' },
    ],
  },
  {
    text: '回放',
    items: [
      { text: '回放与对比', link: '/zh/testing/replay-and-diff' },
      { text: 'Mock 与对比策略', link: '/zh/testing/policies#mock-policy' },
      { text: '策略 YAML 指南', link: '/zh/testing/policy-yaml-guide' },
    ],
  },
  {
    text: '自动化',
    items: [
      { text: 'Webhook 与 CI/CD', link: '/zh/testing/webhook-and-ci' },
      { text: 'CLI 快速入门', link: '/zh/cli/guide/quickstart' },
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
    items: [{ text: 'Business Observability configuration (Istio)', link: '/en/platform/configuration/config' }],
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

function sidebarForLocale(locale: DocLocale) {
  const platform = locale === 'zh' ? platformSidebarZh : platformSidebarEn
  const testing = locale === 'zh' ? testingSidebarZh : testingSidebarEn
  const cli = cliSidebar(locale)
  const cliLabel = locale === 'zh' ? 'CLI 与自动化' : 'CLI & agents'
  const platformLabel = locale === 'zh' ? '业务观测' : 'Business Observability'
  const testingLabel = locale === 'zh' ? '测试' : 'Testing'
  const platformBase = locale === 'zh' ? '/zh/platform/' : '/en/platform/'
  const testingBase = locale === 'zh' ? '/zh/testing/' : '/en/testing/'
  const cliBase = locale === 'zh' ? '/zh/cli/' : '/en/cli/'
  return {
    [platformBase]: platform,
    [testingBase]: testing,
    [cliBase]: cli,
    '/': [
      { text: platformLabel, items: platform },
      { text: testingLabel, items: testing },
      { text: cliLabel, items: cli },
    ],
  }
}

export default withMermaid(
  defineConfig({
  title: 'Softprobe',
  description: 'Softprobe platform, Java record-replay testing, and sp CLI documentation',
  base: '/',
  appearance: true,
  mermaid: {
    theme: 'neutral',
  },
  vite: {
    optimizeDeps: {
      include: ['mermaid', 'vitepress-plugin-mermaid'],
    },
  },
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
      themeConfig: themeConfigForLocale('en', sidebarForLocale('en')),
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: themeConfigForLocale('zh', sidebarForLocale('zh')),
    },
  },
  themeConfig: {
    ...sharedChrome,
    nav: navForLocale('en'),
    footer: footerForLocale('en'),
  },
  }),
)
