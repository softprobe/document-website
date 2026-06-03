---
title: 支持的框架
---

# 支持的框架（Java）

Softprobe 测试通过 Agent 模块插件织入常见 Java 技术栈。下列为当前文档记载的覆盖范围；[`sp-agent-java`](https://github.com/softprobe/softprobe/tree/main/backend/sp-agent-java) 中会持续新增集成。

::: tip
若未列出你的栈，请确认是否使用已支持的客户端（例如基于 MyBatis 或 Hibernate 的 JDBC 层）。入口必须由 Agent 已织入的 HTTP/RPC Provider 模块承接。
:::

## 基础能力

- Java Executors
- 系统时间（`DynamicClass` — 默认策略在回放时强制 Mock）
- 用户配置的动态类型

## 缓存

- Caffeine Cache
- Guava Cache
- Spring Cache

## Spring / HTTP 入口

- Spring Boot 1.4+、2.x+
- Servlet API 3+、5+

## HTTP 客户端

- Apache HttpClient 4.0+
- OkHttp 3.0 – 4.11
- Spring WebClient 5.0+
- Spring `RestTemplate`
- Feign 9.0+
- Elasticsearch Client 7.x

## Redis

- `RedisTemplate`
- Jedis 2.10+、4+
- Redisson 3.0+
- Lettuce 5.x、6.x

## 持久化

- MyBatis 3.x、MyBatis-Plus、TkMyBatis
- Hibernate 5.x

## NoSQL

- MongoDB 驱动 3.x、4.x

## RPC

- Apache Dubbo 2.x、3.x
- Alibaba Dubbo 2.x
- SOFA RPC（后端模型中的 provider/consumer 分类）

## 认证

- Spring Security 5.x
- Apache Shiro 1.x
- jCasbin 1.x
- Auth0 JWT 3.x
- JJWT 0.1+、jjwt-api 0.10+

## Netty

- Netty 服务端 3.x、4.x

## 配置中心

- Apollo Config 1.x、2.x

## 后端依赖分类

回放匹配在 Mock 策略中使用**依赖**分类（非入口类型）。与 [`MockCategoryType`](https://github.com/softprobe/softprobe) 对齐的常用名称：

| 分类 | 典型用途 |
|------|----------|
| `HttpClient` | 对外 HTTP |
| `Database` | JDBC / ORM SQL |
| `Redis` | Redis 命令 |
| `DubboConsumer` / `SofaConsumer` | RPC 客户端 |
| `QMessageProducer` | 消息发送 |
| `DynamicClass` | 时间、随机、缓存、加解密 |
| `ConfigFile` | 配置读取（对比时常跳过） |

入口分类（`Servlet`、`DubboProvider` 等）表示被录制的**主** API。

## 相关文档

- [Java Agent](/zh/testing/java-agent)
- [Mock 策略](/zh/testing/policies)
- [工作原理](/zh/testing/how-it-works)
