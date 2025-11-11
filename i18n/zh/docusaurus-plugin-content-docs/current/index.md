---
sidebar_position: 1
slug: /
title: Softprobe 文档
description: Softprobe 文档——业务级分布式追踪与分析平台，零服务端代码改动
---

# Softprobe 文档

**零代码改动 • 全上下文可见性 • 成本优化**

<div className="sp-hero-buttons">
  <a className="button button--primary" href="./getting-started/quick-start/">快速开始</a>
  <a className="button button--secondary" href="./deployment/installation/">生产部署</a>
</div>

:::info
Softprobe 通过捕获每一次用户旅程并构建会话图谱，修复了可观测性中的“缺失上下文”问题——让交互数据可分析、可自动化、且经济可保留。
:::

## 问题
传统日志与可观测性工具以昂贵的索引为中心。团队往往通过大量采样来降本，这会丢失上下文并拖慢排障与支持效率。

## 解决方案
- 会话图谱：按用户会话聚合事件，形成一条端到端的统一记录
- 成本重构：用会话上下文替代昂贵索引，使 100% 数据可保留并更高效查询
- AI 就绪：丰富会话上下文支持自动化根因分析、问题预测与更智能的支持

## 工作原理
- 服务端采集：在 Istio 的 Envoy Sidecar 中通过轻量 Wasm 插件采集 HTTP 流量与业务流程，输出原生 OpenTelemetry 追踪数据 <a className="sp-link-pill" href="https://github.com/softprobe/sp-istio-wasm" target="_blank" rel="noopener">GitHub</a>
- 客户端加注：Web SDK 将多个 Trace 贯通为一个会话，补充路由变化、性能指标与交互事件

<div className="sp-link-buttons">
  <a className="button button--secondary" href="https://github.com/softprobe/sp-istio-wasm" target="_blank" rel="noopener">SP‑Istio 代理 GitHub</a>
</div>

<div className="sp-img">
  <img src="/img/docs/how-it-work.png" alt="Softprobe 架构" />
</div>

## 产品路线图

<div className="row sp-card-grid sp-roadmap">
  <div className="col col--4">
    <div className="card">
      <div className="card__header"><h3>1. 上下文视图</h3></div>
      <div className="card__body">
        将端到端用户旅程可视化为会话图谱。
        <div style={{marginTop:'8px'}}>
          <span className="badge badge--success">当前</span>
        </div>
      </div>
    </div>
  </div>
  <div className="col col--4">
    <div className="card">
      <div className="card__header"><h3>2. ETL</h3></div>
      <div className="card__body">
        导出并转换会话数据，服务于下游分析与长期保留。
        <div style={{marginTop:'8px'}}>
          <span className="badge badge--primary">下一个</span>
        </div>
      </div>
    </div>
  </div>
  <div className="col col--4">
    <div className="card">
      <div className="card__header"><h3>3. 故障排查</h3></div>
      <div className="card__body">
        提供跨服务的根因诊断与解决的引导式工作流。
        <div style={{marginTop:'8px'}}>
          <span className="badge badge--primary">计划中</span>
        </div>
      </div>
    </div>
  </div>
</div>


:::success 今天
当前可用：
- 数据采集：Web SDK（会话级上下文）与 Istio/Envoy Wasm 插件输出原生 OpenTelemetry 追踪——SP‑Istio 代理开源：[github.com/softprobe/sp-istio-wasm](https://github.com/softprobe/sp-istio-wasm)
- 可视化：上下文视图（跨服务的会话图谱）
:::

<div className="sp-img">
  <img src="/img/docs/context-view.png" alt="上下文视图中的会话图谱" />
  <p className="sp-caption">当前：上下文视图——跨服务的会话图谱。</p>
</div>

## 兼容性与隔离
- 原生 OTEL 兼容：如果您的应用已经使用 OpenTelemetry，Softprobe 不会干扰，也不会修改您的应用 OTEL 数据

<div className="sp-img">
  <img src="/img/docs/trace-isolated.png" alt="Softprobe 与用户追踪相互隔离" />
  <p className="sp-caption">Softprobe 追踪与用户追踪相互隔离</p>
</div>

## 核心收益

<div className="row sp-card-grid">
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>全上下文可见性</h3></div>
      <div className="card__body">
        按会话捕获 100% 交互细节，消除采样导致的盲点。
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>成本优化</h3></div>
      <div className="card__body">
        在保留完整数据的同时降低整体可观测性成本。
      </div>
    </div>
  </div>
</div>

<div className="row sp-card-grid">
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>Kubernetes 原生</h3></div>
      <div className="card__body">
        与 Kubernetes/Istio 深度集成，便于生产环境部署。
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>零代码改动</h3></div>
      <div className="card__body">
        无需修改服务端代码即可上线。
      </div>
    </div>
  </div>
</div>
