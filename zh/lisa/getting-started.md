# Lisa 快速开始

在本地运行 PostgreSQL、Lisa Python 服务与内置 React 前端。

## 环境要求

- Python 3.12+ 与 `uv`
- Node.js 22+
- Docker（或带 PGMQ 扩展的本地 PostgreSQL 实例）

## 1. 安装依赖

在 `lisa/` 仓库根目录执行：

```sh
cp .env.example .env
uv sync --extra test
npm --prefix frontend ci
```

## 2. 初始化数据库并启动服务

初始化 PostgreSQL Schema 与角色后，启动 FastAPI 服务：

```sh
uv run python scripts/provision_lisa.py
uv run uvicorn lisa.app:app --reload --app-dir src --port 8082
```

访问 `http://127.0.0.1:8082/` 即可在同一域名下使用 Lisa UI 与 API。

## 3. 推送会话轨迹

向私网接入端点推送完整的 OTLP JSON 会话包：

```sh
curl -X POST http://127.0.0.1:8082/internal/v1/session-traces \
  -H "Content-Type: application/json" \
  -d @session-otlp.json
```

当文件落盘与 PGMQ 入队均成功后，Lisa 会返回 `202 Accepted`。

## 构建容器镜像

构建包含前端静态资源的自包含镜像：

```sh
docker build -t lisa:local .
```
