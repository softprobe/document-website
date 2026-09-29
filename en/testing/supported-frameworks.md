---
title: Supported Java versions and frameworks
---

# Supported Java versions and frameworks

This page lists what Java agent 4.3.36 supports. Where no version is given, the agent doesn't restrict the version.

If your stack isn't listed, or you're unsure about a version, send the service's `pom.xml` to SoftProbe for a compatibility check, ideally with the output of `mvn dependency:tree`. Only the dependency list is needed, not source code or application packages.

## Java versions {#jdk}

JDK 8, 11, 17 and 21. JDK 17 and 21 need a set of `--add-opens` start-up flags; see [Attach the Java agent — JDK 17 and 21](/en/testing/java-agent#jdk17).

## How the service runs {#runtime}

- Spring Boot executable jars
- Servlet applications deployed in application servers such as Tomcat, WebLogic or TongWeb
- Either of the above in containers or on Kubernetes

## Entry points: where a recording starts {#entry}

A recording starts with a request the service receives. The entry must be one of these:

| Type | Supported |
|------|-----------|
| HTTP | Servlet 3.0 and later, both `javax.servlet` and `jakarta.servlet`; Spring Cloud Gateway |
| RPC | Apache Dubbo 2.7 and later, 3.x; Alibaba Dubbo; SOFA RPC 5.0 and later; Armeria |
| Messaging | RabbitMQ consumers |
| Netty | Netty 3.x, 4.x |

## Dependency calls: recorded, and mocked during replay {#dependencies}

| Type | Supported |
|------|-----------|
| HTTP clients | Apache HttpClient 3.x, 4.x; OkHttp 3.x, 4.x; JDK `HttpURLConnection`; Spring `RestTemplate` 5.x, 6.x; Spring `WebClient` 5.x, 6.x; Feign; AsyncHttpClient; RESTEasy 3.0 and later; Apache CXF 3.0 and later; Apache Axis, Axis2 |
| Databases | JDBC; MyBatis 3.x (including frameworks built on it, such as MyBatis-Plus); iBATIS; Hibernate 4.x, 5.x, 6.0–6.4 |
| Redis | Jedis 2.0–3.5, 4.0 and later; Lettuce 5.0–6.0, 6.1 and later; Redisson 3.x; Spring Data Redis (`RedisTemplate`) |
| NoSQL and search | MongoDB Java driver; Elasticsearch REST client; SolrJ |
| RPC clients | Dubbo and SOFA RPC callers; gRPC; Thrift; Armeria |
| Sending messages | Kafka producers; RabbitMQ publishing; IBM MQ |
| Other | SFTP (JSch); Seata distributed transactions |

Apache HttpClient 5.x isn't supported yet.

Mock exceptions under **Replay**, the dependency-type rules in diff rules, and policy YAML refer to dependency calls by category name (such as `HttpClient`, `Database`, `Redis`, `DubboConsumer`); the names are listed in [Policy YAML reference — dependency categories](/en/testing/policy-yaml-guide#dependency-categories).

## Local caches, time and dynamic classes {#dynamic}

During replay, the results of these calls must also match the recording, or the same request can take a different path:

| Type | Supported | Notes |
|------|-----------|-------|
| Local caches | Caffeine, Guava Cache, Spring Cache (`@Cacheable`) | Needs **Coverage packages** set under **Config → Recording**; see [Recording and replay settings](/en/testing/policies#app-wide) |
| System time | `System.currentTimeMillis()` and similar | Returns the recorded time during replay |
| Encryption and decryption | Symmetric ciphers | |
| Methods you choose | Any Java method | Register them under **Config → Dynamic classes**; see [Dynamic classes](/en/testing/policies#dynamic-classes) |

## Other frameworks {#other}

| Type | Supported | What it does |
|------|-----------|--------------|
| Authentication | Spring Security, Apache Shiro, jCasbin, JWT (Auth0, JJWT) | During replay the recorded request's login has expired; the agent lets authentication pass as it did when recorded |
| Configuration | Apollo, Nacos, Spring configuration | Configuration read during recording returns the recorded values during replay |
| Thread pools | Java `Executor`, Disruptor | When a request continues on another thread, recording and mocking stay linked to the original request |
| Logging | Logback, Log4j2, `java.util.logging` | Service logs carry the trace ID, so you can look up logs per request in SoftProbe |

## Related {#related}

- [Attach the Java agent](/en/testing/java-agent)
- [Recording and replay settings](/en/testing/policies)
- [How it works](/en/testing/how-it-works)
