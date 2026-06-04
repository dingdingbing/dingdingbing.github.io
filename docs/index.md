---
layout: home

hero:
  name: Ding Junhui 技术知识库
  text: Java 后端项目经验、问题排查与应用场景面经
  tagline: 聚焦业务系统、复杂链路、数据一致性、中间件实践、工程质量和真实场景推演。
  actions:
    - theme: brand
      text: 应用场景模拟面经
      link: /scenarios/
    - theme: alt
      text: 项目与问题排查
      link: /experience/

features:
  - title: 应用场景
    details: 用具体应用题串联 Spring Boot、Dubbo、OpenFeign、Redis、MQ、MySQL 和 JVM。
    link: /scenarios/
  - title: 项目与排查
    details: 把项目经验和问题排查放在一起，围绕业务链路、根因定位和复盘沉淀组织。
    link: /experience/
  - title: 知识领域
    details: 持续整理 Java 后端、数据库、中间件和工程实践。
    link: /backend/
---

## 最近整理

- [Hikari 连接池与数据库连接数](/scenarios/hikari-connection-pool)：从 for 循环 1000 次查询一条 SQL 延伸到连接池、数据库连接上限、超时、压测和排查。
- [后端系统性能瓶颈推演](/scenarios/performance-bottlenecks)：从 Spring Boot/Tomcat、Dubbo、OpenFeign、Redis、RabbitMQ、MySQL 一路下钻到 JVM。
- [后端性能优化场景](/scenarios/performance-optimization)：整理深分页、慢 SQL、JVM 参数、缓存、线程池等优化场景。
- [技术选型横向对比](/scenarios/technology-comparison)：整理分布式锁、MQ、数据库连接池和常见中间件选型对比。
- [Spring Boot / Spring Cloud 组件模块梳理](/scenarios/spring-components)：按模块梳理常用组件，避免面试时想不起体系。
- [生产环境 OOM 排查复盘](/troubleshooting/production-oom)：保留 OOM 排查过程和 MAT 截图证据。
- [AI 使用过程中常见的坑](/engineering/ai-usage-pitfalls)：从一次 AI 初始化项目引发的生产慢 SQL 和事务回滚异常，沉淀 AI 代码准入方法论。
- [Spring AI 音乐智能体学习复盘](/engineering/spring-ai-music-agent)：放在工程实践里，记录 AI 应用学习链路。

## 内容方向

- 项目与问题排查：真实业务链路中的设计、权衡、排查和复盘放在一起。
- Java 后端：Spring、MyBatis、事务、线程池、JVM 等后端基础与实践。
- 中间件：Redis、MQ、分布式锁、任务调度等工程组件。
- 数据库：连接池、索引、事务、锁、慢 SQL 和数据一致性。
- 工程实践：工具链、AI 应用、代码评审、验证方式和项目复盘。
- 应用场景：把一个应用题拆成主问题、延伸问题、真实执行过程和可验证结论。
