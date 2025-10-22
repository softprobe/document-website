---
sidebar_position: 3
---

# Web SDK

本指南介绍了 Softprobe Web SDK (`@softprobe/web-inspector`) 的安装和使用方法。

## 功能特性

Softprobe Web SDK 旨在为您的 Web 应用程序的性能和用户行为提供全面的洞察。主要功能包括：

- **自动性能监控**: 自动捕获并报告关键的页面加载性能指标。
- **用户交互追踪**: 记录用户的点击、滚动和表单提交等交互，帮助您理解用户旅程。
- **网络请求追踪**: 监控所有的 `fetch` 和 `XMLHttpRequest` 请求，以识别缓慢或失败的 API 调用。
- **环境与会话记录**: 通过记录浏览器、操作系统和设备信息来收集有价值的上下文，并将所有事件分组到单个用户会话中。
- **自定义埋点**: 提供简单的 API 来创建自定义 Span，用于追踪特定的业务逻辑或用户交互。

## 安装

使用您偏好的包管理器来安装：

```bash
npm install @softprobe/web-inspector
```

## 使用

### 初始化

在您的 Web 应用程序的入口点初始化 Inspector。

```typescript
import { initInspector } from "@softprobe/web-inspector";

// 只需要调用一次 register
export function register() {
  // 初始化客户端
  initInspector({
    apiKey: "",
    userId: "",
    serviceName: "YOUR_SERVICE_NAME",
    // 数据收集端点: <INSPECTOR_COLLECTOR_URL>/v1/traces
    collectorEndpoint: process.env.INSPECTOR_COLLECTOR_URL!,
    // 在开发环境中自动启用控制台日志
    env: "dev",
    // 可选：禁用滚动观察
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
import { trace } from '@softprobe/web-inspector';

export default function Home() {
  const handleClick = () => {
    // 获取一个 tracer 实例
    const tracer = trace.getTracer('nextjs-tracer');

    // 开始一个新的 span
    const span = tracer.startSpan('checkout_process');

    try {
      // 您的业务逻辑...
      // 示例：处理购物车中的商品

      // 为 span 添加属性以提供上下文
      span.setAttribute('item_count', 3);
      span.setAttribute('user_tier', 'gold');

      // 成功时将 span 状态设置为 OK
      span.setStatus({ code: trace.SpanStatusCode.OK });

    } catch (error) {
      // 失败时将 span 状态设置为 ERROR
      span.setStatus({
        code: trace.SpanStatusCode.ERROR,
        message: error.message
      });

    } finally {
      // 结束 span 以记录它
      span.end();
    }
  };

  return <button onClick={handleClick}>开始结算</button>;
}
```

