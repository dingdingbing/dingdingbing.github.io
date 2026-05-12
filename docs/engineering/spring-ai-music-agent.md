# Spring AI 音乐智能体学习复盘

## 场景：从会调用大模型，到理解调用链

我用 Spring AI 做了一个简化版音乐智能体。最开始的目标很直接：用 Java 调用大模型，让接口能够根据用户输入返回音乐推荐。

随着功能一点点补上，我接触到了 `ChatClient`、流式回复、结构化输出、Tool Calling、Chat Memory、Advisor、VectorStore 和 RAG。真正有价值的地方不只是“接口能返回答案”，而是开始理解 Spring AI 把一次模型调用拆成了哪些可扩展环节。

这篇文章记录的是这次学习中的几个误解，以及后面逐步修正后的理解。

## 第一层理解：ChatClient 是模型调用入口

最开始实现的是普通聊天接口：

```java
chatClient.prompt()
        .system("你是一个Java技术专家")
        .user(message)
        .call()
        .content();
```

这一步解决的是最基础的问题：Java 服务如何把用户输入发送给模型，并拿到模型返回。

后来又尝试了流式返回：

```java
chatClient.prompt()
        .user(message)
        .stream()
        .content();
```

这时我对 Spring AI 的第一层理解是：

> Spring AI 提供了一套 Java 风格的大模型调用 API，让 Java 项目可以更自然地接入模型能力。

但这还不能算智能体。它只是一次请求、一次响应。

## 错误理解：用了 Chat Memory 就等于 RAG

我一开始容易把 Chat Memory 和 RAG 混在一起，因为它们都能“增强模型上下文”。

错误理解是：

> Chat Memory 使用了 Advisor，所以它也是 RAG。

后来重新看实现后，我的理解变成：

> Chat Memory 更准确叫会话记忆增强，不是典型 RAG。

以 `MessageChatMemoryAdvisor` 为例，它的大致流程是：

```text
请求前：
1. 根据 conversationId 取出历史消息
2. 把历史消息追加到本次 prompt
3. 把当前用户消息写入 ChatMemory

响应后：
4. 把模型回答写入 ChatMemory
```

它没有做语义检索，也没有从知识库中查资料。它只是把同一个会话中的历史消息重新放回模型上下文。

所以它解决的是：

```text
模型不知道上一轮聊了什么
```

而不是：

```text
模型不知道外部知识库里的资料
```

这两个问题很像，但不是同一个问题。

## 正确理解：RAG 是一个流程，不是某一个类

RAG 的完整含义是 Retrieval-Augmented Generation，中文通常叫检索增强生成。

我更愿意把它拆成三步理解：

```text
Retrieval：先检索资料
Augmentation：把资料补进 prompt
Generation：让模型基于补充资料回答
```

所以 RAG 不是 `formatted`，也不是 `PromptTemplate`，更不是某一个固定的 Advisor。

在我的项目里，最原始的 RAG 写法是这样：

```java
List<Document> documents = vectorStore.similaritySearch(message);

String context = documents.stream()
        .map(Document::getText)
        .reduce("", (a, b) -> a + "\n" + b);

return chatClient.prompt()
        .system("""
                你只能根据【资料】回答问题。

                【资料】
                %s
                """.formatted(context))
        .user(message)
        .call()
        .content();
```

这里真正属于 RAG 的核心动作是：

```java
vectorStore.similaritySearch(message)
```

以及后面把检索结果塞进 prompt。

`formatted` 只是字符串拼接工具。它本身不提供检索能力，也不理解语义。

## QuestionAnswerAdvisor 背后做了什么

Spring AI 提供了内置的 `QuestionAnswerAdvisor`。我一开始觉得它很神秘，好像只要加上这个 Advisor，模型就会自动懂知识库。

后来看它的实现思路，发现它本质上和自己手写的 RAG 流程很接近：

```text
请求前：
1. 从 user message 中取出用户问题
2. 构造 SearchRequest
3. 调用 VectorStore.similaritySearch(searchRequest)
4. 把检索到的 Document 文本合并成上下文
5. 用 PromptTemplate 渲染出新的用户消息
6. 调用 prompt.augmentUserMessage(...) 增强本次请求

响应后：
7. 把检索到的 documents 放到响应 metadata 中
```

也就是说，它并不是让模型直接连接数据库。它做的是：

```text
先由 Java 查询向量库
再由 Advisor 改造 prompt
最后模型根据改造后的 prompt 生成回答
```

这也是 Spring AI 很重要的设计思路：模型调用前后的工程逻辑，尽量放到 Advisor 链路中。

## Advisor 怎么理解

`Advisor` 直译成“顾问”其实不太好理解。我更愿意把它理解成：

```text
ChatClient 调用链上的增强器 / 拦截器 / 中间件
```

它可以在请求模型之前做事：

- 添加 system prompt
- 添加用户画像
- 添加历史聊天记录
- 查询向量库并追加资料
- 添加业务上下文
- 拦截敏感词
- 打印最终 prompt

也可以在模型返回之后做事：

- 检查回答格式
- 记录日志
- 校验模型是否违反规则
- 对结果做二次包装
- 保存模型回答到记忆

所以 Advisor 不是专门为 RAG 设计的。RAG 只是 Advisor 很适合承载的一类场景。

## 错误示范：只会堆 prompt

在学习过程中，我一开始很容易把所有能力都理解成“写 prompt”。

比如结构化输出：

```text
你必须返回 JSON。
```

比如工具调用：

```text
如果用户问价格，就调用 getProductPrice。
```

比如 RAG：

```text
你只能根据下面资料回答。
```

这些 prompt 确实有用，但如果只停留在这个层面，就会忽略 Spring AI 真正提供的工程能力。

更合理的理解是：

| 能力 | 不只是 prompt | 更重要的是 |
| --- | --- | --- |
| 结构化输出 | 要求模型返回 JSON | Java 侧解析、校验和兜底 |
| Tool Calling | 告诉模型可以用工具 | Java 方法注册、参数映射和调用结果回填 |
| Chat Memory | 提醒模型记住上下文 | 请求前加载历史、响应后保存回答 |
| RAG | 告诉模型看资料 | 查询向量库、拼接上下文、控制资料边界 |
| Advisor | 添加规则 | 统一管理请求前和响应后的增强逻辑 |

Prompt 是重要的一环，但不是全部。

## 正确引导：把能力放进调用链

后面我把音乐智能体拆成多个 Advisor，每个 Advisor 只负责一类增强：

```text
MusicRulesAdvisor：添加音乐智能体基础规则
MusicUserProfileAdvisor：添加用户偏好
MusicSensitiveWordAdvisor：请求前拦截敏感词
MusicRagAdvisor：查询向量库并追加资料
MusicJsonFormatAdvisor：要求并校验 JSON 格式
MusicResponseWrapperAdvisor：响应后二次包装
MusicDebugAdvisor：打印最终 prompt 和响应内容
```

这样做之后，调用链变得更清楚：

```text
用户请求
-> 添加智能体规则
-> 添加用户画像
-> 敏感词判断
-> 检索向量库
-> 添加返回格式要求
-> 打印最终 prompt
-> 调用模型
-> 校验响应格式
-> 二次包装响应
-> 返回给前端
```

这个过程比单纯写一个很长的 system prompt 更容易排查，也更容易解释。

## 自定义 RAG Advisor 的意义

我自己写了一个简化版 `MusicRagAdvisor`：

```java
String userText = request.prompt().getUserMessage().getText();
List<Document> documents = vectorStore.similaritySearch(userText);

String context = documents.stream()
        .map(Document::getText)
        .reduce("", (a, b) -> a + "\n" + b);

return request.mutate()
        .prompt(request.prompt().augmentSystemMessage(systemMessage -> systemMessage.mutate()
                .text(systemMessage.getText() + """

                        以下是自定义 RAG Advisor 从向量库检索到的资料：
                        %s

                        回答时优先依据这些资料。
                        """.formatted(context))
                .build()))
        .build();
```

这段代码不复杂，但它让我真正理解了 `QuestionAnswerAdvisor` 背后做的事情。

我的版本和官方版本主要差在几个地方：

| 对比点 | 自定义 MusicRagAdvisor | QuestionAnswerAdvisor |
| --- | --- | --- |
| 查询方式 | 直接 `similaritySearch(userText)` | 使用 `SearchRequest` |
| prompt 拼接 | 字符串 `formatted` | `PromptTemplate.render(...)` |
| 增强位置 | system message | user message |
| 检索结果 | 只用于 prompt | 还会放进 response metadata |
| 过滤能力 | 暂无 | 支持 filter expression |

所以我的版本适合学习原理，官方版本更适合工程使用。

## 一个重要细节：增强 system message 还是 user message

我自定义的 RAG Advisor 是增强 system message：

```java
prompt.augmentSystemMessage(...)
```

而 `QuestionAnswerAdvisor` 更接近增强 user message：

```java
prompt.augmentUserMessage(...)
```

这两个都能工作，但语义不同。

增强 system message 更像是：

```text
给模型补充规则和背景资料
```

增强 user message 更像是：

```text
把用户问题改写成“问题 + 检索上下文”
```

如果是通用知识问答，我更倾向于使用 `QuestionAnswerAdvisor` 这种方式，因为它把“本次问题”和“本次检索资料”绑定得更紧。

如果是全局规则、用户画像、业务身份设定，则更适合放到 system message。

## 结构化输出：不要只相信模型会听话

我还做了一个响应后 JSON 校验 Advisor。

请求前，它会追加格式要求：

```text
返回结果必须是 JSON，不能使用 Markdown，不能返回解释文字。
```

响应后，它会用 Java 校验：

```java
objectMapper.readTree(text);
```

如果模型没有返回合法 JSON，就记录错误，并返回固定错误结构。

这个练习让我意识到：

> 结构化输出不能只靠 prompt，服务端也要校验。

模型可以尽量被约束，但工程代码必须有兜底。

## Tool Calling：不是模型真的会访问 Java

Tool Calling 也容易被误解。

错误理解是：

> 模型可以直接调用 Java 方法。

更准确的理解是：

> 模型根据上下文决定要调用哪个工具，Spring AI 负责把这个意图映射成 Java 方法调用，再把调用结果交回模型。

所以工具调用背后仍然是一次工程编排：

```text
用户问题
-> 模型判断需要工具
-> Spring AI 调用 Java 方法
-> 工具结果回填给模型
-> 模型组织最终回答
```

它不是让模型绕过应用直接访问系统资源，而是由框架在受控范围内完成调用。

## 我对 Spring AI 的阶段性理解

经过这个项目后，我对 Spring AI 的理解从“Java 调模型的工具”变成了：

> Spring AI 是把大模型能力接入 Spring 应用的一套工程化抽象。

它不只是发送 HTTP 请求，也不只是封装 OpenAI 或 Anthropic。它更重要的是把常见 AI 应用能力拆成 Java 后端熟悉的组件：

- `ChatClient`：模型调用入口
- `Prompt`：请求内容组织
- `Advisor`：调用前后的增强链路
- `ChatMemory`：会话上下文管理
- `VectorStore`：向量检索入口
- `Tool Calling`：模型与业务方法协作
- `Structured Output`：把模型输出转成 Java 对象或可校验结构

这些能力组合起来，才逐渐接近一个智能体项目。

## 复盘沉淀

这次学习最大的收获不是“写出了一个音乐智能体”，而是把几个容易混淆的概念拆开了。

`ChatMemory` 解决历史会话问题，`QuestionAnswerAdvisor` 解决知识库问答问题，`Advisor` 解决调用链增强问题，RAG 解决外部资料注入问题。

它们可以组合，但不能混为一谈。

如果以后继续扩展这个项目，我会优先做三件事：

1. 把内存向量库替换成真实向量数据库。
2. 给自定义 RAG Advisor 增加 `SearchRequest`、相似度阈值和过滤条件。
3. 把结构化输出从 prompt 约束升级成稳定的 DTO 校验和异常处理。

这样项目就不只是“能跑的 Demo”，而是逐步具备可解释、可排查、可扩展的智能体后端雏形。
