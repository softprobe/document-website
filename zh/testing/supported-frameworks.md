---
title: 支持的 Java 版本与框架
---

# 支持的 Java 版本与框架

本页按 Java Agent 4.3.36 列出支持范围。没写版本的，表示 Agent 没有限定版本。

你的技术栈不在这里，或者拿不准某个版本行不行，把被测服务的 `pom.xml`（最好再加上 `mvn dependency:tree` 的输出）发给 SoftProbe 做兼容性评估。只需要依赖清单，不需要源码或应用包。

## Java 版本 {#jdk}

JDK 8、11、17、21。JDK 17、21 要在启动参数里加一组 `--add-opens`，见 [接入 Java Agent — JDK 17、21](/zh/testing/java-agent#jdk17)。

## 运行方式 {#runtime}

- Spring Boot 可执行 jar
- 部署在 Tomcat、WebLogic、东方通等应用服务器里的 Servlet 应用
- 容器、Kubernetes 里运行的以上两类服务

## 入口：录制从这里开始 {#entry}

一条录制从被测服务收到的一个请求开始。入口必须是下面这些类型之一：

| 类型 | 支持 |
|------|------|
| HTTP | Servlet 3.0 及以上，`javax.servlet` 和 `jakarta.servlet` 都支持；Spring Cloud Gateway |
| RPC | Apache Dubbo 2.7 及以上、3.x；Alibaba Dubbo；SOFA RPC 5.0 及以上；Armeria |
| 消息 | RabbitMQ 消费 |
| Netty | Netty 3.x、4.x |

## 依赖调用：录制并在回放时 Mock {#dependencies}

| 类型 | 支持 |
|------|------|
| HTTP 客户端 | Apache HttpClient 3.x、4.x；OkHttp 3.x、4.x；JDK `HttpURLConnection`；Spring `RestTemplate` 5.x、6.x；Spring `WebClient` 5.x、6.x；Feign；AsyncHttpClient；RESTEasy 3.0 及以上；Apache CXF 3.0 及以上；Apache Axis、Axis2 |
| 数据库 | JDBC；MyBatis 3.x（包括 MyBatis-Plus 等基于它的框架）；iBATIS；Hibernate 4.x、5.x、6.0–6.4 |
| Redis | Jedis 2.0–3.5、4.0 及以上；Lettuce 5.0–6.0、6.1 及以上；Redisson 3.x；Spring Data Redis（`RedisTemplate`） |
| NoSQL 与搜索 | MongoDB Java 驱动；Elasticsearch REST 客户端；SolrJ |
| RPC 客户端 | Dubbo、SOFA RPC 的调用方；gRPC；Thrift；Armeria |
| 消息发送 | Kafka 生产者；RabbitMQ 发送；IBM MQ |
| 其他 | SFTP（JSch）；Seata 分布式事务 |

Apache HttpClient 5.x 暂不支持。

## 本地缓存、时间与动态类 {#dynamic}

回放时，下面这些调用的结果也要和录制时一致，否则同样的请求会得到不同的结果：

| 类型 | 支持 | 说明 |
|------|------|------|
| 本地缓存 | Caffeine、Guava Cache、Spring Cache（`@Cacheable`） | 需要在「配置 → 录制配置」里配置「覆盖包」，见 [录制配置与回放配置](/zh/testing/policies#app-wide) |
| 系统时间 | `System.currentTimeMillis()` 等 | 回放时返回录制时的时间 |
| 加解密 | 对称加解密 | |
| 你指定的方法 | 任意 Java 方法 | 在「配置 → 动态类」里登记，见 [动态类](/zh/testing/policies#dynamic-classes) |

## 其他框架 {#other}

| 类型 | 支持 | 作用 |
|------|------|------|
| 认证 | Spring Security、Apache Shiro、jCasbin、JWT（Auth0、JJWT） | 回放时，录制的请求带的登录态已经过期，Agent 让认证按录制时的结果通过 |
| 配置中心 | Apollo、Nacos、Spring 配置 | 录制时读到的配置，回放时按录制的值返回 |
| 线程池 | Java `Executor`、Disruptor | 请求切换到其他线程执行时，录制和 Mock 仍然能关联到原来的请求 |
| 日志 | Logback、Log4j2、`java.util.logging` | 服务日志带上 Trace ID，可以在 SoftProbe 里按请求查看日志 |

## 相关文档 {#related}

- [接入 Java Agent](/zh/testing/java-agent)
- [录制配置与回放配置](/zh/testing/policies)
- [工作原理](/zh/testing/how-it-works)
