---
title: 手动启动 Softprobe Web UI
---

# 手动启动 Softprobe Web UI

大多数测试工作都在浏览器里的 **Softprobe Web UI** 中完成——录制、回放、查看 trace 等。

本页说明如何在**自己的开发机**上启动该 UI，适合在笔记本或工作站上做个人测试。这与团队共用的**共享 Web 工作台**（同一内网 URL、多人访问）不是同一种方式；可选的服务端安装见安装页中的 [Spcode Service](./#spcode-service)。

## 在开发机上启动 UI

```bash
sp code web --port 4096
```

然后在浏览器打开 `http://127.0.0.1:4096`（或你指定的地址与端口）。UI 会使用你在 `sp setup` 中配置的**个人**后端 URL 与设置。

也可以在终端中启动编码体验（不打开浏览器）：

```bash
sp code
```

若 Web UI 无法启动，请运行 `sp doctor` 并按提示修复，或通过 `sp upgrade` 更新安装。

## 开发机 vs 共享工作台

| | 开发机（本页） | 共享 Web 工作台（可选） |
|--|----------------|-------------------------|
| **适用对象** | 你本人、本机 | 组织内多人共用同一入口 |
| **典型场景** | 本地开发时自测 | 同事在同一网络用浏览器打开同一工作台 |
| **启动方式** | 在 shell 中运行 `sp code web` | 安装时选择 `sp setup --install-spcode-service`（[Spcode Service](./#spcode-service)） |
| **配置** | `sp setup` 写入的 Softprobe 设置 | 与安装 Spcode Service 的账号相同的 Softprobe 设置 |

只有你使用这台机器时，用开发机方式即可。需要多人通过浏览器共用同一工作台时，再考虑 Spcode Service。

## 下一步

UI 能打开后，接入流程就齐了。还没跑过完整流程的话从 [快速开始](/zh/testing/getting-started) 走一遍；已有录制用例的话，回放后在这里 [审查差异](/zh/testing/review-diffs-in-the-web-ui)。
