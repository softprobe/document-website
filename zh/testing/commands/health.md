---
title: sp health：后端健康检查
---

# sp health：后端健康检查

**AI 代理何时使用：** 长时间诊断会话开始前做预检；CI 冒烟检查。

## 概要 {#synopsis}

检查 sp-backend 是否可用。

## 用法 {#usage}

```bash
sp health --json
sp health --api-url https://sp.example.com --json
```

## JSON 输出 {#json-output}

```json
{
  "ok": true,
  "command": "health",
  "data": {
    "status": "UP",
    "url": "http://127.0.0.1:8090"
  }
}
```

## REST 接口对照 {#rest-mapping}

| 方法 | 路径 |
|--------|------|
| GET | `/vi/health` |

默认部署不需要认证（请按你的环境核实）。

## 错误 {#errors}

| 情况 | 退出码 |
|-----------|------|
| 连接被拒绝 | 1 |
| HTTP 非 200 | 1 |

## 相关文档 {#related}

- [安装](/zh/testing/installation/)
