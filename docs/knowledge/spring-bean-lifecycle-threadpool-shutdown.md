# Spring Bean 生命周期与线程池 / JVM 关闭机制知识整理

---

# 一、Spring Bean 生命周期完整流程

Spring Bean 生命周期，本质是：

text 一个普通 Java 对象 ↓ 被 Spring 创建 ↓ 被 Spring 注入依赖 ↓ 被 Spring 增强 ↓ 成为真正可用的 Bean ↓ 最终被 Spring 销毁 

---

## 1、完整生命周期流程

text 1. BeanDefinition 注册 2. 实例化 Bean 3. 属性赋值（依赖注入） 4. Aware 回调 5. BeanPostProcessor 前置处理 6. 初始化方法 7. BeanPostProcessor 后置处理 8. Bean 放入单例池 9. Bean 可使用 10. 容器关闭 11. Bean 销毁 

---

# 二、BeanDefinition 是什么？

Spring 不会直接：

java new UserService() 

而是会先将 Bean 解析成：

text BeanDefinition 

它本质是：

text Bean 的设计图 

里面保存：

text Bean 类型 作用域 依赖关系 初始化方法 销毁方法 是否懒加载 是否单例 

最终会注册到：

text BeanFactory 

中。

---

# 三、实例化 Bean

Spring 使用反射创建对象：

java clazz.getDeclaredConstructor().newInstance(); 

此时：

text 只是一个空对象 

依赖还未注入。

---

# 四、属性赋值（依赖注入）

例如：

java @Autowired private OrderService orderService; 

Spring 会：

text 找到对应 Bean ↓ 通过反射注入 

例如：

java field.set(userService, orderService); 

---

# 五、Aware 回调

Aware 的本质：

text 让 Bean 感知 Spring 容器内部对象 

例如：

text BeanName BeanFactory ApplicationContext Environment 

---

## 常见 Aware

### 1、BeanNameAware

java implements BeanNameAware 

可以拿到：

text Bean 在容器中的名字 

---

### 2、BeanFactoryAware

java implements BeanFactoryAware 

可以获取：

java beanFactory.getBean(...) 

---

### 3、ApplicationContextAware（最常见）

java implements ApplicationContextAware 

可以拿到：

java ApplicationContext 

很多项目中的：

text SpringContextHolder 

本质就是这个。

---

# 六、BeanPostProcessor（核心扩展点）

Spring 大量高级功能都依赖它：

text AOP @Autowired @PostConstruct @Resource 

---

## 前置处理

java postProcessBeforeInitialization() 

执行时机：

text 初始化前 

---

## 后置处理

java postProcessAfterInitialization() 

这里最重要：

text AOP 动态代理 

很多时候：

text IOC 中真正放入的 Bean 不是原对象 而是代理对象 

例如：

text UserService$$SpringProxy 

---

# 七、初始化方法

常见三种：

---

## 1、@PostConstruct

java @PostConstruct public void init() { } 

---

## 2、InitializingBean

java implements InitializingBean 

---

## 3、init-method

java @Bean(initMethod = "init") 

---

# 八、销毁阶段

触发条件：

text ApplicationContext 关闭 

例如：

java context.close() 

或者：

text Spring Boot 停机 K8s 删除 Pod Docker stop Ctrl + C 

---

## 常见销毁方式

### 1、@PreDestroy

java @PreDestroy public void destroy() { } 

---

### 2、DisposableBean

java implements DisposableBean 

---

### 3、destroy-method

java @Bean(destroyMethod = "close") 

---

# 九、Spring destroy 的本质

destroy：

text 不是对象死亡 

而是：

text 资源释放回调 

例如：

text 关闭线程池 关闭数据库连接 关闭 MQ 关闭 Netty 

真正对象回收：

属于：

text GC 行为 

---

# 十、为什么 Web 项目感觉 destroy 不执行？

因为：

text Spring Boot Web 项目长期运行 

只有：

text 应用停机 容器关闭 Pod销毁 

才会执行 destroy。

---

# 十一、JVM 为什么有时候无法退出？

JVM 是否退出，核心规则：

---

## JVM 会在：

text 所有非守护线程（User Thread）结束后 

自动退出。

---

只要：

text 还有一个非 daemon 线程活着 

JVM：

text 就不会自然退出 

---

# 十二、守护线程（Daemon）和非守护线程区别

---

## 守护线程（daemon）

text 不会阻止 JVM 退出 

例如：

text GC线程 监控线程 

本质：

text 辅助线程 

---

## 非守护线程（User Thread）

text 会阻止 JVM 退出 

例如：

text Tomcat 工作线程 线程池 worker 业务线程 

本质：

text 核心业务线程 

---

# 十三、线程池为什么会导致 JVM 无法退出？

因为线程池 worker 默认：

text 非 daemon 

即使没有任务：

worker 也会：

text 阻塞等待新任务 

类似：

java while (true) {     Runnable task = queue.take(); } 

因此：

text 线程始终存活 

JVM 会认为：

text 还有业务线程没结束 

所以：

text 不会自然退出 

---

# 十四、shutdown 和 shutdownNow 区别

---

## shutdown()

java executor.shutdown(); 

含义：

text 1. 不再接收新任务 2. 已提交任务继续执行 3. 队列任务继续执行 4. 最终优雅关闭 

---

## shutdownNow()

java executor.shutdownNow(); 

含义：

text 1. 不再接收新任务 2. 尝试 interrupt 正在执行的线程 3. 返回尚未执行的任务 4. 不保证一定立刻停止 

---

# 十五、为什么 shutdownNow 不一定生效？

因为 Java 中断：

text 是协作式中断 

如果线程：

java while(true) { } 

不检查中断状态：

text 可能永远停不下来 

正确写法：

java while (!Thread.currentThread().isInterrupted()) { } 

或者：

java try {     Thread.sleep(1000); } catch (InterruptedException e) {     Thread.currentThread().interrupt();     return; } 

---

# 十六、线程池正确关闭方式

推荐：

java @PreDestroy public void destroy() {      executor.shutdown();      try {          if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {             executor.shutdownNow();         }      } catch (InterruptedException e) {          executor.shutdownNow();          Thread.currentThread().interrupt();     } } 

逻辑：

text 先优雅关闭 等待任务结束 超时后强制中断 

---

# 十七、Spring 管理线程池的推荐方式

---

## 推荐：声明成 Bean

java @Bean(destroyMethod = "shutdown") public ExecutorService executorService() {     return Executors.newFixedThreadPool(10); } 

这样：

text Spring 容器关闭时 自动 shutdown 

---

## @Async 的线程池

例如：

java @Bean public ThreadPoolTaskExecutor taskExecutor() 

通常：

text 由 Spring 自动管理生命周期 

推荐配置：

java executor.setWaitForTasksToCompleteOnShutdown(true); executor.setAwaitTerminationSeconds(30); 

---

# 十八、生产环境停机流程（K8s / Spring Boot）

真实流程：

text K8s / Docker / DevOps ↓ 发送 SIGTERM ↓ JVM ShutdownHook ↓ Spring context.close() ↓ 执行 destroy / @PreDestroy ↓ 线程池 shutdown ↓ JVM 尝试自然退出 ↓ 超时后 SIGKILL 强杀 

---

# 十九、为什么需要优雅停机？

因为强杀可能导致：

text 任务执行到一半 事务未提交 MQ offset 未提交 请求丢失 日志未落盘 连接未释放 

因此：

text destroy 本质是服务优雅停机机制 

---

# 二十、最终总结（面试级别）

---

Spring Bean 生命周期，本质是 Spring 将一个普通对象逐步加工成可用 Bean 的过程，包括实例化、依赖注入、Aware 回调、初始化、AOP 增强以及最终销毁。

destroy 并不等于对象被 GC 回收，而是 Spring 在容器关闭时执行的资源释放回调。

线程池默认使用的是非 daemon 线程，因此只要线程池 worker 仍然存活，JVM 就不会自然退出。

Spring destroy 的核心价值，就是在容器关闭时优雅 shutdown 这些线程池、连接池和中间件资源，确保服务能够正常收尾，而不是被操作系统强制 kill。