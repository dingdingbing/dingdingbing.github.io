# 应用场景模拟面经

这个模块用来存放应用题式的面试经验。它关注的不是背一个孤立知识点，而是把一个问题放回真实系统里推演：代码怎么执行、线程怎么排队、连接池怎么限制、数据库会不会被压垮、应用会不会超时、线上怎么排查、参数怎么设置、怎么验证结论。

应用题有例子会更生动，也更容易留下印象。后续新的场景题都可以按这个结构继续补充。

## 记录模板

每篇内容尽量按下面的结构整理：

## 主问题

面试官或自己想到的原始问题。

## 直觉答案

第一反应是什么，哪些点可能是模糊的。

## 真实执行场景

代码、线程、连接池、数据库、网络、超时和异常在真实系统里怎么串起来。

## 延伸问题

从主问题能继续追问哪些关联问题。

## 可验证结论

哪些结论可以通过配置、日志、监控、压测或代码实验验证。

## 已整理案例

- [Hikari 连接池与数据库连接数](/scenarios/hikari-connection-pool)
- [后端系统性能瓶颈推演](/scenarios/performance-bottlenecks)
- [后端性能优化场景](/scenarios/performance-optimization)
- [采购结算合同批量打印性能优化实战](/scenarios/purchase-contract-batch-print-optimization)
- [自我介绍里的面试钩子设计](/scenarios/interview-self-introduction-hooks)
- [奇奇怪怪的应用类问题](/scenarios/strange-application-questions)
- [技术选型横向对比](/scenarios/technology-comparison)
- [Spring Boot / Spring Cloud 组件模块梳理](/scenarios/spring-components)
