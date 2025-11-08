---
sidebar_position: 6
---

# 前端插件安装

本指南介绍 Softprobe Web SDK (@softprobe/web-inspector) 的安装和使用方法。

## 功能特性

Softprobe Web SDK 旨在全面洞察您的 Web 应用程序性能和用户行为。主要功能包括：

- **自动性能监控**: 自动捕获并报告关键页面加载性能指标。
- **用户交互追踪**: 记录用户交互行为（如点击、滚动和表单提交），帮助您理解用户使用路径。
- **网络请求追踪**: 监控所有 fetch 和 XMLHttpRequest 请求，识别缓慢或失败的 API 调用。
- **环境和会话记录**: 通过记录浏览器、操作系统和设备信息来收集有价值的上下文信息，并将单个用户会话中的所有事件进行分组。
- **自定义埋点**: 提供简洁的 API 来创建自定义 Span，用于追踪特定的业务逻辑或用户交互。

## 安装

使用您偏好的包管理器安装此包：

```bash
npm install @softprobe/web-inspector
```

## 使用方法

### 初始化

在您的 Web 应用程序的入口点初始化监听器。

```typescript
import { initInspector } from "@softprobe/web-inspector";

// 只需调用一次 register
export function register() {
  // 初始化客户端
  initInspector({
    apiKey: "",
    userId: "",
    serviceName: "YOUR_SERVICE_NAME",
    // 数据收集器端点: <INSPECTOR_COLLECTOR_URL>/v1/traces
    collectorEndpoint: process.env.INSPECTOR_COLLECTOR_URL!,
    // 在开发环境中自动启用控制台日志记录
    env: "dev",
    // 可选: 禁用滚动观察
    observeScroll: false,
  })
    .then(({ provider }) => {
      console.log("Softprobe inspector initialized successfully.");
    })
    .catch((error) => {
      console.error("Failed to initialize Softprobe inspector:", error);
    });
}
```

### 手动创建 Span

您可以创建自定义 Span 来追踪特定的业务逻辑或用户交互。

```typescript
// 在 React 组件中的示例 (例如, pages/index.tsx)
import { trace } from "@softprobe/web-inspector";

export default function Home() {
  const handleClick = () => {
    // 获取 Tracer 实例
    const tracer = trace.getTracer("nextjs-tracer");

    // 启动一个新的 Span
    const span = tracer.startSpan("checkout_process");

    try {
      // 您的业务逻辑在此处...
      // 示例: 处理购物车中的商品

      // 为 Span 添加属性以提供上下文
      span.setAttribute("item_count", 3);
      span.setAttribute("user_tier", "gold");

      // 成功时将 Span 状态设置为 OK
      span.setStatus({ code: trace.SpanStatusCode.OK });
    } catch (error) {
      // 失败时将 Span 状态设置为 ERROR
      span.setStatus({
        code: trace.SpanStatusCode.ERROR,
        message: error.message,
      });
    } finally {
      // 结束 Span 以记录它
      span.end();
    }
  };

  return <button onClick={handleClick}>Start Checkout</button>;
}
```
