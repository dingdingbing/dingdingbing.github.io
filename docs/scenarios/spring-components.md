# Spring Boot / Spring Cloud 组件模块梳理

## 主问题

面试官问：“Spring Boot、Spring Cloud 你用过哪些组件？”如果脑子里只有 Spring Boot、Spring Cloud 这两个大词，很容易突然卡住。

更稳的回答方式是按模块分类：Web、数据访问、事务、缓存、消息、服务治理、配置、网关、容错、链路追踪、监控、安全、任务调度。

## 我们系统里的 starter 依赖

这张图是从项目依赖里按 `starter` 搜出来的结果，能反推出系统实际用到的 Spring Boot / Spring Cloud 能力。

![系统里的 Spring Boot 与 Spring Cloud starter 依赖](/images/scenarios/spring-components/system-starters.svg)

不要按依赖名一条条死背。更容易记住的方式是把它们放回一条后端请求链路里：

```text
请求入口 -> Web/Tomcat/JSON/Validation
业务处理 -> AOP/事务/缓存/消息
数据访问 -> JDBC/MyBatis-Plus/动态数据源
服务调用 -> Dubbo/OpenFeign/LoadBalancer
服务治理 -> Consul 注册发现/配置中心
稳定性 -> Resilience4j/Actuator/Logging/Test
```

这样看到 `spring-boot-starter-web`，脑子里想到的是“HTTP 入口”；看到 `spring-boot-starter-jdbc` 和 `mybatis-plus-boot-starter`，想到的是“数据库访问”；看到 `spring-cloud-starter-openfeign`，想到的是“HTTP 远程调用”；看到 `spring-cloud-starter-consul-discovery`，想到的是“服务注册发现”。

我自己可以按三层来背：

| 层级 | 这张图里的依赖 | 记忆方式 |
| --- | --- | --- |
| 公司封装 | `banksteel-starter-web`、`banksteel-starter-dubbo` | 公司把通用 Web、Dubbo 接入方式封成 starter |
| Boot 单体能力 | `web`、`jdbc`、`cache`、`amqp`、`aop`、`actuator`、`json`、`logging`、`test` | 一个服务自己能跑起来、能访问数据库、能发消息、能监控 |
| Cloud 服务治理 | `consul`、`consul-config`、`consul-discovery`、`openfeign`、`loadbalancer`、`resilience4j` | 多个服务之间如何发现、配置、调用、负载和容错 |

面试时不用把版本号背下来，重点背“组件解决什么问题”。版本号只需要知道当前系统大致是 Spring Boot `2.5.2`、Spring Cloud `3.0.3` 这一代。

## Spring Boot 常用组件

### Web 模块

常见组件：

- Spring MVC。
- 内嵌 Tomcat。
- Jackson。
- Validation。

可以怎么讲：

> Web 这块主要用 Spring MVC 写 Controller、参数绑定、异常处理和拦截器。Spring Boot 默认内嵌 Tomcat，常见调优点是最大线程数、连接数、超时时间和请求队列。JSON 序列化一般用 Jackson，参数校验用 Validation。

### 数据访问

常见组件：

- MyBatis / MyBatis-Plus。
- Spring JDBC。
- HikariCP。
- Spring Transaction。

可以怎么讲：

> 数据访问主要用 MyBatis 或 MyBatis-Plus，连接池用 Spring Boot 默认的 HikariCP。事务用 Spring Transaction，重点关注传播行为、隔离级别、事务失效场景和事务里不能做慢远程调用。

### 缓存

常见组件：

- Spring Cache。
- Redis。
- Caffeine。

可以怎么讲：

> 缓存一般分 Redis 和本地缓存。Redis 用于分布式缓存，本地缓存可以用 Caffeine。Spring Cache 提供注解式抽象，但复杂业务里我更关注 key 设计、过期时间、一致性、穿透、击穿、雪崩和热 key。

### 消息

常见组件：

- Spring AMQP。
- RabbitMQ。
- Spring for Apache Kafka。
- RocketMQ Spring。

可以怎么讲：

> 消息这块用过 RabbitMQ，Spring 侧一般通过 Spring AMQP 接入。重点不是会发消息，而是确认机制、消费幂等、失败重试、死信队列、消息堆积和补偿。

### 配置和自动装配

常见组件：

- AutoConfiguration。
- `@ConfigurationProperties`。
- Profile。
- Starter。

可以怎么讲：

> Spring Boot 的核心便利来自自动装配和 starter。配置项通常用 `@ConfigurationProperties` 映射，环境隔离用 profile。自己封装公共能力时，也可以做 starter。

### 监控和健康检查

常见组件：

- Spring Boot Actuator。
- Micrometer。
- Prometheus / Grafana。

可以怎么讲：

> 监控这块用 Actuator 暴露健康检查和指标，Micrometer 统一指标模型，再接 Prometheus 和 Grafana。线上排查常看 JVM、线程池、连接池、接口耗时和错误率。

## Spring Cloud 常用组件

### 服务注册与发现

常见组件：

- Nacos Discovery。
- Eureka。
- Zookeeper。

可以怎么讲：

> 服务注册发现用于让服务实例动态上下线。现在常见是 Nacos，早期 Spring Cloud 常见 Eureka，Dubbo 场景也常见 Zookeeper。

### 配置中心

常见组件：

- Nacos Config。
- Apollo。
- Spring Cloud Config。

可以怎么讲：

> 配置中心解决配置集中管理和动态刷新。Nacos 常和 Spring Cloud Alibaba 一起用，Apollo 配置治理能力更强，Spring Cloud Config 更偏 Git 配置管理。

### 服务调用

常见组件：

- OpenFeign。
- RestTemplate。
- WebClient。
- Dubbo。

可以怎么讲：

> Spring Cloud 里服务调用常用 OpenFeign，写起来像本地接口，但底层还是 HTTP 调用，要关注连接池、超时、重试、降级和下游接口耗时。Dubbo 是 RPC 框架，常用于内部高性能服务调用。

### 网关

常见组件：

- Spring Cloud Gateway。
- Zuul。

可以怎么讲：

> 网关负责统一入口、路由、鉴权、限流、灰度和日志。现在新项目更常用 Spring Cloud Gateway，底层是响应式模型。Zuul 是早期方案。

### 熔断、限流、降级

常见组件：

- Sentinel。
- Resilience4j。
- Hystrix。

可以怎么讲：

> 熔断限流用于保护系统。Sentinel 常用于限流、熔断、热点参数限流和系统自适应保护；Resilience4j 更轻量；Hystrix 是早期组件，现在新项目较少用。

### 链路追踪

常见组件：

- SkyWalking。
- Sleuth / Micrometer Tracing。
- Zipkin。

可以怎么讲：

> 链路追踪用于定位一次请求跨服务的耗时。排查慢接口时，我会结合 trace 看时间花在哪个服务、哪个 SQL、哪个外部调用。

### 负载均衡

常见组件：

- Spring Cloud LoadBalancer。
- Ribbon。

可以怎么讲：

> 负载均衡负责在多个服务实例之间选择一个调用。Ribbon 是老组件，Spring Cloud LoadBalancer 是后来替代方案。

## 可以按这张表记

| 分类 | 常见组件 | 面试关键词 |
| --- | --- | --- |
| Web | Spring MVC、Tomcat、Jackson | Controller、线程、序列化、异常处理 |
| 数据访问 | MyBatis、HikariCP、Transaction | SQL、连接池、事务 |
| 缓存 | Redis、Spring Cache、Caffeine | key、过期、一致性、热 key |
| 消息 | Spring AMQP、RabbitMQ、Kafka、RocketMQ | 幂等、重试、死信、堆积 |
| 注册发现 | Nacos、Eureka、Zookeeper | 服务上下线、实例发现 |
| 配置中心 | Nacos、Apollo、Config | 动态配置、灰度、刷新 |
| 服务调用 | OpenFeign、Dubbo、WebClient | 超时、重试、降级、连接池 |
| 网关 | Gateway、Zuul | 路由、鉴权、限流 |
| 容错 | Sentinel、Resilience4j、Hystrix | 限流、熔断、降级 |
| 监控 | Actuator、Micrometer、Prometheus | 指标、健康检查、告警 |
| 链路追踪 | SkyWalking、Zipkin | trace、span、慢链路 |

## 面试表达版本

可以这样回答：

> Spring Boot 这块我主要用过 Web、数据访问、事务、缓存、消息、监控这些模块。Web 用 Spring MVC 和内嵌 Tomcat，数据访问用 MyBatis 和 HikariCP，事务用 Spring Transaction，缓存用 Redis，也了解 Spring Cache，本地缓存可以用 Caffeine，消息用 RabbitMQ 对接 Spring AMQP，监控用 Actuator 和 Micrometer。Spring Cloud 这块，我会按服务治理来讲：注册发现用 Nacos 或 Eureka，配置中心用 Nacos/Apollo，服务调用用 OpenFeign，内部 RPC 也用过 Dubbo，网关可以用 Spring Cloud Gateway，限流熔断可以用 Sentinel 或 Resilience4j，链路追踪用 SkyWalking。真正落地时，我更关注这些组件背后的超时、重试、连接池、线程池、幂等、限流和监控。
