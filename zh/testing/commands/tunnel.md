---
title: sp tunnel：反向隧道
---

# sp tunnel：反向隧道

从后端到你本机服务开一条反向隧道，让 **Softprobe Cloud** 上发起的回放能打到只监听 `localhost` 的服务。自建后端能直接访问被测服务时，不需要它。

```bash
sp tunnel --port 8080 --app <appId>
```

回放期间在单独的终端里保持运行，用 `Ctrl+C` 停止。连接断开后每 5 秒自动重连。

## 参数 {#flags}

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--port` | `8080` | 接收回放请求的本机服务端口 |
| `--app` | `sp demo start` 记下的应用 | 哪个 `appId` 的回放流量走这条隧道 |
| `--url` | 根据后端地址推出 | 指定隧道的 WebSocket 地址，如 `ws://localhost:8090/api/ws/tunnel` |

隧道用你的登录凭据连接 `<后端地址>/api/ws/tunnel`（后端是 `https://` 时用 `wss://`）。

## 配合演示环境 {#with-the-demo}

演示应用跑在你本机、后端是 Softprobe Cloud 时，`sp demo replay` 需要这条隧道：

```bash
sp demo start
sp tunnel --port 8080      # 在另一个终端运行
sp demo replay
```

## 相关文档 {#related}

- [sp demo](./demo)
- [sp replay](./replay)
