---
sidebar_position: 1
---

# SP-Istio Agent 介绍

**Istio 服务网格的业务级分布式追踪与分析**

无需代码更改 • 完整的请求可见性 • 高级故障排除

使用 Rust 和 WebAssembly (WASM) 构建的高性能异步 HTTP 会话捕获

## SP-Istio Agent 是什么？

SP-Istio Agent 是一个用于 Istio 的 WebAssembly (WASM) 插件，可捕获完整的 HTTP 请求/响应数据，并将其发送到 Softprobe 进行业务级分析和故障排除，而无需修改应用程序代码。

## 主要优势

- **🔍 完全可见性**: 在您的服务网格中捕获完整的 HTTP 请求/响应数据
- **🚀 更快的故障排除**: 业务级追踪将调试时间从数小时缩短到数分钟
- **📊 数据分析**: 深入了解 API 使用模式和业务流程
- **⚡ 零侵入**: 无需更改应用程序代码
- **🔒 企业级就绪**: 生产级的安全性和性能
- **🏎️ 高性能 & 异步**: Rust+WASM 流式、异步 HTTP 捕获，开销极小

## 入门

准备好开始了吗？请查看我们的 [快速入门指南](./getting-started/quick-start) 在几分钟内设置一个演示环境，或直接跳到 [安装指南](./getting-started/installation) 进行生产部署。

## 了解更多

- [架构](./architecture) - 了解 SP-Istio Agent 的工作原理
- [开发指南](./deployment/development) - 构建和测试扩展
- [故障排除](./deployment/troubleshooting) - 常见问题和解决方案
- [CI/CD 流水线](./cicd/) - 自动化测试和发布流程
