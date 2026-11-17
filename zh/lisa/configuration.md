# 运行时配置

Lisa 通过环境变量进行配置，运行数据保存在 Lisa 自有的 PostgreSQL 与文件系统中，不依赖 TheLake。

| 变量 | 用途 |
|---|---|
| `LISA_WORKSPACE_ID` | 单个 Lisa 运行时部署的 UUID 作用域。 |
| `LISA_DATABASE_URL` | Lisa 应用与 Worker 使用的 PostgreSQL 写连接。 |
| `LISA_DATABASE_READ_URL` | Lisa 数据库工具使用的只读 PostgreSQL 连接。 |
| `LISA_DATABASE_PROVISION_URL` | 仅部署时使用的管理员连接（供 `scripts/provision_lisa.py` 使用）。 |
| `LISA_DATABASE_WRITER_PASSWORD` / `LISA_DATABASE_READER_PASSWORD` | 创建数据库时初始化运行时角色的密码。 |
| `LISA_SERVICE_TOKEN` | 内部认证 API 路由使用的 Bearer Token。 |
| `LISA_MODEL` | 对话模型标识（默认 `gemini/gemini-3.8-flash`）。 |
| `GOOGLE_API_KEY` / `GEMINI_API_KEY` | 用于对话与策略裁决的 Gemini 密钥。 |
| `OPENAI_API_KEY` | 用于 OpenAI 策略分诊的密钥。 |
| `GEMINI_MODEL_NAME` | 裁决模型（默认 `gemini-3.8-flash`）。 |
| `LISA_DATA_DIR` | OpenHands 与对话状态的根目录。 |
| `LISA_AGENT_WORKSPACE_ROOT` | 接收推送 OTLP 会话包的根目录。 |
| `LISA_MAX_SESSION_TRACE_BYTES` | 推送会话轨迹的最大请求体（默认 16 MiB，上限 64 MiB）。 |
| `LISA_CORS_ORIGINS` | 允许跨域访问的浏览器来源列表（逗号分隔）。 |
| `LISA_OWNER_USER_IDS` | 有权批准策略变更的 Lisa 用户 ID。 |
| `SOFTPROBE_ASSERTION_HMAC_SECRET` | 启用签名工作区断言时的 HMAC 密钥。 |
| `LISA_SLACK_*` | 可选的 Slack 事件与通知配置。 |
| `LISA_STATIC_DIR` | 前端静态资源目录（镜像内默认为 `/app/static`）。 |

> [!WARNING]
> `POST /internal/v1/session-traces` 不校验身份凭证，必须仅部署在私网中，切勿暴露在公网入口上。
