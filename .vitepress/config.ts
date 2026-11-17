import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import llmstxt from 'vitepress-plugin-llms'
import { accessAssets } from './access-assets'
import { themeConfigForLocale, type DocLocale } from './theme/shared'

// Testing sidebar, grouped by reader: everyone → best practices → console users → ops / delivery → pipelines → integrators → command reference.
const testingSidebarEn = [
  {
    text: 'Get started',
    items: [
      { text: 'What is Replay Testing', link: '/en/testing/' },
      { text: 'Your first record and replay', link: '/en/testing/getting-started' },
      { text: 'How it works', link: '/en/testing/how-it-works' },
      { text: 'Capabilities, scope and resources', link: '/en/testing/core-features-and-performance' },
    ],
  },
  {
    text: 'Best practices',
    items: [
      { text: 'CI/CD release regression', link: '/en/testing/best-practices/release-regression' },
    ],
  },
  {
    text: 'Everyday use',
    collapsed: false,
    items: [
      { text: 'Recordings', link: '/en/testing/recording' },
      { text: 'Pinned cases', link: '/en/testing/pinned-cases' },
      { text: 'Run and schedule replays', link: '/en/testing/replay-and-diff' },
      { text: 'Replay report', link: '/en/testing/replay-report' },
      { text: 'Review differences', link: '/en/testing/review-diffs-in-the-web-ui' },
      { text: 'Diff rules', link: '/en/testing/compare-rules-web-ui' },
      { text: 'Recording and replay settings', link: '/en/testing/policies' },
    ],
  },
  {
    text: 'Deploy and operate',
    collapsed: false,
    items: [
      { text: 'Choose a deployment', link: '/en/testing/installation/deployment' },
      { text: 'Before you deploy: resources and network', link: '/en/testing/installation/preparation' },
      { text: 'Single-server install (All-in-One)', link: '/en/testing/installation/all-in-one' },
      { text: 'Kubernetes deployment (Helm)', link: '/en/testing/installation/server' },
      { text: 'Supported Java versions and frameworks', link: '/en/testing/supported-frameworks' },
      { text: 'Attach the Java agent', link: '/en/testing/java-agent' },
      { text: 'Data protection and retention', link: '/en/testing/installation/data-protection' },
      { text: 'Set up AI diagnosis and code repositories', link: '/en/testing/installation/ai-diagnosis' },
      { text: 'Maintenance and troubleshooting', link: '/en/testing/installation/operations' },
    ],
  },
  {
    text: 'Pipelines and notifications',
    collapsed: false,
    items: [
      { text: 'Replay after deployment (CI/CD)', link: '/en/testing/webhook-and-ci' },
      { text: 'Replay notifications', link: '/en/testing/notifications' },
      { text: 'Manage policies in Git', link: '/en/testing/examples/gitops-policies' },
    ],
  },
  {
    text: 'Integrate and AI agents',
    collapsed: true,
    items: [
      { text: 'Choose how to integrate', link: '/en/testing/agents/overview' },
      { text: 'Install the sp command line', link: '/en/testing/installation/' },
      { text: 'Client configuration', link: '/en/testing/installation/configuration' },
      { text: 'Authentication', link: '/en/testing/agents/authentication' },
      { text: 'Concepts and IDs', link: '/en/testing/agents/concepts' },
      { text: 'Output contract', link: '/en/testing/agents/output-contract' },
      { text: 'Diagnose a failed replay', link: '/en/testing/examples/agent-diagnose-replay' },
      { text: 'Policy YAML reference', link: '/en/testing/policy-yaml-guide' },
      { text: 'Replay trigger Open API', link: '/en/testing/reference/replay-openapi' },
      { text: 'CLI to backend API mapping', link: '/en/testing/reference/api-mapping' },
      { text: 'Log query fields', link: '/en/testing/commands/log-query-fields' },
      { text: 'Replay send log markers', link: '/en/testing/reference/replay-send-log-markers' },
      { text: 'Metrics data plane', link: '/en/testing/installation/metrics-data-plane' },
    ],
  },
  {
    text: 'Command reference',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/testing/commands/' },
      { text: 'sp setup', link: '/en/testing/commands/setup' },
      { text: 'sp auth', link: '/en/testing/commands/auth' },
      { text: 'sp config', link: '/en/testing/commands/config' },
      { text: 'sp app', link: '/en/testing/commands/app' },
      { text: 'sp agent', link: '/en/testing/commands/agent' },
      { text: 'sp record', link: '/en/testing/commands/record' },
      { text: 'sp replay', link: '/en/testing/commands/replay' },
      { text: 'sp replay case', link: '/en/testing/commands/replay-case' },
      { text: 'sp replay diff', link: '/en/testing/commands/replay-diff' },
      { text: 'sp diagnose', link: '/en/testing/commands/diagnose' },
      { text: 'sp logs', link: '/en/testing/commands/logs' },
      { text: 'sp trace', link: '/en/testing/commands/trace' },
      { text: 'sp extraction-rule', link: '/en/testing/commands/extraction-rule' },
      { text: 'sp policy', link: '/en/testing/commands/policy' },
      { text: 'sp health', link: '/en/testing/commands/health' },
      { text: 'sp tenant', link: '/en/testing/commands/tenant' },
      { text: 'sp tunnel', link: '/en/testing/commands/tunnel' },
      { text: 'sp group', link: '/en/testing/commands/group' },
      { text: 'sp system', link: '/en/testing/commands/system' },
      { text: 'sp ops', link: '/en/testing/commands/ops' },
      { text: 'sp demo', link: '/en/testing/commands/demo' },
    ],
  },
]

// 测试侧栏按读者分组：所有人 → 控制台使用者 → 运维与实施 → 流水线 → 对接开发 → 命令参考。
const testingSidebarZh = [
  {
    text: '了解与开始',
    items: [
      { text: '什么是流量回放测试', link: '/zh/testing/' },
      { text: '第一次录制回放', link: '/zh/testing/getting-started' },
      { text: '工作原理', link: '/zh/testing/how-it-works' },
      { text: '功能、适用范围与资源需求', link: '/zh/testing/core-features-and-performance' },
    ],
  },
  {
    text: '最佳实践',
    items: [
      { text: 'CI/CD 发版回归', link: '/zh/testing/best-practices/release-regression' },
    ],
  },
  {
    text: '日常使用',
    collapsed: false,
    items: [
      { text: '查看录制', link: '/zh/testing/recording' },
      { text: '固化用例', link: '/zh/testing/pinned-cases' },
      { text: '发起回放与定时回放', link: '/zh/testing/replay-and-diff' },
      { text: '回放报告', link: '/zh/testing/replay-report' },
      { text: '审查差异', link: '/zh/testing/review-diffs-in-the-web-ui' },
      { text: '配置对比规则', link: '/zh/testing/compare-rules-web-ui' },
      { text: '录制配置与回放配置', link: '/zh/testing/policies' },
    ],
  },
  {
    text: '部署与运维',
    collapsed: false,
    items: [
      { text: '选择部署方式', link: '/zh/testing/installation/deployment' },
      { text: '部署前准备：资源与网络', link: '/zh/testing/installation/preparation' },
      { text: '单机部署（All-in-One）', link: '/zh/testing/installation/all-in-one' },
      { text: 'Kubernetes 部署（Helm）', link: '/zh/testing/installation/server' },
      { text: '支持的 Java 版本与框架', link: '/zh/testing/supported-frameworks' },
      { text: '接入 Java Agent', link: '/zh/testing/java-agent' },
      { text: '数据保护与保留期', link: '/zh/testing/installation/data-protection' },
      { text: '配置 AI 诊断与代码仓库', link: '/zh/testing/installation/ai-diagnosis' },
      { text: '平台维护与故障排查', link: '/zh/testing/installation/operations' },
    ],
  },
  {
    text: '流水线与通知',
    collapsed: false,
    items: [
      { text: '发版后自动回放（CI/CD）', link: '/zh/testing/webhook-and-ci' },
      { text: '回放结果通知', link: '/zh/testing/notifications' },
      { text: '用 Git 管理策略', link: '/zh/testing/examples/gitops-policies' },
    ],
  },
  {
    text: '开发对接与 AI 代理',
    collapsed: true,
    items: [
      { text: '选择接入方式', link: '/zh/testing/agents/overview' },
      { text: '安装 sp 命令行', link: '/zh/testing/installation/' },
      { text: '客户端配置', link: '/zh/testing/installation/configuration' },
      { text: '认证与凭据', link: '/zh/testing/agents/authentication' },
      { text: '概念与编号', link: '/zh/testing/agents/concepts' },
      { text: '输出约定', link: '/zh/testing/agents/output-contract' },
      { text: '排查回放失败', link: '/zh/testing/examples/agent-diagnose-replay' },
      { text: '策略 YAML 参考', link: '/zh/testing/policy-yaml-guide' },
      { text: '回放触发 Open API', link: '/zh/testing/reference/replay-openapi' },
      { text: '命令与后端接口对照', link: '/zh/testing/reference/api-mapping' },
      { text: '日志查询字段', link: '/zh/testing/commands/log-query-fields' },
      { text: '回放发送日志标记', link: '/zh/testing/reference/replay-send-log-markers' },
      { text: '指标数据接口', link: '/zh/testing/installation/metrics-data-plane' },
    ],
  },
  {
    text: '命令参考',
    collapsed: true,
    items: [
      { text: '命令总览', link: '/zh/testing/commands/' },
      { text: 'sp setup', link: '/zh/testing/commands/setup' },
      { text: 'sp auth', link: '/zh/testing/commands/auth' },
      { text: 'sp config', link: '/zh/testing/commands/config' },
      { text: 'sp app', link: '/zh/testing/commands/app' },
      { text: 'sp agent', link: '/zh/testing/commands/agent' },
      { text: 'sp record', link: '/zh/testing/commands/record' },
      { text: 'sp replay', link: '/zh/testing/commands/replay' },
      { text: 'sp replay case', link: '/zh/testing/commands/replay-case' },
      { text: 'sp replay diff', link: '/zh/testing/commands/replay-diff' },
      { text: 'sp diagnose', link: '/zh/testing/commands/diagnose' },
      { text: 'sp logs', link: '/zh/testing/commands/logs' },
      { text: 'sp trace', link: '/zh/testing/commands/trace' },
      { text: 'sp extraction-rule', link: '/zh/testing/commands/extraction-rule' },
      { text: 'sp policy', link: '/zh/testing/commands/policy' },
      { text: 'sp health', link: '/zh/testing/commands/health' },
      { text: 'sp tenant', link: '/zh/testing/commands/tenant' },
      { text: 'sp tunnel', link: '/zh/testing/commands/tunnel' },
      { text: 'sp group', link: '/zh/testing/commands/group' },
      { text: 'sp system', link: '/zh/testing/commands/system' },
      { text: 'sp ops', link: '/zh/testing/commands/ops' },
      { text: 'sp demo', link: '/zh/testing/commands/demo' },
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

const agentQaSidebarEn = [
  {
    text: 'Get started',
    items: [
      { text: 'What is Blackbox', link: '/en/agent-qa/' },
      { text: 'Quick start', link: '/en/agent-qa/getting-started' },
      { text: 'End-to-end session tracing', link: '/en/agent-qa/end-to-end-session-tracing' },
      { text: 'Concepts', link: '/en/agent-qa/concepts' },
    ],
  },
  {
    text: 'Instrument your app',
    items: [
      { text: 'Vercel AI SDK', link: '/en/agent-qa/vercel-ai-sdk' },
      { text: 'LangChain and LangGraph', link: '/en/agent-qa/langchain' },
      { text: 'OpenCode', link: '/en/agent-qa/opencode' },
    ],
  },
  {
    text: 'Investigate Sessions',
    items: [
      { text: 'Blackbox MCP (coding agents)', link: '/en/agent-qa/coding-agent-skills' },
    ],
  },
  {
    text: 'SDK & API reference',
    items: [
      { text: 'JavaScript / TypeScript (softprobe-js)', link: '/en/agent-qa/reference/softprobe-js' },
      { text: 'Python (softprobe-py)', link: '/en/agent-qa/reference/softprobe-py' },
    ],
  },
]

const lisaSidebarEn = [
  {
    text: 'Lisa',
    items: [
      { text: 'Overview', link: '/en/lisa/' },
      { text: 'Getting started', link: '/en/lisa/getting-started' },
      { text: 'Policies and activities', link: '/en/lisa/policies-and-activities' },
      { text: 'Runtime configuration', link: '/en/lisa/configuration' },
    ],
  },
]

const agentQaSidebarZh = [
  {
    text: '开始使用',
    items: [
      { text: '什么是 Blackbox', link: '/zh/agent-qa/' },
      { text: '快速开始', link: '/zh/agent-qa/getting-started' },
      { text: '概念', link: '/zh/agent-qa/concepts' },
      { text: '用编码 Agent 排查', link: '/zh/agent-qa/coding-agent-skills' },
    ],
  },
  {
    text: '集成',
    items: [
      { text: 'OpenCode', link: '/zh/agent-qa/opencode' },
      { text: 'LangChain', link: '/zh/agent-qa/langchain' },
    ],
  },
]

const lisaSidebarZh = [
  {
    text: 'Lisa',
    items: [
      { text: '概览', link: '/zh/lisa/' },
      { text: '快速开始', link: '/zh/lisa/getting-started' },
      { text: '策略与活动', link: '/zh/lisa/policies-and-activities' },
      { text: '运行时配置', link: '/zh/lisa/configuration' },
    ],
  },
]

function sidebarForLocale(locale: DocLocale) {
  const platform = locale === 'zh' ? platformSidebarZh : platformSidebarEn
  const testing = locale === 'zh' ? testingSidebarZh : testingSidebarEn
  const platformBase = locale === 'zh' ? '/zh/platform/' : '/en/platform/'
  const testingBase = locale === 'zh' ? '/zh/testing/' : '/en/testing/'
  const sidebars: Record<string, typeof platformSidebarEn> = {
    [platformBase]: platform,
    [testingBase]: testing,
  }
  if (locale === 'en') {
    sidebars['/en/agent-qa/'] = agentQaSidebarEn
    sidebars['/en/lisa/'] = lisaSidebarEn
  } else {
    sidebars['/zh/agent-qa/'] = agentQaSidebarZh
    sidebars['/zh/lisa/'] = lisaSidebarZh
  }
  return sidebars
}

export default withMermaid(
  defineConfig({
  title: 'Softprobe',
  description: 'Softprobe documentation for Arex, Blackbox, and Lisa',
  base: '/',
  cleanUrls: true,
  appearance: true,
  router: { prefetchLinks: false },
  lastUpdated: true,
  mermaid: {
    theme: 'neutral',
  },
  // Pre-bundle mermaid + plugin so the dev optimizer does not thrash on first load.
  vite: {
    optimizeDeps: {
      include: ['mermaid', 'vitepress-plugin-mermaid'],
    },
    plugins: [
      accessAssets(),
      // Generate /llms.txt (index) and /llms-full.txt (all docs) plus a .md
      // endpoint per page, so AI coding agents can consume the docs directly.
      llmstxt({
        ignoreFiles: ['**/implementer/**'],
        description:
          'Softprobe — Arex (Java record-replay testing and sp CLI), Blackbox (end-to-end session tracing and MCP), and Lisa (AI QA policy evaluation agent).',
      }),
    ],
  },
  head: [
    ['link', { rel: 'icon', href: '/img/favicon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'alternate icon', href: '/img/favicon.png', type: 'image/png' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
      },
    ],
    ['meta', { name: 'theme-color', content: '#B8724E' }],
  ],
  // Dead links fail the build. Localhost examples in guides are intentional, not dead.
  ignoreDeadLinks: [/^https?:\/\/localhost/],
  srcExclude: [
    '**/implementer/**',
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
