
# SESSIFY 集成

**轻量 • 零依赖 • 符合 W3C 标准的分布式追踪**

SESSIFY 是 Softprobe 的会话生命周期管理与分布式追踪 SDK，专为前端应用的会话管理与请求追踪设计。它自动处理会话的创建、校验、保活与过期逻辑，并向 HTTP 请求注入符合 W3C 标准的 trace 上下文，实现端到端的会话关联。

核心收益包括：自动化会话管理、跨微服务的分布式追踪、基于 Web Crypto API 的安全性，以及零依赖带来的最小打包体积。

<div class="sp-hero-buttons">
  <a class="button button--primary" href="/zh/platform/getting-started/quick-start">快速开始</a>
  <a class="button button--secondary" href="/zh/platform/getting-started/account-setup">账户设置</a>
</div>

::: info
快速开始环境已预装并启用了 SESSIFY（`@softprobe/sessify`）。本文档用于将 SDK 集成进你自己的前端应用（React / Vue / Next.js 等）。
:::

## 前置条件

- 一个现代 Web 应用（React、Vue、Next.js 或原生 JavaScript）
- Node.js 16+ 及打包工具（如 Vite、Webpack）

## 安装

```bash
# npm
npm install @softprobe/sessify

# yarn
yarn add @softprobe/sessify

# pnpm
pnpm add @softprobe/sessify
```

## 初始化

```ts
// React / Next.js 示例
import { useEffect } from 'react';
import { initSessify } from '@softprobe/sessify';

useEffect(() => {
  // 使用默认配置初始化
  initSessify({
  });
}, []);

// 原生 JS 示例
import { initSessify } from '@softprobe/sessify';

initSessify({
});
```

## 核心功能

<div class="row sp-card-grid">
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>🔄 自动化生命周期管理</h3></div>
      <div class="card__body">完整处理会话的创建、校验、保活与过期逻辑，无需手动管理定时器。</div>
    </div>
  </div>
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>🔌 W3C Trace 上下文注入</h3></div>
      <div class="card__body">自动拦截 `fetch` 请求并注入标准 `tracestate` 头，跨微服务携带会话上下文。</div>
    </div>
  </div>
</div>

<div class="row sp-card-grid">
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>💾 灵活的持久化策略</h3></div>
      <div class="card__body">按安全与体验需求，在临时的 `sessionStorage` 与持久的 `localStorage` 之间选择。</div>
    </div>
  </div>
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>🛡️ 增强的安全性</h3></div>
      <div class="card__body">使用 Web Crypto API（时间戳 + 密码学安全随机串）生成抗碰撞的会话 ID。</div>
    </div>
  </div>
</div>

<div class="row sp-card-grid">
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>🖥️ 适配 SSR 与多环境</h3></div>
      <div class="card__body">内置环境检测，确保在浏览器环境安全执行，并在服务端渲染（SSR）上下文中优雅跳过。</div>
    </div>
  </div>
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>📦 零依赖</h3></div>
      <div class="card__body">保持最小打包体积，无外部膨胀。</div>
    </div>
  </div>
</div>

## 核心用法

初始化后，你可以在应用的任意位置管理会话。

```javascript
import { getSessionId, startSession, endSession, isSessionActive } from '@softprobe/sessify';

// 1. 获取当前会话
// 若已过期或不存在，会自动创建一个新会话。
const sessionId = getSessionId();
console.log('Active Session:', sessionId);

// 2. 检查状态
if (isSessionActive()) {
  console.log('User is currently active');
}

// 3. 强制刷新（如登录时）
// 立即作废旧会话并开启一个全新会话。
const newSessionId = startSession();

// 4. 登出 / 清理
// 清空存储并作废会话。
endSession();
```

## 会话与上下文传播

- SDK 会在标签页首次初始化时自动生成一个唯一的 sessionId，无需你手动创建。
- 在同一浏览器标签页内进行的页面跳转与交互，都会复用同一个 sessionId，使一次用户访问在时间维度上能够完整串联。
- 打开新的标签页或窗口，会生成新的 sessionId；关闭标签页或重新初始化后，会话也会随之重置。
- 所有上报的数据都会携带该 sessionId，使后端能够将同一次会话中的前端事件与后端服务侧的链路数据进行关联，实现端到端的可观测性与排障效率提升。

## 配置

`initSessify` 函数接受一个配置对象，用于按需定制行为。

| 选项 | 类型 | 默认值 | 说明 |
|--------|------|---------|-------------|
| customTraceState | object | {} | 要包含进 tracestate 头的自定义键值对。 |
| sessionStorageType | session/local | 'session' | 控制持久化。`'local'` 在浏览器重启后仍保留；`'session'` 在标签页关闭时清除。 |

### 自定义 Trace State 示例

通过加入环境、版本等上下文来增强请求追踪：

```javascript
initSessify({
  sessionStorageType: 'local',
  customTraceState: {
    'x-sp-env': 'production',
    'x-sp-ver': '1.0.0',
    'x-sp-tier': 'premium'
  }
});
```

生成的头部：`tracestate: x-sp-session-id=...,x-sp-env=production,x-sp-ver=1.0.0...`

## 技术细节

### 会话生命周期策略

- **创建**：使用 base36 时间戳结合 Web Crypto API 随机串，生成约 16 字符的唯一 ID。

- **校验**：每次访问自动检查是否超时。一旦超过超时时间，旧会话被丢弃并无缝生成新会话。

### HTTP 拦截

@softprobe/sessify 会（安全地）对全局 fetch API 打补丁，以便：
- 检查会话是否活跃。
- 注入符合 W3C 标准的 tracestate 头。
- 附加你的 siteName 或 customTraceState 以及当前 session_id。

<div class="sp-link-buttons">
  <a class="button button--primary" href="/zh/platform/getting-started/quick-start">快速开始</a>
  <a class="button button--secondary" href="/zh/platform/getting-started/account-setup">账户设置</a>
</div>
