
本指南介绍 Softprobe SESSIFY (@softprobe/sessify) 的安装和使用方法。

## 功能特性

Softprobe SESSIFY 旨在全面洞察您的 Web 应用程序性能和用户行为。主要功能包括：

- **自动性能监控**: 自动捕获并报告关键页面加载性能指标。
- **用户交互追踪**: 记录用户交互行为（如点击、滚动和表单提交），帮助您理解用户使用路径。
- **网络请求追踪**: 监控所有 fetch 和 XMLHttpRequest 请求，识别缓慢或失败的 API 调用。
- **环境和会话记录**: 通过记录浏览器、操作系统和设备信息来收集有价值的上下文信息，并将单个用户会话中的所有事件进行分组。
- **自定义埋点**: 提供简洁的 API 来创建自定义 Span，用于追踪特定的业务逻辑或用户交互。
- **会话 ID 生成与贯穿追踪**: 每次打开一个浏览器标签页，SDK 会自动生成唯一的 sessionId，并在该标签页的生命周期内复用该 ID；该会话 ID 会随后续的所有事件、性能数据与网络请求一起上报，用于实现端到端（前端到后端）的关联与全链路追踪。

## 安装

使用您偏好的包管理器安装此包：

```bash
npm install @softprobe/sessify
```

## 使用方法

### 初始化

在您的 Web 应用程序的入口点初始化监听器。

```typescript
// src/components/InspectorInitializer.tsx
'use client'
import { useEffect } from 'react';
import { initInspector } from '@softprobe/sessify';
export const InspectorInitializer = () => {
  useEffect(() => {
    initInspector({
      publicKey: 'YOUR_PUBLIC_KEY',
      serviceName: "YOUR_SERVICE_NAME",
    })
  }, [])
  return null
}

// app/layout.tsx
import { InspectorInitializer } from '@/components/InspectorInitializer'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <InspectorInitializer />
      </body>
    </html>
  );
}
```

### 会话与上下文传播

- SDK 会在标签页首次初始化时自动生成一个唯一的 sessionId，无需你手动创建。
- 在同一浏览器标签页内进行的页面跳转与交互，都会复用同一个 sessionId，使一次用户访问在时间维度上能够完整串联。
- 打开新的标签页或窗口，会生成新的 sessionId；关闭标签页或重新初始化后，会话也会随之重置。
- 所有上报的数据都会携带该 sessionId，使后端能够将同一次会话中的前端事件与后端服务侧的链路数据进行关联，实现端到端的可观测性与排障效率提升。

