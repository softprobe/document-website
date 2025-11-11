---
sidebar_label: 仪表盘指南
sidebar_position: 2
title: Softprobe 仪表盘使用指南
description: 了解如何在 Softprobe 仪表盘中导航、管理租户与成员、查看指标并进行相关配置操作
---

# Softprobe 仪表盘使用指南

欢迎使用 Softprobe 仪表盘。本指南帮助你快速熟悉界面、完成租户与成员管理，并稳定地使用核心功能。

## 🚀 快速开始

### 1. 注册与登录
- 访问首页，点击右上角“Sign Up”
- 输入邮箱与密码，完成邮件验证
- 登录并开始使用系统

<div style={{textAlign: 'center', margin: '24px 48px'}}>

<img src="/img/docs/sign-up.png" alt="仪表盘注册" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />

</div>

:::tip
账号设置与公钥管理可参见 [账号设置指南](/getting-started/account-setup)。
:::

### 2. 界面总览
登录后，你将看到：
- **左侧导航**：模块快速入口
- **顶部栏**：用户信息与租户切换
- **主工作区**：当前模块的操作界面

<div style={{textAlign: 'center', margin: '24px 48px'}}>

<img src="/img/docs/main-board.png" alt="仪表盘主界面" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />

</div>

## 📊 核心功能

### 1. 仪表盘首页
实时监控系统核心指标

#### 数据概览卡片
- **数据库使用量**：当前存储用量（GB）、使用比例与颜色提示
- **数据写入统计**：总记录数、时间范围筛选与历史对比
- **会话统计**：活跃会话、所选时间段总会话、趋势图
- **性能指标**：平均响应时间、P95 指标、系统健康状况

:::tip
如需实现端到端用户旅程关联，请在前端安装 [Web SDK](/web-sdk) 并通过服务网格传播 sessionId。
:::

#### 操作与更新
- 页面进入时加载一次数据（不自动刷新）
- 更新方式：切换时间范围、切换租户或手动刷新页面

### 2. 租户管理
面向多租户环境的资源隔离与管理

#### 租户切换
- 使用顶部栏租户选择器（支持搜索与筛选）
- 点击目标租户完成切换
- 通过“+”创建新租户并填写基本信息

<div style={{textAlign: 'center', margin: '24px 48px'}}>

<img src="/img/docs/tenant.png" alt="租户管理" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />

</div>

#### 租户设置
- 基本信息：名称、描述、图标
- 成员管理：添加/移除、角色与权限
- API 密钥：创建/管理密钥与有效期
- 危险操作区：删除租户、导出备份、清理数据

### 3. 团队成员管理
权限控制与协同管理

<div style={{textAlign: 'center', margin: '24px 48px'}}>

<img src="/img/docs/member.png" alt="团队成员管理" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />

</div>

#### 添加成员
- 进入 租户设置 → 成员管理
- 点击“Add Member”，输入邮箱并选择角色
- 角色类型：**管理员**、**编辑者**、**查看者**

#### 角色权限
- **管理员**：拥有完整控制权限；可管理成员/设置、API 密钥与危险操作
- **编辑者**：可进行数据与监控配置的操作；不可管理成员与全局设置
- **查看者**：只读访问；适合报表查看与审计

## ⚠️ 常见限制与最佳实践

- 数据刷新：仪表盘首页不自动刷新；请切换时间范围或租户，或手动刷新更新数据。
- 角色与安全：遵循最小权限原则；避免对所有成员授予“管理员”；定期审查成员列表。
- API 密钥：完整密钥仅在创建时展示；请妥善保存并定期轮换；切勿提交到代码仓库。
- 速率限制：每个 API 密钥有每小时上限；客户端应实现重试/退避，并在仪表盘监控用量计数。
- PII 处理：避免在属性中发送敏感个人信息；使用哈希后的请求体进行关联。
- 多环境隔离：为生产/预发/开发分别创建租户与公钥，提升隔离性与审计便利性。
- 性能建议：结合时间过滤与 request_body_hash 使用；数据集增大时配合分区与缓存策略。

:::tip 快速提醒
若需要更高配额或自定义保留周期，请携带租户 ID 与预期负载邮件联系 support@softprobe.ai。
:::

## ❓ 常见问题
参阅 [FAQ](/support/faq)，包含数据与安全、移动端访问与导出等常见问题。

## ➡️ 下一步
- 学习核心概念：[理解核心概念](/advanced-guides/concepts)
- 部署生产环境：[安装指南](/deployment/installation)
- 配置高级规则：[配置参考](/configuration/config)

---
<div className="sp-hero-buttons">
  <a className="button button--primary" href="../deployment/installation/">生产环境部署</a>
  <a className="button button--secondary" href="../getting-started/account-setup/">账号设置</a>
  <a className="button button--secondary" href="../configuration/config/">配置指南</a>
  <a className="button button--secondary" href="../support/faq/">常见问题</a>
</div>

:::info 提示
部署完成并产生流量后，打开 Context View 即可查看端到端会话图谱、性能指标与交互事件。
:::

<div className="sp-card-grid">
  <div className="sp-card">
    <h3>仪表盘首页</h3>
    <p>查看核心指标、数据用量与会话统计。</p>
  </div>
  <div className="sp-card">
    <h3>租户与成员</h3>
    <p>管理多租户与成员角色权限。</p>
  </div>
  <div className="sp-card">
    <h3>Context View</h3>
    <p>端到端可视化会话流转，快速定位问题。</p>
  </div>
</div>

<div className="sp-img">
  <img src="/img/docs/main-board.png" alt="仪表盘首页" />
  <p className="sp-caption">仪表盘首页展示核心指标与概览卡片。</p>
</div>

<div className="sp-img">
  <img src="/img/docs/tenant.png" alt="租户管理" />
  <p className="sp-caption">租户管理支持多租户隔离与成员权限。</p>
</div>

<div className="sp-img">
  <img src="/img/docs/demo-session.png" alt="Context View 会话图谱示例" />
  <p className="sp-caption">Context View 展示会话图谱、Span 与交互事件。</p>
</div>

---

<div className="sp-hero-buttons">
  <a className="button button--primary" href="/zh/advanced-guides/concepts/">理解核心概念</a>
  <a className="button button--secondary" href="/zh/deployment/installation/">安装指南</a>
  <a className="button button--secondary" href="/zh/configuration/config/">配置参考</a>
</div>

---
最后更新：2024 年 12 月