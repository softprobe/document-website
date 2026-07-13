
# 账户设置

设置您的 Softprobe 账户并为 SP-Istio Agent 生成 API 密钥。

## 📋 概述

本指南将引导您完成：

- 创建 Softprobe 账户
- 设置您的租户组
- 生成 API 密钥
- 下载配置文件

## 🚀 入门

### 步骤 1：创建您的账户

1. 访问 [Softprobe Dashboard](https://dashboard.softprobe.ai)
2. 点击 **"注册"** 创建新账户
3. 填写您的详细信息：
   - **电子邮件地址** (将作为您的登录用户名)
   - **密码** (最少 8 个字符)
4. 点击发送到您收件箱的链接验证您的电子邮件地址

<div style="text-align: center; margin: 24px 48px">

<img src="/img/docs/sign-up.png" alt="Sign Up in Dashboard" style="max-width: 100%; height: auto; border-radius: 8px" />

</div>

### 步骤 2：访问设置并创建租户组

电子邮件验证并登录后，您可以访问“设置”页面管理租户组：

1. 导航到 **[设置](https://dashboard.softprobe.ai/settings)** 页面
2. **创建您的第一个租户组**
   - 点击“创建组”按钮
   - **租户组名称**：为您的组织选择一个唯一的名称
     - 这将用于组织您的服务和数据
     - 示例：`my-company-prod`, `acme-corp`, `team-alpha`
   - **描述** (可选)：添加您的组的简要描述
3. 点击 **"创建租户组"**

::: tip
请仔细选择您的租户组名称，因为它以后无法更改。使用一个能清晰识别您的组织或团队的名称。
:::

<div style="text-align: center; margin: 24px 48px">

<img src="/img/docs/create-tenant.png" alt="Create Tenant Group" style="max-width: 100%; height: auto; border-radius: 8px" />

</div>

### 步骤 3：生成 API 密钥

创建租户组后：

1. 导航到仪表板侧边栏中的 **"API 密钥"**
2. 点击 **"生成新 API 密钥"**
3. 提供以下信息：
   - **密钥名称**：一个描述性名称（例如，`production-cluster`, `dev-environment`）
4. 点击 **"生成密钥"**

::: warning 重要

- 您的 API 密钥将**只显示一次**
- 立即复制并安全存储
- `minimal.yaml` 配置文件将自动下载
- 关闭对话框后，您无法再次检索密钥
  :::

<div style="text-align: center; margin: 24px 48px">

<img src="/img/docs/create-key.png" alt="Generate Public Key" style="max-width: 100%; height: auto; border-radius: 8px" />

</div>

## 📁 配置文件

当您生成 API 密钥时，`minimal.yaml` 文件会自动下载。此文件包含：

- 您的个性化 API 密钥
- 预配置的端点
- 默认采集规则
- 所有必要的 Kubernetes 资源

<div style="text-align: center; margin: 24px 48px">

<img src="/img/docs/download-yaml.png" alt="Download Yaml after Create Public Key" style="max-width: 100%; height: auto; border-radius: 8px" />

</div>

### 文件结构

下载的 `minimal.yaml` 包含：

```yaml
# WasmPlugin configuration with your Public key
apiVersion: extensions.istio.io/v1alpha1
kind: WasmPlugin
metadata:
  name: sp-istio-agent
spec:
  pluginConfig:
    public_key: "your-generated-api-key"
    # ... other configurations
```

## 🔐 安全最佳实践

### API 密钥管理

- **安全存储**: 将 API 密钥保存在安全的凭证管理系统中
- **定期轮换**: 定期生成新密钥并停用旧密钥
- **使用描述性名称**: 根据其用途和环境命名密钥
- **监控使用情况**: 检查仪表板中的 API 密钥活动

这有助于更好地跟踪和安全隔离。

## 🔧 下一步

完成账户设置后：

1. **快速测试**: 遵循 [快速入门](../getting-started/quick-start)
2. **生产环境**: 遵循 [生产安装](../deployment/installation)
3. **自定义配置**: 查看 [配置指南](../configuration/config)

## ❓ 故障排除

### 常见问题

**无法访问仪表板？**

- 检查您的互联网连接
- 验证 URL：`https://dashboard.softprobe.ai`
- 尝试清除浏览器缓存

**未收到电子邮件验证？**

- 检查您的垃圾邮件/垃圾箱文件夹
- 确保电子邮件地址正确
- 如果问题仍然存在，请联系支持

**API 密钥生成失败？**

- 确保您的租户组已正确设置
- 检查您是否具有必要的权限
- 尝试刷新页面并重新生成

### 获取帮助

如果在账户设置过程中遇到问题：

- **文档**: 查看我们的 [故障排除](#-故障排除)
- **支持**: 通过仪表板联系我们的支持团队
- **社区**: 加入我们的社区讨论以获取同行帮助

---

## 常见问题

### Q1: 如果我丢失了 minimal.yaml 配置文件怎么办？

**A:** `minimal.yaml` 文件只在您创建 API 密钥时下载一次。如果您丢失了它：

1. 从仪表板中删除当前的 API 密钥
2. 创建新的 API 密钥（这将生成新的 `minimal.yaml` 文件）
3. 立即安全保存新的配置文件

### Q2: 如果我忘记保存我的 API 密钥怎么办？

**A:** 使用新系统，您无需手动复制 API 密钥。它会自动嵌入到您创建密钥时下载的 `minimal.yaml` 文件中。只需确保安全保存该文件即可。

### Q3: API 密钥可以重复使用吗？

**A:** 是的，API 密钥可以在多个环境中使用，但建议：

- 为生产环境使用单独的 API 密钥
- 为开发/测试环境使用单独的 API 密钥
- 定期轮换 API 密钥以提高安全性

### Q4: 如何管理多个项目？

**A:** 建议为不同的项目创建不同的租户组：

1. 为每个项目创建单独的租户组
2. 为每个项目生成单独的 API 密钥
3. 邀请相关团队成员加入相应的租户组

### Q5: API 密钥有使用限制吗？

**A:** API 密钥的使用限制包括：

- 请求速率限制
- 数据存储配额
- 功能权限限制
- 请查看您的订阅计划以了解具体限制

### Q6: 如果配置后没有数据怎么办？

**A:** 请检查：

1. `minimal.yaml` 文件是否已使用 `kubectl apply -f minimal.yaml` 正确应用
2. Istio 服务网格是否已在您的集群中正确安装
3. 网络连接是否正常
4. 应用 Pod 是否在应用配置后已重启
5. 应用日志中是否有任何错误消息

---

## 技术支持

如果您在使用过程中遇到任何问题，可以通过以下方式获得帮助：

### 📧 联系支持

- **电子邮件**: support@softprobe.ai
- **响应时间**: 工作日 24 小时内

### 📚 文档资源

- **API 文档**: [https://docs.softprobe.ai](https://docs.softprobe.ai)
- **开发者指南**: [https://developers.softprobe.ai](https://developers.softprobe.ai)
- **常见问题**: [https://softprobe.ai/faq](https://softprobe.ai/faq)

### 🐛 问题反馈

如果您发现错误或有功能建议：

1. 登录到仪表板
2. 点击右上角的反馈按钮
3. 详细描述问题或建议
4. 我们将及时跟进

---

## 🎉 开始使用

恭喜！您已完成 Softprobe 的基本配置。现在您可以：

1. **监控应用程序性能**: 实时查看应用程序的运行状态
2. **分析用户行为**: 通过热力图了解用户习惯
3. **优化用户体验**: 根据数据分析优化您的产品
4. **团队协作**: 邀请团队成员一起分析数据

开始探索 Softprobe 的强大功能，让数据驱动您的产品决策！

---

_最后更新: 2024 年 1 月_
_版本: v1.0_
