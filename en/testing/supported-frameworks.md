---
title: Supported frameworks
---

# Supported frameworks (Java)

Softprobe Testing instruments common Java stacks through the agent’s module plugins. The list below reflects currently documented support; new integrations are added continuously in [`sp-agent-java`](https://github.com/softprobe/softprobe/tree/main/backend/sp-agent-java).

::: tip
If your stack is not listed, check whether it uses a supported client (for example any JDBC layer backed by MyBatis or Hibernate). Entry points must be one of the HTTP/RPC provider modules the agent weaves.
:::

## Foundation

- Java Executors
- System time (`DynamicClass` — force-mocked on replay by default policy)
- User-configured dynamic types

## Cache

- Caffeine Cache
- Guava Cache
- Spring Cache

## Spring / HTTP entry

- Spring Boot 1.4+, 2.x+
- Servlet API 3+, 5+

## HTTP clients

- Apache HttpClient 4.0+
- OkHttp 3.0 – 4.11
- Spring WebClient 5.0+
- Spring `RestTemplate`
- Feign 9.0+
- Elasticsearch Client 7.x

## Redis

- `RedisTemplate`
- Jedis 2.10+, 4+
- Redisson 3.0+
- Lettuce 5.x, 6.x

## Persistence

- MyBatis 3.x, MyBatis-Plus, TkMyBatis
- Hibernate 5.x

## NoSQL

- MongoDB driver 3.x, 4.x

## RPC

- Apache Dubbo 2.x, 3.x
- Alibaba Dubbo 2.x
- SOFA RPC (provider/consumer categories in backend model)

## Auth

- Spring Security 5.x
- Apache Shiro 1.x
- jCasbin 1.x
- Auth0 JWT 3.x
- JJWT 0.1+, jjwt-api 0.10+

## Netty

- Netty server 3.x, 4.x

## Config

- Apollo Config 1.x, 2.x

## Backend dependency categories

Replay matching uses **dependency** categories (not entry types) in mock policy. Common names aligned with [`MockCategoryType`](https://github.com/softprobe/softprobe):

| Category | Typical use |
|----------|-------------|
| `HttpClient` | Outbound HTTP |
| `Database` | JDBC / ORM SQL |
| `Redis` | Redis commands |
| `DubboConsumer` / `SofaConsumer` | RPC client |
| `QMessageProducer` | Message publish |
| `DynamicClass` | Time, random, cache, encryption helpers |
| `ConfigFile` | Config reads (often skipped in compare) |

Entry categories (`Servlet`, `DubboProvider`, …) define what was recorded as the **main** API under test.

## Related

- [Java agent](/en/testing/java-agent)
- [Mock policy](/en/testing/policies#mock-policy)
- [How it works](/en/testing/how-it-works)
