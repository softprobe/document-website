import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { themeConfigForLocale, type DocLocale } from './theme/shared'

// Testing sidebar, organised by Diátaxis (explanation → how-to → reference).
const testingSidebarEn = [
  {
    text: 'Get started',
    items: [
      { text: 'What is Softprobe Testing', link: '/en/testing/' },
      { text: 'How it works', link: '/en/testing/how-it-works' },
      { text: 'Quick start', link: '/en/testing/getting-started' },
    ],
  },
  {
    text: 'Install',
    collapsed: false,
    items: [
      { text: 'Softprobe Server (Helm)', link: '/en/testing/installation/server' },
      { text: 'Metrics data plane', link: '/en/testing/installation/metrics-data-plane' },
      { text: 'Softprobe client (CLI)', link: '/en/testing/installation/' },
      { text: 'Configuration', link: '/en/testing/installation/configuration' },
      { text: 'Download Java agent', link: '/en/testing/download-java-agent' },
      { text: 'Attach the Java agent', link: '/en/testing/java-agent' },
      { text: 'Supported frameworks', link: '/en/testing/supported-frameworks' },
      { text: 'Launch Web UI (manual)', link: '/en/testing/installation/code' },
      { text: 'Doctor', link: '/en/testing/installation/doctor' },
      { text: 'Upgrade', link: '/en/testing/installation/upgrade' },
    ],
  },
  {
    text: 'Record',
    collapsed: false,
    items: [
      { text: 'How to record', link: '/en/testing/recording' },
      { text: 'Recording policy', link: '/en/testing/policies#recording-policy' },
    ],
  },
  {
    text: 'Replay & compare',
    collapsed: false,
    items: [
      { text: 'Replay and diff', link: '/en/testing/replay-and-diff' },
      { text: 'Mock & compare policies', link: '/en/testing/policies#mock-policy' },
    ],
  },
  {
    text: 'Policies',
    collapsed: false,
    items: [
      { text: 'Policies overview', link: '/en/testing/policies' },
      { text: 'Policy YAML guide', link: '/en/testing/policy-yaml-guide' },
    ],
  },
  {
    text: 'Automation & AI agents',
    collapsed: false,
    items: [
      { text: 'Webhook and CI/CD', link: '/en/testing/webhook-and-ci' },
      { text: 'For AI agents', link: '/en/testing/agents/overview' },
      { text: 'Introduction', link: '/en/testing/agents/introduction' },
      { text: 'Concepts', link: '/en/testing/agents/concepts' },
      { text: 'Authentication', link: '/en/testing/agents/authentication' },
      { text: 'Output contract', link: '/en/testing/agents/output-contract' },
      { text: 'Versioning', link: '/en/testing/agents/versioning' },
      { text: 'Examples', link: '/en/testing/examples/' },
    ],
  },
  {
    text: 'Reference',
    collapsed: true,
    items: [
      { text: 'Commands', link: '/en/testing/commands/' },
      { text: 'Exit codes', link: '/en/testing/reference/exit-codes' },
      { text: 'JSON types', link: '/en/testing/reference/json-types' },
      { text: 'API mapping', link: '/en/testing/reference/api-mapping' },
      { text: 'Log correlation IDs', link: '/en/testing/reference/log-correlation-ids' },
      { text: 'Replay send / log markers', link: '/en/testing/reference/replay-send-log-markers' },
    ],
  },
]

// 测试侧边栏，按 Diátaxis 组织（解释 → 操作指南 → 参考）。
const testingSidebarZh = [
  {
    text: '开始使用',
    items: [
      { text: '什么是 Softprobe 测试', link: '/zh/testing/' },
      { text: '工作原理', link: '/zh/testing/how-it-works' },
      { text: '快速开始', link: '/zh/testing/getting-started' },
    ],
  },
  {
    text: '安装',
    collapsed: false,
    items: [
      { text: 'Softprobe 服务端（Helm）', link: '/zh/testing/installation/server' },
      { text: 'Metrics 数据面', link: '/zh/testing/installation/metrics-data-plane' },
      { text: 'Softprobe 客户端（CLI）', link: '/zh/testing/installation/' },
      { text: '配置', link: '/zh/testing/installation/configuration' },
      { text: '下载 Java Agent', link: '/zh/testing/download-java-agent' },
      { text: '接入 Java Agent', link: '/zh/testing/java-agent' },
      { text: '支持的框架', link: '/zh/testing/supported-frameworks' },
      { text: '手动启动 Web UI', link: '/zh/testing/installation/code' },
      { text: 'Doctor', link: '/zh/testing/installation/doctor' },
      { text: '升级', link: '/zh/testing/installation/upgrade' },
    ],
  },
  {
    text: '录制',
    collapsed: false,
    items: [
      { text: '如何录制', link: '/zh/testing/recording' },
      { text: '录制策略', link: '/zh/testing/policies#recording-policy' },
    ],
  },
  {
    text: '回放与对比',
    collapsed: false,
    items: [
      { text: '回放与对比', link: '/zh/testing/replay-and-diff' },
      { text: 'Mock 与对比策略', link: '/zh/testing/policies#mock-policy' },
    ],
  },
  {
    text: '策略 Policies',
    collapsed: false,
    items: [
      { text: '策略概览', link: '/zh/testing/policies' },
      { text: '策略 YAML 指南', link: '/zh/testing/policy-yaml-guide' },
    ],
  },
  {
    text: '自动化与 AI 代理',
    collapsed: false,
    items: [
      { text: 'Webhook 与 CI/CD', link: '/zh/testing/webhook-and-ci' },
      { text: 'AI 代理', link: '/zh/testing/agents/overview' },
      { text: '介绍', link: '/zh/testing/agents/introduction' },
      { text: '核心概念', link: '/zh/testing/agents/concepts' },
      { text: '认证', link: '/zh/testing/agents/authentication' },
      { text: '输出约定', link: '/zh/testing/agents/output-contract' },
      { text: '版本管理', link: '/zh/testing/agents/versioning' },
      { text: '示例', link: '/zh/testing/examples/' },
    ],
  },
  {
    text: '参考',
    collapsed: true,
    items: [
      { text: '命令', link: '/zh/testing/commands/' },
      { text: '退出码', link: '/zh/testing/reference/exit-codes' },
      { text: 'JSON 类型', link: '/zh/testing/reference/json-types' },
      { text: 'API 映射', link: '/zh/testing/reference/api-mapping' },
      { text: '日志关联 ID', link: '/zh/testing/reference/log-correlation-ids' },
      { text: 'Replay send / 日志标记', link: '/zh/testing/reference/replay-send-log-markers' },
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
  const platformBase = locale === 'zh' ? '/zh/platform/' : '/en/platform/'
  const testingBase = locale === 'zh' ? '/zh/testing/' : '/en/testing/'
  return {
    [platformBase]: platform,
    [testingBase]: testing,
  }
}

export default withMermaid(
  defineConfig({
  title: 'Softprobe',
  description: 'Softprobe platform, Java record-replay testing, and sp CLI documentation',
  base: '/',
  appearance: true,
  lastUpdated: true,
  mermaid: {
    theme: 'neutral',
  },
  // Pre-bundle mermaid + plugin so the dev optimizer does not thrash on first load.
  vite: {
    optimizeDeps: {
      include: ['mermaid', 'vitepress-plugin-mermaid'],
    },
  },
  head: [
    ['link', { rel: 'icon', href: '/img/sp-logo-trans.ico' }],
    ['meta', { name: 'theme-color', content: '#A14EFF' }],
  ],
  // Dead links fail the build. Localhost examples in guides are intentional, not dead.
  ignoreDeadLinks: [/^https?:\/\/localhost/],
  srcExclude: [
    '**/implementer/**',
    'docs/**',
    'i18n/**',
    'content_backup*/**',
    'archive/**',
    'README.md',
    'REDIRECTS.md',
    'CONTRIBUTING.md',
  ],
  // Legacy short-path and cli/* → new-path redirects are served at the HTTP layer
  // by public/_redirects (Cloudflare). VitePress `rewrites` map source-file paths,
  // not URLs, so they never fired here — removed to avoid confusion.
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
  themeConfig: themeConfigForLocale('en', sidebarForLocale('en')),
  }),
)
