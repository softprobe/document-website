import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import llmstxt from 'vitepress-plugin-llms'
import { themeConfigForLocale, type DocLocale } from './theme/shared'

// Testing sidebar, grouped by reader: everyone → console users → ops / delivery → pipelines → integrators → command reference.
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
      { text: 'Kubernetes deployment (Helm)', link: '/en/testing/installation/server' },
      { text: 'Supported Java versions and frameworks', link: '/en/testing/supported-frameworks' },
      { text: 'Attach the Java agent', link: '/en/testing/java-agent' },
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
      { text: 'Kubernetes 部署（Helm）', link: '/zh/testing/installation/server' },
      { text: '支持的 Java 版本与框架', link: '/zh/testing/supported-frameworks' },
      { text: '接入 Java Agent', link: '/zh/testing/java-agent' },
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
      { text: 'What is Agent QA', link: '/en/agent-qa/' },
      { text: 'Quick start', link: '/en/agent-qa/getting-started' },
      { text: 'Concepts', link: '/en/agent-qa/concepts' },
      { text: 'Coding agent skills', link: '/en/agent-qa/coding-agent-skills' },
    ],
  },
  {
    text: 'Integrations',
    items: [
      { text: 'OpenCode', link: '/en/agent-qa/opencode' },
      { text: 'LangChain', link: '/en/agent-qa/langchain' },
    ],
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
      { text: 'Native model and framework runners', link: '/en/evaluation/concepts/native-model-and-adapters' },
      { text: 'Terminology', link: '/en/evaluation/concepts/terminology' },
      { text: 'Data model', link: '/en/evaluation/concepts/data-model' },
      { text: 'Ecosystem mapping', link: '/en/evaluation/concepts/ecosystem-mapping' },
      { text: 'Evaluation loop', link: '/en/evaluation/concepts/evaluation-loop' },
      { text: 'Scores and gates', link: '/en/evaluation/concepts/scores-and-gates' },
      { text: 'Evidence and trajectories', link: '/en/evaluation/concepts/evidence-and-trajectories' },
      { text: 'Trials and aggregates', link: '/en/evaluation/concepts/trials-and-aggregates' },
      { text: 'Correlation and traces', link: '/en/evaluation/concepts/correlation-and-traces' },
      { text: 'Online vs offline evaluation', link: '/en/evaluation/concepts/online-vs-offline' },
      { text: 'Online evaluation', link: '/en/evaluation/concepts/online-evaluation' },
      { text: 'Annotation', link: '/en/evaluation/concepts/annotation' },
      { text: 'Human evaluation', link: '/en/evaluation/concepts/human-evaluation' },
      { text: 'Reproducibility', link: '/en/evaluation/concepts/reproducibility' },
      { text: 'Artifact visibility', link: '/en/evaluation/concepts/artifact-visibility' },
      { text: 'Environment bundles and tapes', link: '/en/evaluation/concepts/environment-bundles' },
    ],
  },
  {
    text: 'Architecture',
    collapsed: false,
    items: [
      { text: 'Architecture overview', link: '/en/evaluation/architecture/' },
      { text: 'Kernel and hosts', link: '/en/evaluation/architecture/kernel-and-hosts' },
      { text: 'Execution DAG', link: '/en/evaluation/architecture/execution-dag' },
      { text: 'Extension model', link: '/en/evaluation/architecture/plugin-model' },
      { text: 'Storage and thelake', link: '/en/evaluation/architecture/storage-and-thelake' },
      { text: 'Trust boundaries', link: '/en/evaluation/architecture/trust-boundaries' },
    ],
  },
  {
    text: 'Guides',
    collapsed: false,
    items: [
      { text: 'Prepare a framework run', link: '/en/evaluation/guides/author-a-suite' },
      { text: 'Run locally and in CI', link: '/en/evaluation/guides/run-locally-and-ci' },
      { text: 'Compare and promote', link: '/en/evaluation/guides/compare-and-promote' },
      { text: 'Promptfoo integration', link: '/en/evaluation/guides/promptfoo-integration' },
      { text: 'Langfuse and Braintrust adoption', link: '/en/evaluation/guides/langfuse-and-braintrust-adoption' },
      { text: 'Production-to-eval loop', link: '/en/evaluation/guides/production-to-eval-loop' },
      { text: 'Promptfoo on production OTEL traces', link: '/en/evaluation/guides/promptfoo-online-otel' },
      { text: 'Prompt-only vs environment eval', link: '/en/evaluation/guides/eval-modes' },
      { text: 'Record and replay agent environments', link: '/en/evaluation/guides/record-replay-agent-environment' },
      { text: 'Score an episode with Promptfoo', link: '/en/evaluation/guides/score-episode-with-promptfoo' },
      { text: 'Gym episodes and training rollouts', link: '/en/evaluation/guides/gym-and-training-rollouts' },
    ],
  },
  {
    text: 'Ecosystem methods',
    collapsed: false,
    items: [
      { text: 'Method families', link: '/en/evaluation/evaluators/' },
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
      { text: 'Framework runners', link: '/en/evaluation/reference/framework-adapters' },
      { text: 'Promptfoo mapping (legacy)', link: '/en/evaluation/reference/promptfoo-mapping' },
      { text: 'Node packages (agent environments)', link: '/en/evaluation/reference/node-packages' },
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

const agentQaSidebarZh = [
  {
    text: '开始使用',
    items: [
      { text: '什么是 Agent QA', link: '/zh/agent-qa/' },
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

const evaluationSidebarZh = [
  {
    text: '开始使用',
    items: [
      { text: '什么是 Agent Evaluation', link: '/zh/evaluation/' },
      { text: '心智模型', link: '/zh/evaluation/mental-model' },
      { text: '快速开始', link: '/zh/evaluation/getting-started' },
      { text: '工作原理', link: '/zh/evaluation/how-it-works' },
    ],
  },
  {
    text: '概念',
    collapsed: false,
    items: [
      { text: '概念概览', link: '/zh/evaluation/concepts/' },
      { text: '原生模型与框架运行器', link: '/zh/evaluation/concepts/native-model-and-adapters' },
      { text: '术语', link: '/zh/evaluation/concepts/terminology' },
      { text: '数据模型', link: '/zh/evaluation/concepts/data-model' },
      { text: '生态映射', link: '/zh/evaluation/concepts/ecosystem-mapping' },
      { text: '评估循环', link: '/zh/evaluation/concepts/evaluation-loop' },
      { text: '分数与门禁', link: '/zh/evaluation/concepts/scores-and-gates' },
      { text: '证据与轨迹', link: '/zh/evaluation/concepts/evidence-and-trajectories' },
      { text: '试验与聚合', link: '/zh/evaluation/concepts/trials-and-aggregates' },
      { text: '关联与 Trace', link: '/zh/evaluation/concepts/correlation-and-traces' },
      { text: '在线与离线评估', link: '/zh/evaluation/concepts/online-vs-offline' },
      { text: '在线评估', link: '/zh/evaluation/concepts/online-evaluation' },
      { text: '标注', link: '/zh/evaluation/concepts/annotation' },
      { text: '人工评估', link: '/zh/evaluation/concepts/human-evaluation' },
      { text: '可复现性', link: '/zh/evaluation/concepts/reproducibility' },
      { text: '产物可见性', link: '/zh/evaluation/concepts/artifact-visibility' },
      { text: '环境包与磁带', link: '/zh/evaluation/concepts/environment-bundles' },
    ],
  },
  {
    text: '架构',
    collapsed: false,
    items: [
      { text: '架构概览', link: '/zh/evaluation/architecture/' },
      { text: '内核与宿主', link: '/zh/evaluation/architecture/kernel-and-hosts' },
      { text: '执行 DAG', link: '/zh/evaluation/architecture/execution-dag' },
      { text: '扩展模型', link: '/zh/evaluation/architecture/plugin-model' },
      { text: '存储与 thelake', link: '/zh/evaluation/architecture/storage-and-thelake' },
      { text: '信任边界', link: '/zh/evaluation/architecture/trust-boundaries' },
    ],
  },
  {
    text: '指南',
    collapsed: false,
    items: [
      { text: '准备框架运行', link: '/zh/evaluation/guides/author-a-suite' },
      { text: '本地与 CI 运行', link: '/zh/evaluation/guides/run-locally-and-ci' },
      { text: '对比与晋级', link: '/zh/evaluation/guides/compare-and-promote' },
      { text: 'Promptfoo 集成', link: '/zh/evaluation/guides/promptfoo-integration' },
      { text: 'Langfuse 与 Braintrust 采纳', link: '/zh/evaluation/guides/langfuse-and-braintrust-adoption' },
      { text: '生产到评估闭环', link: '/zh/evaluation/guides/production-to-eval-loop' },
      { text: '在生产 OTEL Trace 上跑 Promptfoo', link: '/zh/evaluation/guides/promptfoo-online-otel' },
      { text: '仅提示词 vs 环境评估', link: '/zh/evaluation/guides/eval-modes' },
      { text: '录制与回放 Agent 环境', link: '/zh/evaluation/guides/record-replay-agent-environment' },
      { text: '用 Promptfoo 为 Episode 打分', link: '/zh/evaluation/guides/score-episode-with-promptfoo' },
      { text: 'Gym Episode 与训练 rollout', link: '/zh/evaluation/guides/gym-and-training-rollouts' },
    ],
  },
  {
    text: '生态方法',
    collapsed: false,
    items: [
      { text: '方法族', link: '/zh/evaluation/evaluators/' },
      { text: '确定性', link: '/zh/evaluation/evaluators/deterministic' },
      { text: '相似度与统计', link: '/zh/evaluation/evaluators/similarity-and-statistical' },
      { text: '基于参考的质量', link: '/zh/evaluation/evaluators/reference-based-quality' },
      { text: 'LLM Judge', link: '/zh/evaluation/evaluators/llm-judge' },
      { text: '对比 Judge', link: '/zh/evaluation/evaluators/comparative-judge' },
      { text: '轨迹与工具', link: '/zh/evaluation/evaluators/trajectory-and-tools' },
      { text: '环境结果', link: '/zh/evaluation/evaluators/environment-outcome' },
      { text: '多轮与多 Agent', link: '/zh/evaluation/evaluators/multi-turn-and-multi-agent' },
      { text: '人工标注', link: '/zh/evaluation/evaluators/human-annotation' },
      { text: '生产与在线', link: '/zh/evaluation/evaluators/production-online' },
      { text: '鲁棒性与安全', link: '/zh/evaluation/evaluators/robustness-and-security' },
      { text: '随机与重复', link: '/zh/evaluation/evaluators/stochastic-and-repeated' },
      { text: '元评估', link: '/zh/evaluation/evaluators/meta-evaluation' },
    ],
  },
  {
    text: '参考',
    collapsed: false,
    items: [
      { text: 'CLI', link: '/zh/evaluation/reference/cli' },
      { text: 'REST API', link: '/zh/evaluation/reference/api' },
      { text: '结果状态', link: '/zh/evaluation/reference/result-status' },
      { text: '事件', link: '/zh/evaluation/reference/events' },
      { text: '分数目标', link: '/zh/evaluation/reference/score-targets' },
      { text: '能力描述符', link: '/zh/evaluation/reference/capability-descriptors' },
      { text: '框架运行器', link: '/zh/evaluation/reference/framework-adapters' },
      { text: 'Promptfoo 映射（旧）', link: '/zh/evaluation/reference/promptfoo-mapping' },
      { text: 'Node 包（Agent 环境）', link: '/zh/evaluation/reference/node-packages' },
    ],
  },
  {
    text: '面向 AI Agent',
    collapsed: false,
    items: [
      { text: '概览', link: '/zh/evaluation/agents/overview' },
      { text: '输出约定', link: '/zh/evaluation/agents/output-contract' },
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
    sidebars['/en/evaluation/'] = evaluationSidebarEn
  } else {
    sidebars['/zh/agent-qa/'] = agentQaSidebarZh
    sidebars['/zh/evaluation/'] = evaluationSidebarZh
  }
  return sidebars
}

export default withMermaid(
  defineConfig({
  title: 'Softprobe',
  description: 'Softprobe platform, Java record-replay testing, Agent QA, agent evaluation, and sp CLI documentation',
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
          'Softprobe — business observability (Istio/SESSIFY), Java record-replay testing, Agent QA for coding agents, and agent evaluation driven by the sp CLI and AI agents.',
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
