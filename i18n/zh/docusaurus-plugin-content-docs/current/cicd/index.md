---
sidebar_position: 1
---

# CI/CD 流水线

该项目包括自动化的 GitHub Actions 工作流：

## 集成测试

- **触发器**: 推送到 main/bill/deploy 分支、拉取请求
- **工作流**: `.github/workflows/integration-test.yml`
- **操作**:
  - 构建 WASM 二进制文件
  - 使用 Softprobe 后端运行集成测试
  - 验证端到端遥测流水线

## 发布流程

- **触发器**: 格式为 `v*.*.*` 的 Git 标签 (例如, `v1.2.3`)
- **工作流**: `.github/workflows/release.yml`
- **操作**:
  - 从标签更新 `Cargo.toml` 版本
  - 构建和测试 WASM 二进制文件
  - 将 Docker 镜像发布到 `softprobe/sp-istio-wasm` 和 `softprobe/sp-envoy`
  - 创建包含 WASM 二进制文件和部署文件的 GitHub 版本

### 发布所需的 GitHub Secrets

- `DOCKERHUB_USERNAME`: Docker Hub 用户名
- `DOCKERHUB_TOKEN`: Docker Hub 访问令牌

## 创建发布

```bash
git tag v1.2.3
git push origin v1.2.3
```

发布工作流将自动：
1. 从标签中提取版本
2. 更新 Cargo.toml 版本
3. 构建和测试
4. 发布 Docker 镜像
5. 创建包含资产的 GitHub 版本