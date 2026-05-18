# 采购结算合同批量打印性能优化实战

## 场景

生产环境有一个“批量打印采购结算合同”的功能。业务人员一次选择多份采购合同后，系统需要逐份生成合同 PDF、下载文件内容、合并成一个 PDF，再上传并返回文件地址给前端下载。

问题发生在一次真实批量打印场景中：

```text
批量打印数量：48 份采购结算合同
优化前生产耗时：约 28s
网关超时限制：20s
用户感知：页面报错，没有拿到下载结果
实际情况：后端可能已经生成成功，但前端没有收到返回 URL
```

这个问题本质上不是单纯的“接口慢”。

慢只是用户等待时间长，但链路还能闭环；超时会导致后端实际生成成功、前端却拿不到文件地址，形成“成功但用户感知失败”的断点，业务上会阻断下载和后续操作。

后来对这条链路做了优化：将原来多合同串行生成的逻辑，调整为基于 `CompletableFuture.supplyAsync` 的并发生成，再统一收集结果、合并 PDF、上传文件。

上线后再次使用生产环境同样 48 条数据验证：

```text
优化前：48 份合同约 28s
优化后：48 份合同约 6.71s
耗时降低：(28 - 6.71) / 28 ≈ 76%
```

这个数据比较适合写进简历，因为它来自真实生产场景，并且前后样本数量一致。

## 当时的解决方式

### 优化前：串行生成、串行下载、最后合并

优化前的核心问题是：每份合同都要调用第三方合同服务生成 PDF，再下载回来。48 份合同如果串行处理，整体耗时会线性累加。

下面是按当时串行逻辑简化还原的代码：

```java
private List<byte[]> generateContracts(List<PurchaseSettleContractPreViewVO> contracts,
        Long templateId, Long mainId) {
    List<byte[]> contents = new ArrayList<>();
    for (PurchaseSettleContractPreViewVO contract : contracts) {
        String fileUrl = generateContract(contract, templateId, mainId);
        if (CharSequenceUtil.isBlank(fileUrl)) {
            throw new CommonException("合同生成失败");
        }
        contents.add(DownloadUtil.getBytes(PRE_URL + fileUrl));
    }
    return contents;
}
```

串行模型的耗时大致是：

```text
总耗时 ≈ 第 1 份生成 + 第 1 份下载
      + 第 2 份生成 + 第 2 份下载
      + ...
      + 第 48 份生成 + 第 48 份下载
      + PDF 合并
      + 上传文件
      + 盖章
```

如果每份合同生成和下载都需要等待外部服务响应，那么接口时间很容易超过网关限制。

### 优化后：并发生成、统一等待、再合并上传

优化后的核心思路是：每份合同生成互不依赖，可以并发执行。

实际优化代码的核心形态如下：

```java
private List<byte[]> asyncGenerateContracts(List<PurchaseSettleContractPreViewVO> purchaseSettleContractPreViewVOS,
        Long templateId, Long mainId) {
    ExecutorService executor = new ThreadPoolExecutor(
            8,
            10,
            100,
            TimeUnit.MILLISECONDS,
            new LinkedBlockingQueue<>(100),
            new ThreadPoolExecutor.AbortPolicy()
    );

    List<CompletableFuture<byte[]>> futures = purchaseSettleContractPreViewVOS.stream()
            .map(purchaseSettleContractPreViewVO ->
                    CompletableFuture.supplyAsync(() -> {
                        try {
                            String result = generateContract(purchaseSettleContractPreViewVO, templateId, mainId);
                            if (CharSequenceUtil.isNotBlank(result)) {
                                return DownloadUtil.getBytes(PRE_URL + result);
                            }
                            throw new CommonException("合同生成失败");
                        } catch (Exception e) {
                            log.error("合同生成或下载失败: {}", e.getMessage(), e);
                            throw new CommonException("下载文件失败！");
                        }
                    }, executor)
                    .exceptionally(e -> {
                        log.error("处理合同异常", e);
                        return null;
                    }))
            .collect(Collectors.toList());

    List<byte[]> contents = futures.stream()
            .map(CompletableFuture::join)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

    executor.shutdown();
    return contents;
}
```

优化后的执行模型变成：

```text
第 1 批：8 个合同并发生成和下载
第 2 批：8 个合同并发生成和下载
...
所有合同内容收集完成
  ↓
PDF 合并
  ↓
上传文件
  ↓
返回文件 URL
```

48 份合同、核心线程数 8，理想情况下可并行阶段大约会被拆成 6 批执行：

```text
48 / 8 = 6 批
```

但整体耗时不会简单变成 1/8，因为 PDF 合并、上传、最终盖章、数据库记录、下游服务吞吐等步骤仍然会影响整体耗时。

## 关键原理

### 1. 为什么这个场景适合并发？

每份合同生成之间没有强依赖关系：

```text
合同 A 的生成不依赖合同 B
合同 B 的生成不依赖合同 C
每份合同最终只需要返回自己的 PDF 内容
```

这种任务天然适合并发执行。

这类任务也不是纯 CPU 计算，更偏 IO 密集型：

```text
调用合同生成服务
等待合同服务响应
下载 PDF
调用盖章服务
上传文件
```

大部分时间是在等外部系统和网络 IO，因此适当提高并发度可以减少整体等待时间。

### 2. 为什么选择 CompletableFuture？

这个场景也可以用 `Callable + Future` 或 `parallelStream` 实现并发，但它们的控制能力不同。

### CompletableFuture 写法

```java
ExecutorService executor = new ThreadPoolExecutor(
        8,
        10,
        100,
        TimeUnit.MILLISECONDS,
        new LinkedBlockingQueue<>(100),
        new ThreadPoolExecutor.AbortPolicy()
);

List<CompletableFuture<byte[]>> futures = contracts.stream()
        .map(contract -> CompletableFuture.supplyAsync(() -> {
            String url = generateContract(contract);
            return downloadBytes(url);
        }, executor))
        .collect(Collectors.toList());

List<byte[]> contents = futures.stream()
        .map(CompletableFuture::join)
        .collect(Collectors.toList());
```

优点：

- 可以显式指定业务线程池，避免和其他业务抢公共线程池。
- 可以先批量提交任务，再统一等待结果，真正并发执行。
- 支持 `thenApply`、`thenCompose`、`allOf`、`exceptionally`、`handle` 等编排能力。
- 后续如果要扩展任务状态、异常兜底、结果聚合，代码表达能力更强。

缺点：

- `join()` 也会阻塞当前线程，不是“不阻塞”。
- 异常处理写不好容易吞异常，例如 `exceptionally` 返回 `null` 后继续过滤。
- 线程池生命周期、队列长度、拒绝策略都需要自己设计清楚。

### Callable + Future 写法

```java
ExecutorService executor = Executors.newFixedThreadPool(8);

List<Future<byte[]>> futures = new ArrayList<>();
for (Contract contract : contracts) {
    Future<byte[]> future = executor.submit(() -> {
        String url = generateContract(contract);
        return downloadBytes(url);
    });
    futures.add(future);
}

List<byte[]> contents = new ArrayList<>();
for (Future<byte[]> future : futures) {
    contents.add(future.get());
}
```

优点：

- 简单直观，适合“提交任务 -> 等结果”的并发场景。
- 可以显式指定线程池。
- `Future.get()` 会把任务异常包装成 `ExecutionException` 抛出，不容易无感丢异常。

缺点：

- 编排能力弱。如果后面要做“生成后下载、下载后合并、失败兜底”，容易写很多手动代码。
- 需要显式处理 `InterruptedException` 和 `ExecutionException`。
- 不如 `CompletableFuture` 适合链式处理和结果聚合。

### parallelStream 写法

```java
List<byte[]> contents = contracts.parallelStream()
        .map(contract -> {
            String url = generateContract(contract);
            return downloadBytes(url);
        })
        .collect(Collectors.toList());
```

优点：

- 代码最短。
- 对纯内存计算、批量数据转换、过滤、聚合比较方便。

缺点：

- 默认使用 `ForkJoinPool.commonPool()`，这是 JVM 级别的公共线程池。
- 不好做业务隔离，可能影响应用内其他 `parallelStream` 或默认 `CompletableFuture` 任务。
- 默认并行度偏 CPU 模型，不适合大量外部 IO 阻塞调用。
- 不方便做明确的限流、拒绝策略、失败合同定位和任务状态记录。

`parallelStream` 并不是不能改线程池，可以强行包一层：

```java
ForkJoinPool pool = new ForkJoinPool(8);

List<byte[]> contents = pool.submit(() ->
        contracts.parallelStream()
                .map(contract -> {
                    String url = generateContract(contract);
                    return downloadBytes(url);
                })
                .collect(Collectors.toList())
).get();

pool.shutdown();
```

但这种写法已经失去了 `parallelStream` 简洁的优势，异常处理、任务状态、拒绝策略依然不直观。这个场景不如直接用 `CompletableFuture` 或 `ExecutorService`。

### 3. 为什么不能创建一个 Future 就马上 join？

错误写法类似：

```java
List<byte[]> contents = contracts.stream()
        .map(contract -> CompletableFuture.supplyAsync(() -> {
            String url = generateContract(contract);
            return downloadBytes(url);
        }, executor).join())
        .collect(Collectors.toList());
```

这个写法的问题是：创建一个任务后马上等待它完成，后面的任务还没有提交，整体会退化成接近串行。

正确思路是两步：

```text
第一步：先创建并提交所有 CompletableFuture
第二步：再统一 join，等待所有结果完成
```

也就是：

```java
List<CompletableFuture<byte[]>> futures = contracts.stream()
        .map(contract -> CompletableFuture.supplyAsync(() -> generateAndDownload(contract), executor))
        .collect(Collectors.toList());

List<byte[]> contents = futures.stream()
        .map(CompletableFuture::join)
        .collect(Collectors.toList());
```

### 4. 理论上能快多少？

48 个合同、8 个核心线程，纯并行生成阶段最多可以拆成 6 批处理：

```text
48 / 8 = 6
```

如果每份合同耗时相同，并且下游服务吞吐无限，那么可并行阶段理论上接近 8 倍加速。

但真实链路不是只有“生成合同”：

```text
生成合同
下载 PDF
单份合同盖章
合并 PDF
上传文件
最终盖章
写打印记录
```

这里有些步骤仍然是串行的，有些步骤受下游服务吞吐限制，所以整体不会线性提升 8 倍。

更合理的表达是：

```text
对完全可并行的合同生成和下载阶段，8 个线程最多接近 8 倍；
但整体接口还包含合并、上传、盖章、记录打印日志等串行步骤，
所以上线后的整体耗时以实测为准。
```

生产实测结果：

```text
优化前：48 份合同约 28s
优化后：48 份合同约 6.71s
耗时降低约 76%
```

## 更多思考

### 1. 当前代码还有什么不足？

这次优化方向是对的，也确实解决了生产问题，但代码层面还有几个值得继续改进的地方。

### 不足一：异常处理要和业务语义对齐

当前代码中，单个任务异常后：

```java
.exceptionally(e -> {
    log.error("处理合同异常", e);
    return null;
})
```

后续又过滤掉 `null`：

```java
List<byte[]> contents = futures.stream()
        .map(CompletableFuture::join)
        .filter(Objects::nonNull)
        .collect(Collectors.toList());
```

这段代码最大的问题不是“允许部分失败”，而是失败结果没有结构化表达。它只是把失败任务变成 `null`，再把 `null` 过滤掉。

如果 68 份合同里有 10 份失败，最终接口只返回了 58 份合并后的 PDF，但没有告诉用户哪 10 份失败、为什么失败，这就会变成静默丢失。

更合理的做法是先明确业务语义，再决定异常策略。

#### 场景一：全成功才算成功

如果业务要求“批量打印结果必须完整”，少一份合同都不能给用户返回成功文件，那么可以在收集结果后做数量校验：

```java
if (contents.size() != purchaseSettleContractPreViewVOS.size()) {
    throw new CommonException("部分合同生成失败，请稍后重试");
}
```

这种策略适合强完整性场景，例如打印结果要作为归档文件、审批附件、财务凭证，不能允许用户拿到缺页文件。

#### 场景二：允许部分成功

如果业务语义是“合同之间互不影响，成功的合同不要浪费，失败的合同提示出去即可”，就不应该让一个合同失败拖垮全部任务。

这种场景下也不应该返回 `null`，而是让每个任务返回结构化结果：

```java
@Data
@AllArgsConstructor
public class ContractPrintResult {
    private Long contractId;
    private String contractCode;
    private boolean success;
    private byte[] content;
    private String errorMessage;

    public static ContractPrintResult success(Long contractId, String contractCode, byte[] content) {
        return new ContractPrintResult(contractId, contractCode, true, content, null);
    }

    public static ContractPrintResult fail(Long contractId, String contractCode, String errorMessage) {
        return new ContractPrintResult(contractId, contractCode, false, null, errorMessage);
    }
}
```

每个 `CompletableFuture` 内部自己捕获异常，并返回失败结果：

```java
List<CompletableFuture<ContractPrintResult>> futures = contracts.stream()
        .map(contract -> CompletableFuture.supplyAsync(() -> {
            try {
                String fileUrl = generateContract(contract, templateId, mainId);
                if (CharSequenceUtil.isBlank(fileUrl)) {
                    return ContractPrintResult.fail(
                            contract.getId(),
                            contract.getContractCode(),
                            "合同生成失败"
                    );
                }

                byte[] content = DownloadUtil.getBytes(PRE_URL + fileUrl);
                return ContractPrintResult.success(
                        contract.getId(),
                        contract.getContractCode(),
                        content
                );
            } catch (Exception e) {
                log.error("合同打印失败，contractId={}", contract.getId(), e);
                return ContractPrintResult.fail(
                        contract.getId(),
                        contract.getContractCode(),
                        e.getMessage()
                );
            }
        }, executor))
        .collect(Collectors.toList());
```

统一 `join()` 后再拆分成功和失败结果：

```java
List<ContractPrintResult> results = futures.stream()
        .map(CompletableFuture::join)
        .collect(Collectors.toList());

List<byte[]> successContents = results.stream()
        .filter(ContractPrintResult::isSuccess)
        .map(ContractPrintResult::getContent)
        .collect(Collectors.toList());

List<ContractPrintResult> failedResults = results.stream()
        .filter(result -> !result.isSuccess())
        .collect(Collectors.toList());

if (successContents.isEmpty()) {
    throw new CommonException("合同批量打印失败，未生成可合并的合同文件");
}

String mergedFileUrl = uploadMergedContracts(successContents);
```

最终返回给前端的就不只是一个 URL，而应该包含成功数量和失败明细：

```text
批量打印 68 份合同
成功：58 份
失败：10 份
文件地址：mergedFileUrl
失败明细：合同号 + 失败原因
```

这种方式的好处是：

- 成功的合同继续合并打印，不浪费本次操作；
- 失败合同不会静默消失；
- 前端可以明确提示“部分成功”；
- 后续可以基于失败明细做单独重试。

#### 场景三：后台任务化处理

如果批量数量继续变大，或者失败后需要重试、补偿、人工下载历史文件，那么接口不应该一直同步等待。

更稳的方式是返回任务 ID：

```text
POST /contract-print/tasks
返回：taskId
```

后台任务异步生成文件，并记录状态：

```text
PROCESSING：生成中
SUCCESS：全部成功
PARTIAL_SUCCESS：部分成功
FAILED：全部失败
```

这样即使页面关闭、网关超时，用户也可以通过任务记录拿到已生成文件和失败明细。

#### get 和 join 遇到异常时返回什么？

如果 `CompletableFuture` 里的异常没有被处理：

```java
CompletableFuture<byte[]> future = CompletableFuture.supplyAsync(() -> {
    throw new RuntimeException("合同生成失败");
});
```

调用 `join()` 时不会返回正常结果，而是抛出 `CompletionException`：

```java
future.join();
```

```text
java.util.concurrent.CompletionException: java.lang.RuntimeException: 合同生成失败
```

调用 `get()` 时也不会返回正常结果，而是抛出 `ExecutionException`：

```java
future.get();
```

```text
java.util.concurrent.ExecutionException: java.lang.RuntimeException: 合同生成失败
```

也就是说，异常发生时 `get()` 和 `join()` 都不会返回 `byte[]`。区别在于异常包装和方法签名：

```text
join()：抛 CompletionException，是运行时异常，不强制 try-catch
get()：抛 ExecutionException / InterruptedException，是受检异常，必须显式处理
```

如果用了 `exceptionally` 并返回兜底值：

```java
CompletableFuture<byte[]> future = CompletableFuture
        .supplyAsync(() -> {
            throw new RuntimeException("合同生成失败");
        })
        .exceptionally(e -> null);
```

这时异常已经被消费掉了，再调用：

```java
future.join();
```

返回结果就是：

```text
null
```

所以真正危险的不是 `join()`，而是 `exceptionally(e -> null)` 配合 `filter(Objects::nonNull)`，它会让失败合同从结果中消失。

如果业务允许部分成功，推荐返回失败结果对象：

```java
.exceptionally(e -> ContractPrintResult.fail(contractId, contractCode, getMessage(e)))
```

这样异常被处理了，但失败信息没有丢。

#### get 和 join 还有哪些区别？

除了异常包装不同，`get()` 和 `join()` 还有几个使用层面的差异。

第一，方法来源不同。

`get()` 来自 `Future` 接口，`CompletableFuture` 因为实现了 `Future`，所以也有 `get()`：

```java
V get() throws InterruptedException, ExecutionException;
```

`join()` 是 `CompletableFuture` 自己提供的方法：

```java
T join();
```

所以普通的 `Future`、`FutureTask` 只有 `get()`，没有 `join()`。

第二，代码风格不同。

因为 `get()` 抛的是受检异常，所以在 Stream 里使用会比较别扭：

```java
List<byte[]> contents = futures.stream()
        .map(future -> {
            try {
                return future.get();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new CommonException("合同打印任务被中断");
            } catch (ExecutionException e) {
                throw new CommonException("合同打印任务执行失败");
            }
        })
        .collect(Collectors.toList());
```

而 `join()` 不强制处理受检异常，所以批量聚合结果时更简洁：

```java
List<byte[]> contents = futures.stream()
        .map(CompletableFuture::join)
        .collect(Collectors.toList());
```

第三，超时能力不同。

`get()` 有带超时时间的重载：

```java
future.get(3, TimeUnit.SECONDS);
```

超时后会抛出：

```text
TimeoutException
```

`join()` 本身没有超时参数。如果使用 `CompletableFuture` 做超时控制，一般使用：

```java
future.orTimeout(3, TimeUnit.SECONDS).join();
```

或者给一个默认值：

```java
future.completeOnTimeout(defaultContent, 3, TimeUnit.SECONDS).join();
```

第四，中断语义不同。

`get()` 等待时如果当前线程被中断，会抛出 `InterruptedException`。通常 catch 后要恢复中断标记：

```java
try {
    return future.get();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    throw new CommonException("合同打印任务被中断");
}
```

`join()` 不抛 `InterruptedException`，代码写起来更顺，但也更容易让人忽略线程中断。

第五，适用场景不同。

如果是 `CompletableFuture` 编排任务，并且已经统一提交了所有任务，最后只是收集结果，`join()` 更自然：

```java
List<ContractPrintResult> results = futures.stream()
        .map(CompletableFuture::join)
        .collect(Collectors.toList());
```

如果需要显式处理超时、中断，或者拿到的是普通 `Future`，`get()` 更合适：

```java
ContractPrintResult result = future.get(5, TimeUnit.SECONDS);
```

简单总结：

```text
get 更严谨，适合需要显式处理中断和超时的场景；
join 更简洁，适合 CompletableFuture 编排和结果聚合，
但要小心异常包装和中断语义被隐藏。
```

### 不足二：线程池不应该每次请求临时创建

当前代码每次请求都会创建一个线程池：

```java
ExecutorService executor = new ThreadPoolExecutor(...);
```

正常情况下最后会调用：

```java
executor.shutdown();
```

但如果中途抛异常，线程池可能无法关闭。并且多个用户同时批量打印时，每个请求都创建 8 到 10 个线程，应用侧线程数会被快速放大。

更好的方式是使用 Spring 管理的单例线程池：

```java
@Bean("contractPrintExecutor")
public ThreadPoolTaskExecutor contractPrintExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(8);
    executor.setMaxPoolSize(16);
    executor.setQueueCapacity(200);
    executor.setThreadNamePrefix("contract-print-");
    executor.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());
    executor.initialize();
    return executor;
}
```

然后业务代码注入使用：

```java
@Resource(name = "contractPrintExecutor")
private Executor contractPrintExecutor;
```

这样线程池生命周期由 Spring 管理，也更方便监控和调参。

### 不足三：可以减少重复远程调用

当前每份合同生成过程中可能重复查询：

- 主体信息；
- 印章信息；
- 采购合同信息；
- 合同模板相关信息。

这些数据在一次批量打印请求中很多是重复的，可以前置查询或放到本次请求内的 `HashMap` 中缓存。

例如：

```java
Map<Long, MainInfoVO> mainInfoMap = new HashMap<>();
Map<Long, ContractSealVO> sealMap = new HashMap<>();
Map<String, PurchaseContractVO> contractMap = new HashMap<>();
```

注意这里更适合“请求内缓存”，而不是全局缓存。因为这些信息可能会变更，全局缓存需要考虑一致性、失效时间和刷新策略。

### 不足四：大批量 PDF 全部放内存有风险

当前结果是：

```java
List<byte[]> contents
```

如果合同数量从 48 增加到 100、200，或者单份 PDF 很大，所有 PDF 都放在内存里再合并，可能带来内存压力。

优化方向：

- 限制单次批量打印数量；
- 改成临时文件流式合并；
- 生成后只保存文件 URL，合并时按流读取；
- 使用异步任务，避免 Web 请求长时间持有内存。

### 2. 如果仍然超时，应该怎么做？

继续调大网关超时不是最优解。更合理的设计是改成异步任务模式：

```text
用户提交批量打印请求
  ↓
后端生成任务记录，返回 taskId
  ↓
后台线程池/MQ 异步生成合同
  ↓
生成成功后保存文件 URL
  ↓
前端轮询任务状态
  ↓
用户下载生成好的文件
```

任务表可以设计为：

```text
id
task_no
biz_type
request_hash
contract_ids
status
file_url
fail_reason
created_by
created_name
create_time
start_time
finish_time
retry_count
```

状态可以包括：

```text
INIT：待处理
PROCESSING：处理中
SUCCESS：成功
FAILED：失败
PARTIAL_FAILED：部分失败
```

这样即使前端页面关闭、网关超时或用户刷新页面，只要后台任务最终成功，用户仍然可以从任务记录中拿到文件 URL。

### 3. 如果用户重复点击怎么办？

批量打印要考虑幂等。

一种简单方式是根据请求参数生成幂等 key：

```text
request_hash = hash(排序后的 contractIds + 操作人 + 业务类型)
```

如果同一批合同已经有处理中或成功的任务，就直接返回已有任务：

```text
PROCESSING：提示正在生成
SUCCESS：直接返回已有文件 URL
FAILED：允许用户重试
```

这样可以避免重复生成 PDF、重复打下游合同服务。

### 4. 面试官可能追问的问题与回答

### 问题一：为什么选择 CompletableFuture？

我的回答：

```text
这个场景里每份合同生成相互独立，天然适合并发。
Callable + Future 能做基本并发，但编排能力弱，异常处理和结果聚合都要手动写；
parallelStream 代码最短，但默认使用 ForkJoinPool.commonPool，不适合这种依赖外部合同服务和文件下载的 IO 型任务，也不方便做业务隔离、限流和失败定位。

所以我选择 CompletableFuture.supplyAsync，并显式传入自定义线程池。
这样可以隔离合同打印任务的并发度，先批量提交所有合同生成任务，再统一 join 收集结果，后续也更容易扩展异常处理、超时控制和任务状态记录。
```

### 问题二：CompletableFuture.join() 不阻塞吗？

我的回答：

```text
join 也会阻塞当前线程。它和 Future.get 都是等待结果。
主要区别在异常模型和中断处理：
Future.get 会抛 InterruptedException、ExecutionException，是受检异常，必须显式处理；
CompletableFuture.join 会抛 unchecked 的 CompletionException，不强制 try-catch。

这里不是因为 join 不阻塞才用它，而是因为先把所有 CompletableFuture 创建出来，再统一 join，才能让任务先并发执行起来。
```

补充：

```text
如果任务内部异常没有被处理，get 和 join 都不会返回正常结果。
get 会把异常包装成 ExecutionException；
join 会把异常包装成 CompletionException。

如果前面用了 exceptionally 返回兜底值，比如 null，
那么 get/join 拿到的就是这个兜底值，而不是异常。
这也是 exceptionally return null 容易吞掉失败任务的原因。
```

`get()` 和 `join()` 还有几个常见区别：

```text
1. 方法来源不同：
   get 来自 Future 接口；
   join 是 CompletableFuture 自己提供的方法。

2. 异常类型不同：
   get 抛 InterruptedException、ExecutionException、TimeoutException；
   join 抛 CompletionException、CancellationException。

3. 超时能力不同：
   get 支持 get(timeout, unit)；
   join 本身没有 timeout 参数。

4. 中断语义不同：
   get 等待时如果线程被中断，会抛 InterruptedException，并清除中断标记；
   join 不抛 InterruptedException，使用时更容易忽略线程中断。
```

### 问题三：为什么不能创建一个 Future 就马上 join？

我的回答：

```text
如果创建一个 Future 就马上 join，当前线程会立刻等待这个任务完成，后面的任务还没有提交，整体就接近串行。
正确做法是先把所有任务提交到线程池，收集成 List<CompletableFuture>，再统一 join 等待结果。
```

### 问题四：如果 68 个合同里有 10 个失败怎么办？

我的回答：

```text
这个要先看业务语义。

如果要求全成功才算成功，就应该让整个批量任务失败，并返回失败合同号和失败原因。

但如果业务允许部分成功，合同之间也互不影响，那么 68 个合同里 10 个失败时，
可以把成功的 58 个继续合并成 PDF，失败的 10 个作为失败明细返回给前端提示。

关键是不能 exceptionally 返回 null 后直接 filter 掉。
这样用户只知道拿到了一个文件，却不知道少了哪些合同。
我更倾向于让每个 CompletableFuture 返回 ContractPrintResult：
成功结果包含 PDF 字节；
失败结果包含合同号和失败原因。
最终合并成功结果，同时返回失败明细。
```

### 问题五：为什么整体没有快 8 倍？

我的回答：

```text
48 个合同、8 个线程，对完全可并行的生成和下载阶段，理论上最多接近 8 倍。
但整个接口还包含 PDF 合并、上传、最终盖章、写打印记录等串行步骤，而且下游合同服务和文件服务吞吐不是无限的，所以整体不会线性提升。
最终以生产实测为准，这次同样 48 份合同从约 28s 降到约 6.71s，耗时降低约 76%。
```

### 问题六：如果现在重新设计，你会怎么做？

我的回答：

```text
我会优先推动合同服务提供批量生成接口，避免业务系统循环调用单合同生成接口。
同时把当前同步接口改成异步任务模式：提交批量打印任务后返回 taskId，后台生成、下载、合并、上传并保存任务状态和文件 URL，前端轮询任务状态。
这样即使请求超时或页面关闭，用户也能从历史任务中下载生成好的文件。
```

## 简历表达

这段经历可以写进简历，但要突出三个点：

- 真实生产问题；
- 并发优化方案；
- 量化结果。

可以写成：

```text
采购结算合同批量打印性能优化｜Java / Spring Boot / CompletableFuture
- 针对生产环境批量打印 48 份采购结算合同耗时约 28s、超过网关 20s 限制导致前端无法获取生成结果的问题，将多合同串行生成优化为 CompletableFuture 并发生成后统一合并上传。
- 使用自定义线程池并发执行合同生成、文件下载等 IO 型任务，统一等待任务结果后进行 PDF 合并与文件上传，提升批量打印链路吞吐能力。
- 上线后生产环境同样 48 份合同打印耗时降至约 6.71s，耗时降低约 76%，接口响应稳定低于网关限制。
```

注意：“网关从 20s 调整为 10 分钟”不适合作为简历主卖点。可以在面试里说成“配合网关慢请求策略作为兜底”，重点仍然放在代码侧的并发优化和量化结果。

## 总结

1. 批量打印超时不是简单的接口慢，而是“后端可能成功、前端拿不到结果”的链路断点。
2. 多份合同生成互不依赖，适合用 `CompletableFuture.supplyAsync` 配合自定义线程池并发处理。
3. `join()` 也会阻塞，关键是先批量提交任务，再统一等待结果，避免退化成串行。
4. `parallelStream` 默认使用公共 `ForkJoinPool.commonPool()`，不适合这种需要业务隔离和下游限流的 IO 型任务。
5. 当前方案已经有明显收益，但仍需优化异常处理、线程池生命周期、重复远程调用和超时后的任务补偿。
6. 如果重新设计，异步任务表 + 状态轮询 + 文件 URL 留存，会比继续拉长网关超时更稳。
