# Spring 面试复盘：基础、AOP、事务、容器源码、MVC 与 Boot

这篇记录 Spring 面试题复盘，先覆盖基础、AOP、事务、Bean 与容器源码、Spring MVC、Spring Boot。整理方式是：先保留自己的回答判断，再给出更适合面试表达的答案，最后把追问里的疑问点单独沉淀，方便后续反复对照。

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

## 四、Bean 与容器源码

### 21. Spring 容器启动时大致做了哪些事情？

我的回答：感觉和 Bean 初始化差不多，包括实例化、依赖注入、初始化、AOP 增强、使用、销毁；此外还要加载配置、区分加载哪些配置，但具体名词不清楚。

标准回答：Spring 容器启动时，会先加载配置，解析扫描到的类或 `@Bean` 方法，把它们封装成 `BeanDefinition` 注册到 `BeanFactory` 中；然后注册各种后置处理器；接着实例化非懒加载的单例 Bean，完成依赖注入、初始化、AOP 代理等流程；最后容器启动完成，对外提供 Bean 获取、事件发布等能力。

差距提示：容器启动包含 Bean 生命周期，但还要补上 `配置加载`、`BeanDefinition`、`BeanFactory`、`BeanPostProcessor`、`单例 Bean 实例化`。

### 22. Bean 是如何被创建出来的？

我的回答：Bean 是被 `BeanFactory` 创建出来的，`ApplicationContext` 提供更多能力，但具体过程忘了。

标准回答：Spring 先根据 `BeanDefinition` 找到 Bean 的 class、作用域、依赖、初始化方法等元信息，然后通过反射构造器或工厂方法实例化对象，再进行属性填充、Aware 回调、初始化、后置处理器增强，最后放入单例池。

差距提示：`ApplicationContext` 不是 `BeanFactory` 的父接口，而是更高级的容器接口，内部持有并使用 `BeanFactory`。

### 23. BeanPostProcessor 是什么？有什么作用？

我的回答：很熟悉，好像是 Bean 加载过程中的一个步骤，用于增强。

标准回答：`BeanPostProcessor` 是 Spring 提供的 Bean 后置处理器扩展点，可以在 Bean 初始化前后插入逻辑。很多能力都依赖它，比如 `@Autowired`、`@PostConstruct`、AOP 代理等。

差距提示：记住两个方法位置：初始化前的 `postProcessBeforeInitialization`，初始化后的 `postProcessAfterInitialization`。

### 24. FactoryBean 和普通 Bean 有什么区别？

我的回答：不清楚哪些 Bean 是由 factory 创建的，也不清楚如何区分。

标准回答：普通 Bean 管理的是对象本身；`FactoryBean` 本身也是 Bean，但它的作用是生产另一个 Bean。调用 `getBean("xxx")` 拿到的是 `FactoryBean#getObject()` 返回的对象；如果想拿工厂本身，要调用 `getBean("&xxx")`。

差距提示：业务代码里很少手动使用 `&`，更多是框架内部、调试或确实要操作工厂对象时才会用。典型例子是 MyBatis 的 `SqlSessionFactoryBean`、`MapperFactoryBean`。

### 25. InitializingBean、@PostConstruct、init-method 的执行顺序是什么？

我的回答：三个都是初始化方法，但执行顺序不清楚，`init-method` 感觉很少用。

标准回答：完整顺序是：`BeanPostProcessor#postProcessBeforeInitialization` -> `@PostConstruct` -> `InitializingBean#afterPropertiesSet()` -> 自定义 `init-method` -> `BeanPostProcessor#postProcessAfterInitialization`。

差距提示：`init-method` 通常来自 XML 或 `@Bean(initMethod = "init")`，Spring 会从 `BeanDefinition` 里读取方法名，再通过反射调用。

### 26. Spring 的三级缓存分别是什么？为什么需要三级缓存解决循环依赖？

我的回答：三级缓存概念需要重新普及，记错成能解决单例构造器循环依赖；也不清楚构造器注入是不是 setter。

标准回答：一级缓存 `singletonObjects` 保存完整单例 Bean；二级缓存 `earlySingletonObjects` 保存提前暴露的早期 Bean；三级缓存 `singletonFactories` 保存能生成早期 Bean 引用的工厂。三级缓存主要解决单例 setter/字段注入循环依赖，并兼容 AOP 场景下的早期代理对象。

差距提示：构造器注入不是 setter。构造器注入是 `public A(B b)`；setter 注入是 `setB(B b)`；字段注入是 `@Autowired private B b`。

### 27. 为什么构造器注入的循环依赖无法解决？

我的回答：误以为能解决，只是多例解决不了。

标准回答：构造器注入时，A 创建必须先有 B，B 创建又必须先有 A，两个对象都没有完成实例化，Spring 没有任何半成品对象可以提前暴露，所以解决不了。setter/字段注入可以先实例化空对象，再补充依赖，因此单例场景可以通过三级缓存解决。

差距提示：构造器循环依赖通常应该通过调整设计解决，比如拆出第三个服务、改成单向依赖、用事件解耦，或用 `ObjectProvider`、`@Lazy` 延迟获取兜底。

## 五、Spring MVC

### 28. Spring MVC 的请求处理流程是什么？

我的回答：请求进来后先找 handler，再找 adapter，处理完数据后找到 view 返回，具体细节忘了。

标准回答：请求先进入 `DispatcherServlet`，它通过 `HandlerMapping` 找到对应 handler，再通过 `HandlerAdapter` 调用目标方法。方法执行后返回 `ModelAndView` 或响应体；如果是页面渲染，交给 `ViewResolver` 解析视图；如果是接口返回 JSON，通过 `HttpMessageConverter` 写回响应。

差距提示：接口项目里经常没有传统页面视图，但 `DispatcherServlet -> HandlerMapping -> HandlerAdapter -> Controller -> HttpMessageConverter` 这条线要熟。

### 29. DispatcherServlet 的作用是什么？

我的回答：通过路径匹配找到处理器。

标准回答：`DispatcherServlet` 是 Spring MVC 的前端控制器，负责统一接收请求、分发请求、调用处理器、处理返回结果和异常，是整个 Spring MVC 请求流程的调度中心。

差距提示：不要只说“找 handler”，它是 MVC 总调度入口。

### 30. HandlerMapping、HandlerAdapter、ViewResolver 分别负责什么？

我的回答：`HandlerMapping` 找路径映射，`HandlerAdapter` 找方法，`ViewResolver` 渲染页面最终返回。

标准回答：`HandlerMapping` 根据请求找到 handler；`HandlerAdapter` 适配并调用 handler 方法；`ViewResolver` 把逻辑视图名解析成真正的视图页面。

差距提示：这题主线基本正确，补上“适配并调用”即可。

### 31. @RequestBody 和 @ResponseBody 的原理是什么？

我的回答：以为可能是切面增强；`@RequestBody` 把参数 JSON 转对象，`@ResponseBody` 把对象转 JSON 字符串。

标准回答：它们底层主要依赖 `HttpMessageConverter`，不是 AOP。`@RequestBody` 把请求体 JSON 反序列化成 Java 对象；`@ResponseBody` 把 Java 对象序列化成 JSON 写入响应体。

差距提示：关键词是 `HttpMessageConverter`、序列化、反序列化。

### 32. Spring MVC 如何做参数绑定？

我的回答：不清楚参数绑定指什么。

标准回答：参数绑定就是 Spring MVC 把 HTTP 请求中的数据绑定到 Controller 方法参数上。常见来源包括 URL 参数 `@RequestParam`、路径变量 `@PathVariable`、请求头 `@RequestHeader`、Cookie `@CookieValue`、请求体 `@RequestBody`、表单对象普通 Java Bean。

差距提示：遇到“参数绑定”时，直接理解成“HTTP 请求数据如何变成 Java 方法参数”。

### 33. 拦截器和过滤器有什么区别？

我的回答：记反了层级，误以为拦截器在过滤器之前、拦截器是 Tomcat 层、Filter 是 Spring 层。

标准回答：Filter 是 Servlet 规范，运行在 Tomcat/Servlet 容器层面，早于 Spring MVC；Interceptor 是 Spring MVC 提供的，运行在 `DispatcherServlet` 之后、Controller 前后。Filter 能拦截几乎所有 Web 请求，Interceptor 主要拦截进入 Spring MVC 的请求。

差距提示：记忆法：Filter 更外层，像大门；Interceptor 更内层，像 Spring MVC 前台。执行顺序是 `Filter -> DispatcherServlet -> Interceptor -> Controller`。

## 六、Spring Boot

### 34. Spring Boot 和 Spring 有什么区别？

我的回答：Spring Boot 简化了 Spring 配置，从 XML 转向 yml/properties，约定大于配置。

标准回答：Spring Boot 是基于 Spring 的快速开发框架，通过自动配置、starter 依赖、内嵌容器和约定大于配置，减少 XML 和手动配置，让 Spring 应用更容易启动、开发和部署。

差距提示：回答时带上 `自动配置`、`starter`、`内嵌容器`、`约定大于配置`。

### 35. Spring Boot 自动配置原理是什么？

我的回答：自动配置由注解开启，底层有 `AutoConfigurationImportSelector`，通过约定配置扫描加载 Bean，并用 condition 条件过滤。

标准回答：Spring Boot 通过 `@EnableAutoConfiguration` 开启自动配置，底层通过 `AutoConfigurationImportSelector` 读取约定位置中的自动配置类，然后结合 `@ConditionalOnClass`、`@ConditionalOnBean`、`@ConditionalOnMissingBean`、`@ConditionalOnProperty` 等条件注解，判断哪些配置类需要生效，最终把符合条件的 Bean 注册到容器中。

差距提示：新版本主要读取 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`，老版本常见是 `META-INF/spring.factories`。

### 36. @SpringBootApplication 包含哪些注解？

我的回答：只记得自动配置，应该有三个重要注解。

标准回答：三个核心注解是 `@SpringBootConfiguration`、`@EnableAutoConfiguration`、`@ComponentScan`。

差距提示：背法：配置类身份、开启自动配置、组件扫描。

### 37. starter 的作用是什么？

我的回答：starter 提供依赖和能力，包括 pom 依赖、约定好的 `META-INF` 配置，以及能被 Spring 管理并直接调用的能力。

标准回答：starter 主要用于聚合某个功能所需依赖，降低使用成本。开发者引入 starter 后，Spring Boot 会根据自动配置机制加载对应配置类，再根据条件创建 Bean。真正自动配置通常在 `xxx-autoconfigure` 包中，starter 本身更偏依赖聚合入口。

差距提示：不要把 starter 和 autoconfigure 完全混成一个东西：starter 负责“引依赖”，autoconfigure 负责“配 Bean”。

### 38. Spring Boot 如何根据条件决定是否装配一个 Bean？

我的回答：通过 `@ConditionalOnBean`、`@ConditionalOnClass`、`@ConditionalOnProperty`、`@ConditionalOnMissingBean` 等注解。

标准回答：Spring Boot 使用一组 `@Conditional` 派生注解控制 Bean 是否生效，例如 `@ConditionalOnClass` 判断类路径存在某个类，`@ConditionalOnMissingBean` 判断容器中没有某个 Bean，`@ConditionalOnBean` 判断容器中存在某个 Bean，`@ConditionalOnProperty` 判断配置项满足条件，`@ConditionalOnWebApplication` 判断当前是 Web 应用。

差距提示：这题答得比较好，补上每个条件的判断对象即可。

### 39. application.yml 配置是如何绑定到 Java 对象上的？

我的回答：通过 `@ConfigurationProperties` 注解实现，具体原理不清楚，这是刚看代码看到的。

标准回答：`@ConfigurationProperties` 会把 `application.yml` 或 `application.properties` 中指定前缀的配置绑定到 Java 对象属性上。Spring Boot 底层通过 Binder 机制完成属性读取、类型转换和对象绑定，比如把字符串转成数字、枚举、集合、`Duration` 等类型。

差距提示：关键词是 `@ConfigurationProperties`、`prefix`、`Binder`、类型转换。

### 40. Spring Boot 启动流程大致是什么？

我的回答：不知道如何描述。

标准回答：执行 `SpringApplication.run()` 后，Spring Boot 会推断应用类型，加载启动监听器和环境配置，创建 `ApplicationContext`，加载自动配置和用户配置，刷新容器，完成 Bean 创建和初始化，最后启动内嵌 Web 容器并发布启动完成事件。

差距提示：面试口语版：Spring Boot 启动本质上还是 Spring 容器启动，只是在前后加了环境准备、自动配置加载、内嵌容器启动和事件通知。

## 七、本轮追问疑问点

### BeanDefinition 的作用是什么？

疑问：Bean 的元信息不是已经声明在类、注解或 `@Bean` 方法上了吗，为什么还需要 `BeanDefinition`？

针对性解释：类上的注解、XML、`@Bean` 方法只是配置来源，Spring 不会每次创建 Bean 都重新扫描和解析。它会先把不同来源的配置统一解析成 `BeanDefinition`，注册到 `BeanFactory`，后续创建 Bean 时直接读取这份“创建说明书”。

记忆句：`BeanDefinition` 是 Bean 的创建说明书，把 class、scope、依赖、初始化方法、工厂方法等信息统一保存起来。

### Spring 如何判断反射构造器还是工厂方法实例化？

疑问：通过反射或者工厂方法实例化对象，具体如何判断使用哪种？

针对性解释：看 `BeanDefinition` 里有没有工厂方法信息。普通 `@Service`、`@Component` 通常根据 beanClass 选择构造器反射实例化；`@Bean` 方法或静态工厂方法会在 `BeanDefinition` 中记录 `factoryMethodName`，创建时调用对应工厂方法。

记忆句：有 `factoryMethodName` 走工厂方法；没有就按 class 和构造器反射创建。

### FactoryBean 一般怎么用？& 有什么作用？

疑问：平时好像都是通过 `ApplicationContext` 按名字拿 Bean，没有用过 `FactoryBean`；为什么拿工厂本身要加 `&`？

针对性解释：`FactoryBean` 常用于框架创建复杂对象或代理对象。它本身是 Bean，但普通 `getBean("xxx")` 返回的是 `getObject()` 生产的对象；`getBean("&xxx")` 才返回工厂对象本身。业务代码很少直接拿 `&`，MyBatis、代理对象创建、复杂客户端封装更常见。

记忆句：`xxx` 拿产品，`&xxx` 拿工厂。

### init-method 是怎么调用的？

疑问：`afterPropertiesSet` 实现 `InitializingBean` 即可，`@PostConstruct` 声明在 Bean 里即可，`init-method` 好像很少用，它怎么调用？

针对性解释：`init-method` 通常来自 XML 或 `@Bean(initMethod = "init")`。Spring 会把这个方法名记录到 `BeanDefinition`，初始化阶段在 `@PostConstruct` 和 `afterPropertiesSet()` 之后，通过反射调用这个自定义初始化方法。

记忆句：`@PostConstruct` -> `afterPropertiesSet()` -> `init-method`。

### 三级缓存到底解决了什么？

疑问：系统里多是 Lombok `@RequiredArgsConstructor` 构造器注入、单例 Bean，也没遇到循环依赖；三级缓存到底解决啥？

针对性解释：三级缓存解决的是单例 Bean 的 setter/字段注入循环依赖，并兼容 AOP 早期代理。构造器注入如果出现循环依赖，Spring 解决不了；你们没遇到，通常说明依赖方向比较清晰，或者没有形成 A 构造器依赖 B、B 构造器又依赖 A 的闭环。

记忆句：三级缓存不是鼓励循环依赖，而是给单例属性注入留下兼容空间。

### 构造器循环依赖为什么不行？最终怎么解决？

疑问：构造器里直接 `this.xxx = xx` 不就行了吗？是不是因为后续没有 setter 入口，所以无法解决？

针对性解释：关键不是有没有 setter，而是构造器执行前，参数对象必须已经准备好。`new A(b)` 需要先有 B，`new B(a)` 又需要先有 A，两个对象都没有实例化完成，Spring 没有半成品对象可以提前暴露。setter/字段注入可以先 `new A()`，再补依赖；构造器注入是“带着依赖出生”，双方都要求带着对方出生就卡死。

解决方式：优先改设计，拆出第三个服务、改成单向依赖、用事件解耦；必要时用 `ObjectProvider` 或 `@Lazy` 延迟获取兜底，但不建议为了绕过循环依赖强行改成字段注入。

记忆句：setter/字段注入是先出生再补依赖；构造器注入是带着依赖出生。

### prototype 多例 Bean 的应用场景是什么？

疑问：系统基本都是单例模式，想不到多例应用场景。

针对性解释：后端项目里的 `Service`、`Mapper`、`Controller` 通常无状态，所以默认单例最合适。`prototype` 更适合有状态、每次使用都需要独立实例的对象，例如临时任务对象、复杂计算上下文对象、一次性处理器。但很多时候这类对象直接 `new` 或使用 request scope，不一定注册成 prototype Bean。

记忆句：无状态服务用单例，有状态上下文才考虑多例。

## 八、下一轮优先复习

下一次优先重新回答这 5 题：

1. `BeanDefinition` 与 Bean 创建流程
2. `FactoryBean` 和普通 Bean
3. 三级缓存与构造器循环依赖
4. Spring MVC 请求流程与 `HttpMessageConverter`
5. Spring Boot 自动配置与启动流程

这 5 个点是 Spring 面试里最容易从基础题追到源码、框架设计和项目经验的地方。
