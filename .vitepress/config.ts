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
      { text: 'What is Replay Testing', link: '/en/arex/' },
      { text: 'Your first record and replay', link: '/en/arex/getting-started' },
      { text: 'How it works', link: '/en/arex/how-it-works' },
      { text: 'Capabilities, scope and resources', link: '/en/arex/core-features-and-performance' },
    ],
  },
  {
    text: 'Best practices',
    items: [
      { text: 'CI/CD release regression', link: '/en/arex/best-practices/release-regression' },
    ],
  },
  {
    text: 'Everyday use',
    collapsed: false,
    items: [
      { text: 'Recordings', link: '/en/arex/recording' },
      { text: 'Pinned cases', link: '/en/arex/pinned-cases' },
      { text: 'Test case management', link: '/en/arex/test-case-management' },
      { text: 'Run and schedule replays', link: '/en/arex/replay-and-diff' },
      { text: 'Replay report', link: '/en/arex/replay-report' },
      { text: 'Review differences', link: '/en/arex/review-diffs-in-the-web-ui' },
      { text: 'Diff rules', link: '/en/arex/compare-rules-web-ui' },
      { text: 'Recording and replay settings', link: '/en/arex/policies' },
    ],
  },
  {
    text: 'Deploy and operate',
    collapsed: false,
    items: [
      { text: 'Choose a deployment', link: '/en/arex/installation/deployment' },
      { text: 'Before you deploy: resources and network', link: '/en/arex/installation/preparation' },
      { text: 'Single-server install (All-in-One)', link: '/en/arex/installation/all-in-one' },
      { text: 'Kubernetes deployment (Helm)', link: '/en/arex/installation/server' },
      { text: 'Supported Java versions and frameworks', link: '/en/arex/supported-frameworks' },
      { text: 'Attach the Java agent', link: '/en/arex/java-agent' },
      { text: 'Data protection and retention', link: '/en/arex/installation/data-protection' },
      { text: 'Set up AI diagnosis and code repositories', link: '/en/arex/installation/ai-diagnosis' },
      { text: 'Maintenance and troubleshooting', link: '/en/arex/installation/operations' },
    ],
  },
  {
    text: 'Pipelines and notifications',
    collapsed: false,
    items: [
      { text: 'Replay after deployment (CI/CD)', link: '/en/arex/webhook-and-ci' },
      { text: 'Replay notifications', link: '/en/arex/notifications' },
      { text: 'Manage policies in Git', link: '/en/arex/examples/gitops-policies' },
    ],
  },
  {
    text: 'Integrate and AI agents',
    collapsed: true,
    items: [
      { text: 'Choose how to integrate', link: '/en/arex/agents/overview' },
      { text: 'Install the sp command line', link: '/en/arex/installation/' },
      { text: 'Client configuration', link: '/en/arex/installation/configuration' },
      { text: 'Authentication', link: '/en/arex/agents/authentication' },
      { text: 'Concepts and IDs', link: '/en/arex/agents/concepts' },
      { text: 'Output contract', link: '/en/arex/agents/output-contract' },
      { text: 'Diagnose a failed replay', link: '/en/arex/examples/agent-diagnose-replay' },
      { text: 'Policy YAML reference', link: '/en/arex/policy-yaml-guide' },
      { text: 'Replay trigger Open API', link: '/en/arex/reference/replay-openapi' },
      { text: 'CLI to backend API mapping', link: '/en/arex/reference/api-mapping' },
      { text: 'Log query fields', link: '/en/arex/commands/log-query-fields' },
      { text: 'Replay send log markers', link: '/en/arex/reference/replay-send-log-markers' },
      { text: 'Metrics data plane', link: '/en/arex/installation/metrics-data-plane' },
    ],
  },
  {
    text: 'Command reference',
    collapsed: true,
    items: [
      { text: 'Overview', link: '/en/arex/commands/' },
      { text: 'sp setup', link: '/en/arex/commands/setup' },
      { text: 'sp auth', link: '/en/arex/commands/auth' },
      { text: 'sp config', link: '/en/arex/commands/config' },
      { text: 'sp app', link: '/en/arex/commands/app' },
      { text: 'sp agent', link: '/en/arex/commands/agent' },
      { text: 'sp record', link: '/en/arex/commands/record' },
      { text: 'sp case, sp test, sp mcp', link: '/en/arex/commands/case' },
      { text: 'sp replay', link: '/en/arex/commands/replay' },
      { text: 'sp replay case', link: '/en/arex/commands/replay-case' },
      { text: 'sp replay diff', link: '/en/arex/commands/replay-diff' },
      { text: 'sp diagnose', link: '/en/arex/commands/diagnose' },
      { text: 'sp logs', link: '/en/arex/commands/logs' },
      { text: 'sp trace', link: '/en/arex/commands/trace' },
      { text: 'sp extraction-rule', link: '/en/arex/commands/extraction-rule' },
      { text: 'sp policy', link: '/en/arex/commands/policy' },
      { text: 'sp health', link: '/en/arex/commands/health' },
      { text: 'sp tenant', link: '/en/arex/commands/tenant' },
      { text: 'sp tunnel', link: '/en/arex/commands/tunnel' },
      { text: 'sp group', link: '/en/arex/commands/group' },
      { text: 'sp system', link: '/en/arex/commands/system' },
      { text: 'sp ops', link: '/en/arex/commands/ops' },
      { text: 'sp demo', link: '/en/arex/commands/demo' },
    ],
  },
]

// 测试侧栏按读者分组：所有人 → 控制台使用者 → 运维与实施 → 流水线 → 对接开发 → 命令参考。
const testingSidebarZh = [
  {
    text: '了解与开始',
    items: [
      { text: '什么是流量回放测试', link: '/zh/arex/' },
      { text: '第一次录制回放', link: '/zh/arex/getting-started' },
      { text: '工作原理', link: '/zh/arex/how-it-works' },
      { text: '功能、适用范围与资源需求', link: '/zh/arex/core-features-and-performance' },
    ],
  },
  {
    text: '最佳实践',
    items: [
      { text: 'CI/CD 发版回归', link: '/zh/arex/best-practices/release-regression' },
    ],
  },
  {
    text: '日常使用',
    collapsed: false,
    items: [
      { text: '查看录制', link: '/zh/arex/recording' },
      { text: '固化用例', link: '/zh/arex/pinned-cases' },
      { text: '测试用例管理', link: '/zh/arex/test-case-management' },
      { text: '发起回放与定时回放', link: '/zh/arex/replay-and-diff' },
      { text: '回放报告', link: '/zh/arex/replay-report' },
      { text: '审查差异', link: '/zh/arex/review-diffs-in-the-web-ui' },
      { text: '配置对比规则', link: '/zh/arex/compare-rules-web-ui' },
      { text: '录制配置与回放配置', link: '/zh/arex/policies' },
    ],
  },
  {
    text: '部署与运维',
    collapsed: false,
    items: [
      { text: '选择部署方式', link: '/zh/arex/installation/deployment' },
      { text: '部署前准备：资源与网络', link: '/zh/arex/installation/preparation' },
      { text: '单机部署（All-in-One）', link: '/zh/arex/installation/all-in-one' },
      { text: 'Kubernetes 部署（Helm）', link: '/zh/arex/installation/server' },
      { text: '支持的 Java 版本与框架', link: '/zh/arex/supported-frameworks' },
      { text: '接入 Java Agent', link: '/zh/arex/java-agent' },
      { text: '数据保护与保留期', link: '/zh/arex/installation/data-protection' },
      { text: '配置 AI 诊断与代码仓库', link: '/zh/arex/installation/ai-diagnosis' },
      { text: '平台维护与故障排查', link: '/zh/arex/installation/operations' },
    ],
  },
  {
    text: '流水线与通知',
    collapsed: false,
    items: [
      { text: '发版后自动回放（CI/CD）', link: '/zh/arex/webhook-and-ci' },
      { text: '回放结果通知', link: '/zh/arex/notifications' },
      { text: '用 Git 管理策略', link: '/zh/arex/examples/gitops-policies' },
    ],
  },
  {
    text: '开发对接与 AI 代理',
    collapsed: true,
    items: [
      { text: '选择接入方式', link: '/zh/arex/agents/overview' },
      { text: '安装 sp 命令行', link: '/zh/arex/installation/' },
      { text: '客户端配置', link: '/zh/arex/installation/configuration' },
      { text: '认证与凭据', link: '/zh/arex/agents/authentication' },
      { text: '概念与编号', link: '/zh/arex/agents/concepts' },
      { text: '输出约定', link: '/zh/arex/agents/output-contract' },
      { text: '排查回放失败', link: '/zh/arex/examples/agent-diagnose-replay' },
      { text: '策略 YAML 参考', link: '/zh/arex/policy-yaml-guide' },
      { text: '回放触发 Open API', link: '/zh/arex/reference/replay-openapi' },
      { text: '命令与后端接口对照', link: '/zh/arex/reference/api-mapping' },
      { text: '日志查询字段', link: '/zh/arex/commands/log-query-fields' },
      { text: '回放发送日志标记', link: '/zh/arex/reference/replay-send-log-markers' },
      { text: '指标数据接口', link: '/zh/arex/installation/metrics-data-plane' },
    ],
  },
  {
    text: '命令参考',
    collapsed: true,
    items: [
      { text: '命令总览', link: '/zh/arex/commands/' },
      { text: 'sp setup', link: '/zh/arex/commands/setup' },
      { text: 'sp auth', link: '/zh/arex/commands/auth' },
      { text: 'sp config', link: '/zh/arex/commands/config' },
      { text: 'sp app', link: '/zh/arex/commands/app' },
      { text: 'sp agent', link: '/zh/arex/commands/agent' },
      { text: 'sp record', link: '/zh/arex/commands/record' },
      { text: 'sp case、sp test、sp mcp', link: '/zh/arex/commands/case' },
      { text: 'sp replay', link: '/zh/arex/commands/replay' },
      { text: 'sp replay case', link: '/zh/arex/commands/replay-case' },
      { text: 'sp replay diff', link: '/zh/arex/commands/replay-diff' },
      { text: 'sp diagnose', link: '/zh/arex/commands/diagnose' },
      { text: 'sp logs', link: '/zh/arex/commands/logs' },
      { text: 'sp trace', link: '/zh/arex/commands/trace' },
      { text: 'sp extraction-rule', link: '/zh/arex/commands/extraction-rule' },
      { text: 'sp policy', link: '/zh/arex/commands/policy' },
      { text: 'sp health', link: '/zh/arex/commands/health' },
      { text: 'sp tenant', link: '/zh/arex/commands/tenant' },
      { text: 'sp tunnel', link: '/zh/arex/commands/tunnel' },
      { text: 'sp group', link: '/zh/arex/commands/group' },
      { text: 'sp system', link: '/zh/arex/commands/system' },
      { text: 'sp ops', link: '/zh/arex/commands/ops' },
      { text: 'sp demo', link: '/zh/arex/commands/demo' },
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
      { text: 'What is Blackbox', link: '/en/blackbox/' },
      { text: 'Quick start', link: '/en/blackbox/getting-started' },
      { text: 'Self-hosting', link: '/en/blackbox/self-hosting' },
      { text: 'End-to-end session tracing', link: '/en/blackbox/end-to-end-session-tracing' },
      { text: 'Concepts', link: '/en/blackbox/concepts' },
    ],
  },
  {
    text: 'Instrument your app',
    items: [
      { text: 'Vercel AI SDK', link: '/en/blackbox/vercel-ai-sdk' },
      { text: 'LangChain and LangGraph', link: '/en/blackbox/langchain' },
      { text: 'OpenCode', link: '/en/blackbox/opencode' },
    ],
  },
  {
    text: 'Investigate Sessions',
    items: [
      { text: 'Blackbox MCP (coding agents)', link: '/en/blackbox/coding-agent-skills' },
      { text: 'Generate UI tests from sessions', link: '/en/ui-testing/from-sessions' },
    ],
  },
  {
    text: 'SDK & API reference',
    items: [
      { text: 'JavaScript / TypeScript (softprobe-js)', link: '/en/blackbox/reference/softprobe-js' },
      { text: 'Python (softprobe-py)', link: '/en/blackbox/reference/softprobe-py' },
    ],
  },
]

const uiTestingSidebarEn = [
  {
    text: 'Get started',
    items: [
      { text: 'Overview', link: '/en/ui-testing/' },
      { text: 'Tutorial: Build your first test', link: '/en/ui-testing/tutorial' },
    ],
  },
  {
    text: 'Author and run tests',
    items: [
      { text: 'Generate from recorded sessions', link: '/en/ui-testing/from-sessions' },
      { text: 'Write in plain English (e2e)', link: '/en/ui-testing/natural-language' },
    ],
  },
  {
    text: 'SDK & CLI reference',
    items: [
      { text: '@softprobe/e2e & web-record', link: '/en/blackbox/reference/softprobe-js' },
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
      { text: '什么是 Blackbox', link: '/zh/blackbox/' },
      { text: '快速开始', link: '/zh/blackbox/getting-started' },
      { text: '概念', link: '/zh/blackbox/concepts' },
      { text: '用编码 Agent 排查', link: '/zh/blackbox/coding-agent-skills' },
      { text: '从录制的会话生成 UI 测试', link: '/zh/ui-testing/from-sessions' },
    ],
  },
  {
    text: '集成',
    items: [
      { text: 'OpenCode', link: '/zh/blackbox/opencode' },
      { text: 'LangChain', link: '/zh/blackbox/langchain' },
    ],
  },
]

const uiTestingSidebarZh = [
  {
    text: '开始使用',
    items: [
      { text: '概览', link: '/zh/ui-testing/' },
      { text: '教程：构建第一个测试', link: '/zh/ui-testing/tutorial' },
    ],
  },
  {
    text: '编写与运行测试',
    items: [
      { text: '从录制的会话生成测试', link: '/zh/ui-testing/from-sessions' },
      { text: '用自然语言编写测试（e2e）', link: '/zh/ui-testing/natural-language' },
    ],
  },
  {
    text: 'SDK 与 CLI 参考',
    items: [
      { text: '@softprobe/e2e 与 web-record', link: '/en/blackbox/reference/softprobe-js' },
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
  const testingBase = locale === 'zh' ? '/zh/arex/' : '/en/arex/'
  const sidebars: Record<string, typeof platformSidebarEn> = {
    [platformBase]: platform,
    [testingBase]: testing,
  }
  if (locale === 'en') {
    sidebars['/en/blackbox/'] = agentQaSidebarEn
    sidebars['/en/ui-testing/'] = uiTestingSidebarEn
    sidebars['/en/lisa/'] = lisaSidebarEn
  } else {
    sidebars['/zh/blackbox/'] = agentQaSidebarZh
    sidebars['/zh/ui-testing/'] = uiTestingSidebarZh
    sidebars['/zh/lisa/'] = lisaSidebarZh
  }
  return sidebars
}

export default withMermaid(
  defineConfig({
  title: 'Softprobe',
  description: 'Softprobe documentation for Arex, Blackbox, UI Testing, and Lisa',
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
          'Softprobe documentation for Arex (service record-replay testing and sp CLI), Blackbox (end-to-end session tracing and MCP), UI Testing (Playwright and zero-LLM e2e browser tests with backend trace verification), and Lisa (AI QA policy evaluation agent).',
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
