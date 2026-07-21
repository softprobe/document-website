import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import llmstxt from 'vitepress-plugin-llms'
import { themeConfigForLocale, type DocLocale } from './theme/shared'

// Testing sidebar, organised by Diátaxis (explanation → how-to → reference).
const testingSidebarEn = [
  {
    text: 'Get started',
    items: [
      { text: 'What is Softprobe Testing', link: '/en/testing/' },
      { text: 'Quick start', link: '/en/testing/getting-started' },
      { text: 'How it works', link: '/en/testing/how-it-works' },
    ],
  },
  {
    text: 'Deploy the platform',
    collapsed: false,
    items: [
      { text: 'Server (Helm)', link: '/en/testing/installation/server' },
      { text: 'Metrics data plane', link: '/en/testing/installation/metrics-data-plane' },
    ],
  },
  {
    text: 'Onboard your app',
    collapsed: false,
    items: [
      { text: 'Install the CLI', link: '/en/testing/installation/' },
      { text: 'Supported frameworks', link: '/en/testing/supported-frameworks' },
      { text: 'Download Java agent', link: '/en/testing/download-java-agent' },
      { text: 'Attach the Java agent', link: '/en/testing/java-agent' },
      { text: 'Launch the Web UI', link: '/en/testing/installation/code' },
      { text: 'Doctor', link: '/en/testing/installation/doctor' },
      { text: 'Upgrade', link: '/en/testing/installation/upgrade' },
    ],
  },
  {
    text: 'Core workflow',
    collapsed: false,
    items: [
      { text: 'Record traffic', link: '/en/testing/recording' },
      { text: 'Pin cases & test sets', link: '/en/testing/pinned-cases' },
      { text: 'Replay & diff', link: '/en/testing/replay-and-diff' },
      { text: 'Review diffs', link: '/en/testing/review-diffs-in-the-web-ui' },
      { text: 'Configure compare rules', link: '/en/testing/compare-rules-web-ui' },
    ],
  },
  {
    text: 'Policies',
    collapsed: false,
    items: [{ text: 'Policies overview', link: '/en/testing/policies' }],
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
      { text: 'Policy YAML guide', link: '/en/testing/policy-yaml-guide' },
      { text: 'Client configuration', link: '/en/testing/installation/configuration' },
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
      { text: '快速开始', link: '/zh/testing/getting-started' },
      { text: '工作原理', link: '/zh/testing/how-it-works' },
    ],
  },
  {
    text: '部署平台',
    collapsed: false,
    items: [
      { text: '服务端（Helm）', link: '/zh/testing/installation/server' },
      { text: 'Metrics 数据面', link: '/zh/testing/installation/metrics-data-plane' },
    ],
  },
  {
    text: '接入你的应用',
    collapsed: false,
    items: [
      { text: '安装 CLI', link: '/zh/testing/installation/' },
      { text: '支持的框架', link: '/zh/testing/supported-frameworks' },
      { text: '下载 Java Agent', link: '/zh/testing/download-java-agent' },
      { text: '接入 Java Agent', link: '/zh/testing/java-agent' },
      { text: '启动 Web UI', link: '/zh/testing/installation/code' },
      { text: 'Doctor', link: '/zh/testing/installation/doctor' },
      { text: '升级', link: '/zh/testing/installation/upgrade' },
    ],
  },
  {
    text: '核心流程',
    collapsed: false,
    items: [
      { text: '录制流量', link: '/zh/testing/recording' },
      { text: '固化用例与测试集', link: '/zh/testing/pinned-cases' },
      { text: '回放与对比', link: '/zh/testing/replay-and-diff' },
      { text: '审查差异', link: '/zh/testing/review-diffs-in-the-web-ui' },
      { text: '配置对比规则', link: '/zh/testing/compare-rules-web-ui' },
    ],
  },
  {
    text: '策略 Policies',
    collapsed: false,
    items: [{ text: '策略概览', link: '/zh/testing/policies' }],
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
      { text: '策略 YAML 指南', link: '/zh/testing/policy-yaml-guide' },
      { text: '客户端配置', link: '/zh/testing/installation/configuration' },
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

const evaluationSidebarEn = [
  {
    text: 'Get started',
    items: [
      { text: 'What is Agent Evaluation', link: '/en/evaluation/' },
      { text: 'Mental model', link: '/en/evaluation/mental-model' },
      { text: 'Quick start', link: '/en/evaluation/getting-started' },
      { text: 'How it works', link: '/en/evaluation/how-it-works' },
    ],
  },
  {
    text: 'Concepts',
    collapsed: false,
    items: [
      { text: 'Concepts overview', link: '/en/evaluation/concepts/' },
      { text: 'Terminology', link: '/en/evaluation/concepts/terminology' },
      { text: 'Data model', link: '/en/evaluation/concepts/data-model' },
      { text: 'Ecosystem mapping', link: '/en/evaluation/concepts/ecosystem-mapping' },
      { text: 'Evaluation loop', link: '/en/evaluation/concepts/evaluation-loop' },
      { text: 'Scores and gates', link: '/en/evaluation/concepts/scores-and-gates' },
      { text: 'Evidence and trajectories', link: '/en/evaluation/concepts/evidence-and-trajectories' },
      { text: 'Trials and aggregates', link: '/en/evaluation/concepts/trials-and-aggregates' },
      { text: 'Correlation and traces', link: '/en/evaluation/concepts/correlation-and-traces' },
      { text: 'Online evaluation', link: '/en/evaluation/concepts/online-evaluation' },
      { text: 'Human evaluation', link: '/en/evaluation/concepts/human-evaluation' },
      { text: 'Reproducibility', link: '/en/evaluation/concepts/reproducibility' },
      { text: 'Artifact visibility', link: '/en/evaluation/concepts/artifact-visibility' },
    ],
  },
  {
    text: 'Architecture',
    collapsed: false,
    items: [
      { text: 'Architecture overview', link: '/en/evaluation/architecture/' },
      { text: 'Kernel and hosts', link: '/en/evaluation/architecture/kernel-and-hosts' },
      { text: 'Execution DAG', link: '/en/evaluation/architecture/execution-dag' },
      { text: 'Plugin model', link: '/en/evaluation/architecture/plugin-model' },
      { text: 'Storage and thelake', link: '/en/evaluation/architecture/storage-and-thelake' },
      { text: 'Trust boundaries', link: '/en/evaluation/architecture/trust-boundaries' },
    ],
  },
  {
    text: 'Guides',
    collapsed: false,
    items: [
      { text: 'Author a suite', link: '/en/evaluation/guides/author-a-suite' },
      { text: 'Run locally and in CI', link: '/en/evaluation/guides/run-locally-and-ci' },
      { text: 'Compare and promote', link: '/en/evaluation/guides/compare-and-promote' },
      { text: 'Promptfoo integration', link: '/en/evaluation/guides/promptfoo-integration' },
      { text: 'Langfuse and Braintrust adoption', link: '/en/evaluation/guides/langfuse-and-braintrust-adoption' },
      { text: 'Production-to-eval loop', link: '/en/evaluation/guides/production-to-eval-loop' },
      { text: 'Prompt-only vs environment eval', link: '/en/evaluation/guides/eval-modes' },
    ],
  },
  {
    text: 'Evaluators',
    collapsed: false,
    items: [
      { text: 'Evaluator taxonomy', link: '/en/evaluation/evaluators/' },
      { text: 'Deterministic', link: '/en/evaluation/evaluators/deterministic' },
      { text: 'Similarity and statistical', link: '/en/evaluation/evaluators/similarity-and-statistical' },
      { text: 'Reference-based quality', link: '/en/evaluation/evaluators/reference-based-quality' },
      { text: 'LLM judge', link: '/en/evaluation/evaluators/llm-judge' },
      { text: 'Comparative judge', link: '/en/evaluation/evaluators/comparative-judge' },
      { text: 'Trajectory and tools', link: '/en/evaluation/evaluators/trajectory-and-tools' },
      { text: 'Environment outcome', link: '/en/evaluation/evaluators/environment-outcome' },
      { text: 'Multi-turn and multi-agent', link: '/en/evaluation/evaluators/multi-turn-and-multi-agent' },
      { text: 'Human annotation', link: '/en/evaluation/evaluators/human-annotation' },
      { text: 'Production and online', link: '/en/evaluation/evaluators/production-online' },
      { text: 'Robustness and security', link: '/en/evaluation/evaluators/robustness-and-security' },
      { text: 'Stochastic and repeated', link: '/en/evaluation/evaluators/stochastic-and-repeated' },
      { text: 'Meta-evaluation', link: '/en/evaluation/evaluators/meta-evaluation' },
    ],
  },
  {
    text: 'Reference',
    collapsed: true,
    items: [
      { text: 'CLI', link: '/en/evaluation/reference/cli' },
      { text: 'REST API', link: '/en/evaluation/reference/api' },
      { text: 'Result status', link: '/en/evaluation/reference/result-status' },
      { text: 'Events', link: '/en/evaluation/reference/events' },
      { text: 'Score targets', link: '/en/evaluation/reference/score-targets' },
      { text: 'Capability descriptors', link: '/en/evaluation/reference/capability-descriptors' },
      { text: 'Promptfoo field mapping', link: '/en/evaluation/reference/promptfoo-mapping' },
    ],
  },
  {
    text: 'For AI agents',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/evaluation/agents/overview' },
      { text: 'Output contract', link: '/en/evaluation/agents/output-contract' },
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
    sidebars['/en/evaluation/'] = evaluationSidebarEn
  }
  return sidebars
}

export default withMermaid(
  defineConfig({
  title: 'Softprobe',
  description: 'Softprobe platform, Java record-replay testing, agent evaluation, and sp CLI documentation',
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
    plugins: [
      // Generate /llms.txt (index) and /llms-full.txt (all docs) plus a .md
      // endpoint per page, so AI coding agents can consume the docs directly.
      llmstxt({
        ignoreFiles: ['**/implementer/**'],
        description:
          'Softprobe — business observability (Istio/SESSIFY), Java record-replay testing, and agent evaluation driven by the sp CLI and AI agents.',
      }),
    ],
  },
  head: [
    ['link', { rel: 'icon', href: '/img/sp-logo-trans.ico' }],
    ['meta', { name: 'theme-color', content: '#A14EFF' }],
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
