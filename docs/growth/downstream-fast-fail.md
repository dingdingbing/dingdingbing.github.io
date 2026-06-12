# 下游不确定接口如何快速失败

## 场景

在真实后端系统里，一个主接口往往不是只操作本地数据库，而是会串联多个外部依赖：

```text
Controller
  -> 本地业务逻辑
  -> Dubbo 内部服务
  -> Feign HTTP 服务
  -> 第三方 HTTP 接口
  -> Redis / MySQL / MQ / ES
```

只要其中一个下游变慢，主接口就可能被拖住。尤其是日志、通知、埋点、审计、运营查询这类非核心能力，如果没有隔离和快速失败，很容易把主流程拖到超时。

之前排查过一次生产问题：MQ 消费链路中同步调用日志服务，日志服务写 ES。事故时运营侧高频查询 ES，导致 ES 磁盘 IO 打满，日志写入变慢。调用方一直等待日志接口返回，最后触发 20 秒 TimeLimiter 超时，后续业务步骤没有执行，形成数据缺失。

这个问题背后的通用能力是：

> 对下游不确定接口，不能只靠 try-catch，而要通过超时、熔断、限流、舱壁隔离、异步化、降级和补偿控制故障传播范围。

## 核心思路

快速失败不是让下游“一定成功”，而是限制它占用主流程资源的时间和范围。

可以按这几层理解：

```text
超时：单次调用最多等多久；
熔断：下游持续失败时，后续请求直接失败，不再继续打下游；
限流：限制调用下游的频率或并发；
隔离：给不稳定下游单独线程池、连接池或资源池；
降级：失败后走替代逻辑，不影响主流程；
异步：非核心能力不要放在同步主链路中；
补偿：核心步骤失败后能重试、重放、修复。
```

一条很实用的判断规则是：

```text
核心依赖：失败会影响业务正确性，需要重试、幂等、补偿和告警；
非核心依赖：失败不应该阻断主流程，需要短超时、熔断、隔离和降级。
```

## Feign 快速失败

Spring Cloud OpenFeign 常见配置粒度是全局和 client 级别。

```yaml
feign:
  client:
    config:
      default:
        connect-timeout: 15000
        read-timeout: 30000
      businessStatusLogApi:
        connect-timeout: 1000
        read-timeout: 2000
```

含义：

```text
connect-timeout：建立连接最多等多久；
read-timeout：连接建立后，等待响应最多等多久。
```

如果下游已经接收到请求，但迟迟不返回，真正起作用的是 `read-timeout`。所以对日志、通知这类非核心接口，只降低 `connect-timeout` 不够，还要单独降低 `read-timeout`。

调用方还要配合降级：

```java
try {
    businessStatusLogApi.saveBusinessLog(param);
} catch (Exception e) {
    log.warn("保存业务日志失败，已降级, orderCode={}", orderCode, e);
}
```

Feign 和 Dubbo 有一个区别：Dubbo 原生支持方法级 timeout，但 Spring Cloud OpenFeign 常规配置一般支持到 client 级别。如果同一个 Feign client 里有的方法重要、有的方法不重要，推荐拆成多个 client。

```java
@FeignClient(name = "businessStatusLogWriteApi")
public interface BusinessStatusLogWriteApi {

    @PostMapping("/saveBusinessLog")
    void saveBusinessLog(@RequestBody BusinessLogSaveParam param);
}
```

```java
@FeignClient(name = "businessStatusLogQueryApi")
public interface BusinessStatusLogQueryApi {

    @GetMapping("/queryBusinessLog")
    List<BusinessLogVO> queryBusinessLog(@RequestParam String orderCode);
}
```

然后分别配置：

```yaml
feign:
  client:
    config:
      businessStatusLogWriteApi:
        connect-timeout: 1000
        read-timeout: 2000
      businessStatusLogQueryApi:
        connect-timeout: 3000
        read-timeout: 10000
```

如果暂时不能拆 client，可以在 service 层用 Resilience4j 或 Sentinel 对具体方法做外层保护。

## Dubbo 快速失败

Dubbo 支持全局、接口级、方法级超时。

接口级：

```java
@DubboReference(timeout = 2000, retries = 0, check = false)
private BusinessStatusLogDubboApi businessStatusLogDubboApi;
```

方法级：

```java
@DubboReference(methods = {
    @Method(name = "saveBusinessLog", timeout = 1000, retries = 0),
    @Method(name = "queryBusinessLog", timeout = 5000, retries = 0)
})
private BusinessStatusLogDubboApi businessStatusLogDubboApi;
```

全局配置：

```yaml
dubbo:
  consumer:
    timeout: 3000
    retries: 0
```

调用方同样要降级：

```java
try {
    businessStatusLogDubboApi.saveBusinessLog(param);
} catch (Exception e) {
    log.warn("Dubbo 日志接口调用失败，已降级, orderCode={}", orderCode, e);
}
```

Dubbo 的 `retries` 要特别小心。写接口、非幂等接口一般建议 `retries=0`。如果配置了 `retries=2`，实际可能是第一次调用加两次重试，也就是最多调用三次，容易造成重复写。

## RestTemplate 快速失败

老项目里常见 `RestTemplate`。

```java
@Bean
public RestTemplate logRestTemplate() {
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(1000);
    factory.setReadTimeout(2000);
    return new RestTemplate(factory);
}
```

调用：

```java
try {
    logRestTemplate.postForObject(url, request, Void.class);
} catch (RestClientException e) {
    log.warn("HTTP 日志接口调用失败，已降级, orderCode={}", orderCode, e);
}
```

如果不同下游超时时间不同，不建议用一个全局 `RestTemplate` 打所有接口。更好的方式是按下游能力拆 Bean，例如日志接口一个、核心业务接口一个、第三方接口一个。

## WebClient 快速失败

WebClient 常用于响应式项目，也可以在普通项目中使用。

```java
HttpClient httpClient = HttpClient.create()
    .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 1000)
    .responseTimeout(Duration.ofSeconds(2));

WebClient webClient = WebClient.builder()
    .clientConnector(new ReactorClientHttpConnector(httpClient))
    .build();
```

调用时也可以加整体超时：

```java
try {
    webClient.post()
        .uri(url)
        .bodyValue(request)
        .retrieve()
        .bodyToMono(Void.class)
        .timeout(Duration.ofSeconds(2))
        .block();
} catch (Exception e) {
    log.warn("WebClient 调用失败，已降级, orderCode={}", orderCode, e);
}
```

需要注意：`block()` 会阻塞当前线程。如果主流程里直接 `block()`，它仍然是同步等待。非核心能力最好配合异步、线程池隔离或 MQ。

## OkHttp 快速失败

直接用 Java 代码发 HTTP 请求时，OkHttp 的超时配置比较完整。

```java
OkHttpClient client = new OkHttpClient.Builder()
    .connectTimeout(Duration.ofSeconds(1))
    .readTimeout(Duration.ofSeconds(2))
    .writeTimeout(Duration.ofSeconds(2))
    .callTimeout(Duration.ofSeconds(3))
    .build();
```

含义：

```text
connectTimeout：建连超时；
readTimeout：读取响应超时；
writeTimeout：写请求体超时；
callTimeout：整个调用总耗时上限。
```

调用：

```java
Request request = new Request.Builder()
    .url(url)
    .post(RequestBody.create(json, MediaType.parse("application/json")))
    .build();

try (Response response = client.newCall(request).execute()) {
    if (!response.isSuccessful()) {
        log.warn("HTTP 日志接口返回失败, code={}, orderCode={}", response.code(), orderCode);
    }
} catch (IOException e) {
    log.warn("HTTP 日志接口调用异常，已降级, orderCode={}", orderCode, e);
}
```

如果只能选一个兜底配置，`callTimeout` 很实用，因为它限制的是整个调用过程。

## Apache HttpClient 快速失败

很多老系统或 SDK 底层会使用 Apache HttpClient。

```java
RequestConfig requestConfig = RequestConfig.custom()
    .setConnectTimeout(1000)
    .setConnectionRequestTimeout(1000)
    .setSocketTimeout(2000)
    .build();

CloseableHttpClient httpClient = HttpClients.custom()
    .setDefaultRequestConfig(requestConfig)
    .build();
```

含义：

```text
connectTimeout：建立连接超时；
connectionRequestTimeout：从连接池获取连接超时；
socketTimeout：等待响应数据超时。
```

这里 `connectionRequestTimeout` 很重要。连接池被慢请求占满时，后续请求还没真正发出去，就可能一直等连接。如果不限制获取连接的等待时间，主流程也会被拖住。

## JDK HttpClient 快速失败

JDK 11 之后自带 `HttpClient`。

```java
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(1))
    .build();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(url))
    .timeout(Duration.ofSeconds(2))
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();
```

调用：

```java
try {
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
} catch (IOException e) {
    log.warn("JDK HttpClient 调用失败，已降级, orderCode={}", orderCode, e);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    log.warn("JDK HttpClient 调用被中断，已降级, orderCode={}", orderCode, e);
}
```

`request.timeout` 控制单次请求整体超时。

## Resilience4j 统一治理

如果希望不依赖具体调用方式，可以在外层统一包 Resilience4j。

常见能力：

```text
TimeLimiter：限制单次等待；
CircuitBreaker：失败率高时熔断；
Bulkhead：限制并发，做舱壁隔离；
RateLimiter：限制调用频率；
Retry：有限重试，必须结合幂等性。
```

配置示例：

```yaml
resilience4j:
  timelimiter:
    instances:
      businessStatusLog:
        timeout-duration: 2s
  circuitbreaker:
    instances:
      businessStatusLog:
        sliding-window-size: 20
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
  bulkhead:
    instances:
      businessStatusLog:
        max-concurrent-calls: 10
        max-wait-duration: 0
```

这个配置表达的是：

```text
单次最多等 2 秒；
失败率超过阈值后熔断；
最多允许 10 个并发调用日志接口；
超过并发后不等待，直接快速失败。
```

如果使用 `TimeLimiter` 包同步调用，通常需要把调用放进独立线程池：

```java
@TimeLimiter(name = "businessStatusLog")
@CircuitBreaker(name = "businessStatusLog", fallbackMethod = "saveBusinessLogFallback")
public CompletableFuture<Void> saveBusinessLogAsync(BusinessLogSaveParam param) {
    return CompletableFuture.runAsync(() -> businessStatusLogApi.saveBusinessLog(param), logExecutor);
}

public CompletableFuture<Void> saveBusinessLogFallback(BusinessLogSaveParam param, Throwable e) {
    log.warn("保存业务日志失败，已降级, businessCode={}", param.getBusinessCode(), e);
    return CompletableFuture.completedFuture(null);
}
```

## 线程池隔离

无论 Feign、Dubbo 还是 HTTP Client，都可以通过独立线程池隔离非核心下游。

```java
private final ThreadPoolExecutor logExecutor = new ThreadPoolExecutor(
    4,
    8,
    60,
    TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(500),
    new ThreadPoolExecutor.AbortPolicy()
);

public void saveLogAsync(BusinessLogParam param, String orderCode) {
    try {
        logExecutor.execute(() -> {
            try {
                businessStatusLogApi.saveBusinessLog(param);
            } catch (Exception e) {
                log.warn("异步保存日志失败, orderCode={}", orderCode, e);
            }
        });
    } catch (RejectedExecutionException e) {
        log.warn("日志线程池已满，丢弃日志任务, orderCode={}", orderCode, e);
    }
}
```

线程池隔离的重点：

```text
不要用无界队列；
不要用 CallerRunsPolicy 承接非核心任务；
拒绝后要记录日志和指标；
要监控 active、queue、reject count；
线程池满了只能降级，不能把压力打回主流程。
```

## 重试要谨慎

快速失败不是完全不能重试，而是不能盲目重试。

适合重试：

```text
网络闪断；
偶发 502/503；
短暂连接失败；
幂等读接口；
幂等写接口。
```

不适合盲目重试：

```text
下游已经 IO 打满；
接口非幂等；
写操作没有幂等键；
主流程同步等待；
失败原因是参数错误或业务规则失败。
```

更稳的策略是：

```text
短超时 + 小次数重试 + 熔断 + 异步补偿
```

对于写接口，一定要先确认幂等：

```text
是否有业务唯一键；
重复请求会不会重复落库；
是否支持幂等 token；
是否可以根据业务单号安全重放。
```

## 快速失败和异步的取舍

快速失败和异步不是同一个层面的东西。

```text
快速失败解决的是：最多等多久；
异步解决的是：主流程要不要等。
```

快速失败适合下游仍然在同步链路里，但调用方不希望它无限拖住主流程。

```text
主流程
  -> 调用下游接口
  -> 最多等 1 到 2 秒
  -> 失败就降级
  -> 主流程继续或按业务规则失败
```

快速失败的优势：

```text
改动小，通常只需要配置超时、熔断或限流；
调用语义简单，仍然是同步流程；
能限制单次调用最长耗时；
问题暴露更快，不会让线程一直挂住；
适合作为所有下游调用的第一层保护。
```

快速失败的劣势：

```text
主线程仍然要等待一小段时间；
下游慢时仍然会占用调用线程、连接和线程池；
只限制单次等待，不等于完成资源隔离；
超时时间不好定，太短可能误杀，太长又会拖慢主流程；
如果没有降级，快速失败仍然会让主流程失败。
```

异步适合下游不是主流程必须立即成功的能力。

```text
主流程
  -> 投递日志/通知/埋点任务
  -> 主流程继续
  -> 异步线程、MQ 或补偿任务慢慢处理
```

异步的优势：

```text
主流程不等待，下游慢不会直接拖住主接口；
能削峰，适合日志、通知、埋点、审计等非核心能力；
可以配合 MQ、Outbox、补偿机制提高可靠性；
更容易做线程池隔离、限流和失败重试；
用户侧响应更稳定。
```

异步的劣势：

```text
代码和架构复杂度更高；
结果不是立即一致，而是最终一致；
需要处理任务丢失、重复消费、失败重试和补偿；
排查链路更复杂，需要 traceId、业务单号和步骤状态；
如果只用本地线程池，应用重启时可能丢任务。
```

可以用这张表来判断：

| 维度 | 快速失败 | 异步 |
| --- | --- | --- |
| 解决问题 | 限制同步等待时间 | 主流程不等待下游 |
| 改动成本 | 较低 | 中到高 |
| 一致性 | 更接近立即一致 | 最终一致 |
| 对主流程保护 | 中等，仍会等待一小段时间 | 更强，主流程直接解耦 |
| 复杂度 | 较低 | 较高 |
| 适用场景 | 核心依赖、短期止血、同步必须知道结果 | 日志、通知、埋点、ES 同步、审计等非核心能力 |

实际项目里通常不是二选一，而是组合使用：

```text
主流程异步投递任务；
异步执行时也配置短超时；
下游持续失败时熔断；
异步线程池做有界隔离；
任务失败后记录状态并补偿。
```

也可以总结为：

```text
异步解决“不拖主流程”；
快速失败解决“不拖异步资源”；
熔断解决“下游坏了还一直打”；
隔离解决“别拖垮主线程池”；
补偿解决“失败后可恢复”。
```

## 怎么选方案

可以按调用类型选择：

| 场景 | 推荐方案 |
| --- | --- |
| Feign 非核心接口 | client 级短超时，必要时拆 client |
| Feign 单方法特殊超时 | 拆 Feign client，或 service 层包 Resilience4j |
| Dubbo 接口 | 接口级或方法级 timeout，写接口 retries=0 |
| 原生 HTTP 调用 | 配 connect/read/write/call timeout |
| 连接池可能被占满 | 配获取连接超时，例如 connectionRequestTimeout |
| 下游持续故障 | 熔断，不再持续打下游 |
| 下游容量有限 | 限流或 Bulkhead |
| 非核心能力 | 异步化、降级、独立线程池 |
| 核心步骤 | 幂等、状态记录、补偿、告警 |

## 面试表达

如果面试中被问到“下游接口慢，怎么防止拖垮主接口”，可以这样回答：

```text
我会先对下游依赖做分级。核心依赖失败会影响业务正确性，需要短超时、有限重试、幂等和补偿；非核心依赖比如日志、通知、埋点，不应该阻塞主流程，要做短超时、熔断、限流、舱壁隔离和降级。

具体到实现上，Feign 可以按 client 单独配置 connect-timeout 和 read-timeout，如果需要方法级差异，建议拆 Feign client 或在 service 层用 Resilience4j 包一层；Dubbo 支持接口级和方法级 timeout，写接口 retries 要设为 0；原生 HTTP client 要配置连接超时、读取超时、连接池获取超时或整体调用超时。

另外，超时只能限制单次等待，不能解决下游持续故障，所以还需要熔断和线程池隔离。对非核心接口，最好异步化或 MQ 化，失败后记录告警和补偿信息，确保下游慢或挂的时候只损失辅助能力，不拖垮主业务链路。
```

## 总结

- 快速失败的目标不是让下游成功，而是限制下游占用主流程资源的时间和范围。
- `connect-timeout` 解决连不上，`read-timeout` / `socket-timeout` 解决下游不返回。
- Dubbo 原生支持方法级 timeout；Spring Cloud OpenFeign 常规配置更偏 client 级，方法级差异推荐拆 client 或外层治理。
- 连接池获取超时也很重要，很多慢请求不是卡在执行，而是卡在等待连接。
- 非核心能力要短超时、降级、异步和隔离；核心能力要幂等、补偿、告警。
- 防止下游拖垮主流程，不能只靠 catch，要组合使用超时、熔断、限流、线程池隔离、异步化和补偿。
