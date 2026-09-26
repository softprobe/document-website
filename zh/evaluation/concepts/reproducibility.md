---
title: 可复现性
---

# 可复现性

每次 WorkflowRun 都会记录诚实的 **可复现类别** — Softprobe 不会对不透明的托管模型过度声称逐位回放。

## 类别

| 类别 | 含义 |
|-------|---------|
| **hermetic** | 所有输入、运行时、模型、种子、环境快照均内容寻址；网络关闭 |
| **pinned_external** | 请求不可变的提供商 / 模型；捕获原始响应；提供商基础设施在外部 |
| **recorded_external** | 可变 / 不透明依赖；捕获请求 / 响应 + 时间戳供审计 |
| **live** | 生产状态有意参与；仅对已捕获证据重新打分 |

## 记录的元数据

WorkflowVersion 与事件记录：

- FrameworkDefinition digest 与封闭文件集
- RunnerVersion 包 / lockfile / 镜像 digest
- SubjectVersion 与 EnvironmentVersion digest
- 种子派生（若已声明）、locale、时区
- 并发、重试、脱敏策略
- EvidenceArtifact 的内容哈希

对 LLM 评判器而言，**temperature 0 不会被标为确定性**，除非适用 hermetic fixture 或已录制响应范围。

## 缓存资格

不透明的框架 runner **默认不可缓存**。纯 Softprobe 控制面检查在 hermetic 时可缓存。实时 / 人工 / 可变远程节点不可缓存，除非声明了已验证的复用范围。

## Fork PR CI

不受信任的 fork 为内核管线运行无密钥的确定性 fixture — 实时提供商对比仅在受信任分支上运行，并对随机性差异做有记录的裁决。
