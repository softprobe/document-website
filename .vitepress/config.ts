import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import {
  footerForLocale,
  navForLocale,
  sharedChrome,
  themeConfigForLocale,
  type DocLocale,
} from './theme/shared'

const testingSidebarEn = [
  {
    text: 'Overview',
    items: [
      { text: 'What is Softprobe Testing', link: '/en/testing/' },
      { text: 'How it works', link: '/en/testing/how-it-works' },
      { text: 'Getting Started', link: '/en/testing/getting-started' },
    ],
  },
  {
    text: 'Installation',
    items: [
      { text: 'Install Softprobe Server', link: '/en/testing/installation/server' },
      { text: 'Metrics data plane', link: '/en/testing/installation/metrics-data-plane' },
      { text: 'Install Softprobe Client', link: '/en/testing/installation/' },
      { text: 'Configuration', link: '/en/testing/installation/configuration' },
      { text: 'Launch Web UI (manual)', link: '/en/testing/installation/code' },
      { text: 'Doctor', link: '/en/testing/installation/doctor' },
      { text: 'Upgrade', link: '/en/testing/installation/upgrade' },
    ],
  },
  {
    text: 'Java agent',
    items: [
      { text: 'Download Java agent', link: '/en/testing/download-java-agent' },
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
      { text: 'Review diffs in the Web UI', link: '/en/testing/review-diffs-in-the-web-ui' },
      { text: 'Compare rules in the Web UI', link: '/en/testing/compare-rules-web-ui' },
      { text: 'Mock and compare policies', link: '/en/testing/policies#mock-policy' },
      { text: 'Policy YAML guide', link: '/en/testing/policy-yaml-guide' },
    ],
  },
  {
    text: 'Commands and automation',
    items: [
      { text: 'Commands', link: '/en/testing/commands/' },
      { text: 'For AI agents', link: '/en/testing/agents/overview' },
      { text: 'Output contract', link: '/en/testing/agents/output-contract' },
      { text: 'Examples', link: '/en/testing/examples/' },
      { text: 'Reference', link: '/en/testing/reference/' },
      { text: 'Policies', link: '/en/testing/policies/' },
    ],
  },
  {
    text: 'Automate',
    items: [
      { text: 'Webhook and CI/CD', link: '/en/testing/webhook-and-ci' },
      { text: 'Commands', link: '/en/testing/commands/' },
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
    text: '安装',
    items: [
      { text: '安装 Softprobe 服务端', link: '/zh/testing/installation/server' },
      { text: '安装 Softprobe（客户端）', link: '/zh/testing/installation/' },
      { text: '配置', link: '/zh/testing/installation/configuration' },
      { text: '手动启动 Web UI', link: '/zh/testing/installation/code' },
      { text: 'Doctor', link: '/zh/testing/installation/doctor' },
      { text: '升级', link: '/zh/testing/installation/upgrade' },
    ],
  },
  {
    text: 'Java Agent',
    items: [
      { text: '下载 Java Agent', link: '/zh/testing/download-java-agent' },
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
      { text: '在 Web UI 里查看差异', link: '/zh/testing/review-diffs-in-the-web-ui' },
      { text: '在 Web UI 里配对比规则', link: '/zh/testing/compare-rules-web-ui' },
      { text: 'Mock 与对比策略', link: '/zh/testing/policies#mock-policy' },
      { text: '策略 YAML 指南', link: '/zh/testing/policy-yaml-guide' },
    ],
  },
  {
    text: '命令与自动化',
    items: [
      { text: '命令', link: '/zh/testing/commands/' },
      { text: 'AI 代理', link: '/zh/testing/agents/overview' },
      { text: '输出约定', link: '/zh/testing/agents/output-contract' },
      { text: '示例', link: '/zh/testing/examples/' },
      { text: '参考', link: '/zh/testing/reference/' },
      { text: '策略', link: '/zh/testing/policies/' },
    ],
  },
  {
    text: '自动化',
    items: [
      { text: 'Webhook 与 CI/CD', link: '/zh/testing/webhook-and-ci' },
      { text: '命令', link: '/zh/testing/commands/' },
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
  const platformLabel = locale === 'zh' ? '业务观测' : 'Business Observability'
  const testingLabel = locale === 'zh' ? '测试' : 'Testing'
  const platformBase = locale === 'zh' ? '/zh/platform/' : '/en/platform/'
  const testingBase = locale === 'zh' ? '/zh/testing/' : '/en/testing/'
  const cliBase = locale === 'zh' ? '/zh/cli/' : '/en/cli/'
  return {
    [platformBase]: platform,
    [testingBase]: testing,
    [cliBase]: testing,
    '/': [
      { text: platformLabel, items: platform },
      { text: testingLabel, items: testing },
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
    'cli': 'en/testing/commands/',
    'platform/:path*': 'en/platform/:path*',
    'commands-v2': 'en/testing/commands/',
    'getting-started/:path*': 'en/platform/getting-started/:path*',
    'deployment/:path*': 'en/platform/deployment/:path*',
    'configuration/:path*': 'en/platform/configuration/:path*',
    'production/:path*': 'en/platform/production/:path*',
    'advanced-guides/:path*': 'en/platform/advanced-guides/:path*',
    'billing/:path*': 'en/platform/billing/:path*',
    'support/:path*': 'en/platform/support/:path*',
    'guide/installation': 'en/testing/installation/',
    'guide/quickstart': 'en/testing/getting-started',
    'guide/configuration': 'en/testing/installation/configuration',
    'guide/spcode': 'en/testing/installation/code',
    'commands': 'en/testing/commands/',
    'examples': 'en/testing/examples/',
    'reference': 'en/testing/reference/',
    'policies': 'en/testing/policies/',
    'en/cli/guide/installation': 'en/testing/installation/',
    'en/cli/guide/quickstart': 'en/testing/getting-started',
    'en/cli/guide/configuration': 'en/testing/installation/configuration',
    'en/cli/guide/spcode': 'en/testing/installation/code',
    'en/cli/commands': 'en/testing/commands/',
    'en/cli/examples': 'en/testing/examples/',
    'en/cli/reference': 'en/testing/reference/',
    'en/cli/policies': 'en/testing/policies/',
    'en/testing/installation/setup': 'en/testing/installation/',
    'en/cli/guide/overview': 'en/testing/agents/overview',
    'en/cli/guide/output-contract': 'en/testing/agents/output-contract',
    'en/cli/guide/versioning': 'en/testing/agents/versioning',
    'en/cli/guide/log-correlation-ids': 'en/testing/reference/log-correlation-ids',
    'en/cli/guide/authentication': 'en/testing/agents/authentication',
    'en/cli/guide/concepts': 'en/testing/agents/concepts',
    'en/cli/guide/introduction': 'en/testing/agents/introduction',
    'zh/cli/guide/overview': 'zh/testing/agents/overview',
    'zh/cli/guide/output-contract': 'zh/testing/agents/output-contract',
    'zh/cli/guide/versioning': 'zh/testing/agents/versioning',
    'zh/cli/guide/log-correlation-ids': 'zh/testing/reference/log-correlation-ids',
    'zh/cli/guide/authentication': 'zh/testing/agents/authentication',
    'zh/cli/guide/concepts': 'zh/testing/agents/concepts',
    'zh/cli/guide/introduction': 'zh/testing/agents/introduction',
    'zh/cli/guide/installation': 'zh/testing/installation/',
    'zh/cli/guide/quickstart': 'zh/testing/getting-started',
    'zh/cli/guide/configuration': 'zh/testing/installation/configuration',
    'zh/cli/guide/spcode': 'zh/testing/installation/code',
    'zh/cli/commands': 'zh/testing/commands/',
    'zh/cli/examples': 'zh/testing/examples/',
    'zh/cli/reference': 'zh/testing/reference/',
    'zh/cli/policies': 'zh/testing/policies/',
    'zh/testing/installation/setup': 'zh/testing/installation/',
    'en/platform/deployment/sp-backend-helm': 'en/testing/installation/server',
    'en/platform/deployment/unified-log-pipeline': 'en/testing/installation/server',
    'en/platform/deployment/spcode-web': 'en/testing/installation/',
    'en/testing/installation/agent': 'en/testing/download-java-agent',
    'zh/testing/installation/agent': 'zh/testing/download-java-agent',
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
