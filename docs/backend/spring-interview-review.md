# Spring 面试复盘：基础、AOP 与事务前 20 题

这篇记录第一轮 Spring 面试题复盘，先覆盖基础、AOP 和事务前 20 题。整理方式是：先保留自己的回答判断，再给出更适合面试表达的答案，方便后续反复对照。

## 一、Spring 基础

### 1. Spring 是什么？它解决了 Java 开发中的哪些问题？

我的回答：Spring 是一个 Java 轻量级框架，用于解决 Java 企业级应用开发中繁琐复杂的问题，但具体解决什么不够清楚。

标准回答：Spring 是一个 Java 企业级应用开发框架，核心能力是 IoC 和 AOP。IoC 让对象创建和依赖关系交给容器管理，降低代码耦合；AOP 把事务、日志、权限、监控等横切逻辑从业务代码中抽离出来，让开发者更专注业务本身。

差距提示：回答时要带上 `IoC`、`AOP`、`容器管理对象`、`解耦`、`事务等横切能力`。

### 2. 什么是 IoC？什么是 DI？两者有什么关系？

我的回答：IoC 是控制反转，DI 是依赖注入。IoC 是一种设计思想，DI 是 Spring 对 IoC 的实现。

标准回答：IoC 是控制反转，原来对象依赖由程序员自己 `new`，现在交给 Spring 容器创建和管理。DI 是依赖注入，是 IoC 的具体实现方式，Spring 在创建 Bean 时把它依赖的对象注入进去。

差距提示：这题方向正确，补一句“从自己创建对象变成容器创建和装配对象”会更完整。

### 3. Spring Bean 的生命周期有哪些关键阶段？

我的回答：只记得初始化和销毁。

标准回答：Bean 生命周期主线是：BeanDefinition 注册、实例化 Bean、属性赋值、Aware 回调、BeanPostProcessor 前置处理、初始化方法、BeanPostProcessor 后置处理、Bean 可使用、容器关闭时销毁。

差距提示：面试不一定要背所有扩展点，但要讲清楚“实例化 -> 依赖注入 -> 初始化 -> AOP 增强 -> 使用 -> 销毁”这条主线。

### 4. BeanFactory 和 ApplicationContext 有什么区别？

我的回答：BeanFactory 像创建 Bean 的工厂，ApplicationContext 是应用上下文，通常用它获取 Bean。

标准回答：`BeanFactory` 是 Spring 最基础的 IoC 容器，功能偏底层，默认懒加载 Bean。`ApplicationContext` 是它的子接口，提供更完整的企业级能力，例如国际化、事件发布、资源加载、自动注册后置处理器等。实际开发中通常使用 `ApplicationContext`。

差距提示：重点不是“都能获取 Bean”，而是 `ApplicationContext` 在基础容器之上扩展了企业级能力。

### 5. Spring 中 Bean 的作用域有哪些？默认是什么？

我的回答：单例和多例，默认单例。

标准回答：常见作用域包括 `singleton`、`prototype`、`request`、`session`、`application`。默认是 `singleton`，表示一个 Spring 容器中只有一个 Bean 实例；`prototype` 表示每次获取都会创建新的 Bean；后几个主要用于 Web 环境。

差距提示：单例和多例是核心，Web 作用域也要能说出名字。

### 6. @Component、@Service、@Repository、@Controller 有什么区别？

我的回答：它们都用于声明类需要注册成 Bean，但具体区别不清楚。

标准回答：它们本质上都是 `@Component` 的派生注解，都能把类交给 Spring 管理。区别主要是语义和分层：`@Controller` 用于控制层，`@Service` 用于业务层，`@Repository` 用于持久层，`@Component` 用于通用组件。`@Repository` 还和持久层异常转换有关。

差距提示：先说“本质一样”，再说“语义分层不同”，最后补 `@Repository` 的异常转换加分。

### 7. @Autowired 和 @Resource 的区别是什么？

我的回答：`@Autowired` 按类型注入，`@Resource` 按 name 注入。

标准回答：`@Autowired` 是 Spring 提供的，默认按类型注入，如果有多个同类型 Bean，可以结合 `@Qualifier` 或字段名判断。`@Resource` 是 JSR-250 规范提供的，默认按名称注入，找不到再按类型注入。

差距提示：这题方向正确，补充“来源不同”和“多 Bean 时的处理方式”即可。

### 8. Spring 如何解决循环依赖？哪些循环依赖解决不了？

我的回答：记成了二级缓存，具体机制遗忘。

标准回答：Spring 通过三级缓存解决单例 Bean 的 setter 或字段注入循环依赖。核心思路是提前暴露 Bean 的早期引用，让另一个 Bean 可以先拿到它。构造器循环依赖解决不了，因为对象还没实例化完成，无法提前暴露引用；`prototype` 作用域的循环依赖通常也解决不了。

差距提示：关键字是“三级缓存”“单例”“setter/字段注入”“提前暴露早期引用”“构造器循环依赖解决不了”。

## 二、AOP 高频

### 9. 什么是 AOP？Spring AOP 主要用来解决什么问题？

我的回答：AOP 是切面，可以在 Bean 执行前、执行后、执行中做一些操作。

标准回答：AOP 是面向切面编程，用来把日志、事务、权限、监控等横切逻辑从业务代码中抽离出来。Spring AOP 通过代理对象，在目标方法执行前后织入增强逻辑。

差距提示：表达时少说“帮助我们调用”，多说“抽离横切逻辑”和“代理增强”。

### 10. Spring AOP 和 AspectJ 有什么区别？

我的回答：Spring AOP 复用了 AspectJ 注解，Spring AOP 用代理，AspectJ 的实现方式不同，但描述不准确。

标准回答：Spring AOP 基于动态代理，运行时织入，只能作用于 Spring 容器中的 Bean，主要增强方法级别调用。AspectJ 是完整的 AOP 框架，可以在编译期、类加载期或运行期织入，能力更强，可以增强字段、构造器等更多连接点，但使用成本更高。

差距提示：不要说 AspectJ 是“侵入式编程式注入”，更准确的是“织入能力更完整，织入时机更多”。

### 11. Spring AOP 的底层实现是什么？

我的回答：动态代理。

标准回答：Spring AOP 底层主要基于动态代理实现。有接口时通常可以使用 JDK 动态代理，没有接口时通常使用 CGLIB 创建子类代理。

差距提示：这题答对了，最好顺带引出 JDK 动态代理和 CGLIB。

### 12. JDK 动态代理和 CGLIB 动态代理有什么区别？

我的回答：记混了，以为实现接口用 CGLIB，没有接口用 JDK。

标准回答：JDK 动态代理要求目标类实现接口，代理对象基于接口生成。CGLIB 通过继承目标类生成子类代理，不要求接口，但不能代理 `final` 类或 `final` 方法。

差距提示：记忆方式：JDK 代理“接口”，CGLIB 代理“子类继承”。

### 13. Spring 事务为什么会失效？常见场景有哪些？

我的回答：私有方法调用会失效，需要通过代理类；事务配置没开启也不会生效，其他场景不清楚。

标准回答：常见事务失效场景包括：方法不是 `public`；同类内部方法调用；异常被 `catch` 后没有继续抛出；默认只回滚运行时异常，受检异常没有配置 `rollbackFor`；数据库引擎不支持事务；对象没有交给 Spring 管理；多线程中调用事务方法导致事务上下文没有传递。

差距提示：这题非常高频，要按“代理是否生效、异常是否传播、数据库是否支持、事务边界是否正确”来组织。

### 14. 同一个类中方法内部调用，为什么 @Transactional 可能不生效？

我的回答：因为没有被代理，调用的是当前类，但关键名词不清楚。

标准回答：`@Transactional` 是通过 Spring AOP 代理实现的。外部调用 Bean 方法时，调用的是代理对象，代理对象会开启事务；同一个类内部用 `this.xxx()` 调用方法时，绕过代理对象，直接调用目标方法，所以事务增强不会生效。

差距提示：关键词是“代理对象”“this 调用”“绕过代理”“事务增强没有执行”。

## 三、事务

### 15. Spring 事务传播行为有哪些？常用的是哪几个？

我的回答：记得 `REQUIRED`、`REQUIRES_NEW`、`NEVER`，默认常用 `REQUIRED`。

标准回答：常见传播行为有 `REQUIRED`、`REQUIRES_NEW`、`SUPPORTS`、`NOT_SUPPORTED`、`MANDATORY`、`NEVER`、`NESTED`。最常用的是 `REQUIRED` 和 `REQUIRES_NEW`。`REQUIRED` 表示有事务就加入，没有就新建；`REQUIRES_NEW` 表示总是新建一个独立事务，如果外层有事务则先挂起外层事务。

差距提示：不用死背复杂解释，但 7 个名字和 `REQUIRED`、`REQUIRES_NEW` 的语义必须熟。

### 16. REQUIRED 和 REQUIRES_NEW 的区别是什么？

我的回答：`REQUIRED` 没有事务会新建事务，`REQUIRES_NEW` 是有事务才会新建事务。

标准回答：`REQUIRED` 是有事务就加入当前事务，没有事务就新建。`REQUIRES_NEW` 是不管当前有没有事务，都会新建一个独立事务；如果当前已有事务，会先把外层事务挂起。

差距提示：`REQUIRES_NEW` 不是“有事务才新建”，而是“永远新建独立事务”。

### 17. Spring 事务隔离级别有哪些？默认使用什么？

我的回答：应该和数据库一致，包括读未提交、读已提交、可重复读、串行化，默认不清楚。

标准回答：Spring 事务隔离级别包括 `DEFAULT`、`READ_UNCOMMITTED`、`READ_COMMITTED`、`REPEATABLE_READ`、`SERIALIZABLE`。默认是 `Isolation.DEFAULT`，表示使用数据库默认隔离级别。MySQL InnoDB 默认通常是 `REPEATABLE_READ`。

差距提示：隔离级别本质来自数据库，Spring 做的是封装；默认值要记为 `DEFAULT`。

### 18. @Transactional 默认回滚哪些异常？

我的回答：这一题漏答。

标准回答：`@Transactional` 默认回滚 `RuntimeException` 和 `Error`，不会默认回滚受检异常。

差距提示：这题经常和第 19 题一起问，记住“运行时异常默认回滚，受检异常默认不回滚”。

### 19. 如何让事务对受检异常也回滚？

我的回答：在 `@Transactional` 注解中声明异常 class，但不清楚受检异常是什么。

标准回答：受检异常是 `Exception` 体系中除了 `RuntimeException` 之外、编译器要求显式处理的异常，例如 `IOException`、`SQLException`。让事务对受检异常回滚，可以配置：

```java
@Transactional(rollbackFor = Exception.class)
```

差距提示：实际项目中如果方法可能抛业务异常或受检异常，要明确配置 `rollbackFor`，否则容易出现数据已经提交但业务认为失败的情况。

### 20. 数据库事务已经提交了，MQ 发送失败怎么办？

我的回答：可以重试，也可以通过本地消息表检测，发送失败后由定时任务重新投递。

标准回答：如果业务数据库事务提交后 MQ 发送失败，不能只依赖简单重试。常见方案是本地消息表：业务数据和消息记录放在同一个数据库事务里提交，之后由异步任务扫描未发送消息并重试投递，发送成功后更新状态。消费端还要做好幂等，必要时配合 MQ 确认机制、死信队列和告警，保证最终一致性。

差距提示：这题答得比较好，后续可以补“本地消息表 + 幂等消费 + 最终一致性”的完整闭环。

## 四、下一轮优先复习

下一次优先重新回答这 5 题：

1. Bean 生命周期
2. 三级缓存与循环依赖
3. JDK 动态代理和 CGLIB
4. Spring 事务失效场景
5. `REQUIRED` 和 `REQUIRES_NEW`

这 5 个点是 Spring 面试里最容易从基础题追到源码和项目经验的地方。
