# DDD 入门：从三层架构到业务建模

这篇文章整理我对 DDD 的理解。目标不是把所有 DDD 名词背一遍，而是回答一个更朴素的问题：

> 如果一个完全不知道 DDD 的 Java 后端开发问我，DDD 到底是什么？它和传统三层架构有什么区别？在项目里到底怎么用？

DDD 很容易被文章讲得很玄：领域、限界上下文、聚合、实体、值对象、领域服务、仓储、应用服务。看完以后好像都懂，又好像不知道怎么落代码。

我现在更愿意从一个简单结论开始：

> DDD 不是某个框架，也不是简单把三层变成四层。它的核心是让代码围绕业务规则组织，而不是围绕数据库表和通用 Service 组织。

## 场景

我最开始看 DDD 时，有几个真实疑问：

> 从传统的三层模型变成了 4 层，用户接口层、应用层、领域层、基础设施层，其中领域层很关键。核心思想是根据业务去制定领域。看下来那么多文章，感觉最大的改变是领域模型？其实是实体类，实体类的操作例如计算等操作不再是使用通用的 get/set 方法，而是声明了业务规则的一个方法，匹配业务。
>
> 例如订单有订单总重量，里面提供的方法就是有一个获取订单总重量的方法，核心逻辑就是计算明细的总重量。这个实体完全对接业务，其他的我没看出来啥区别。

后来又有一个疑问：

> 但是这样的实体不就越来越大了吗？订单需要统计总重量，传统三层结构是查询订单下的明细，然后汇总。现在采用 DDD，在订单实体类上添加获取总重量的方法，同时订单明细也作为订单的一个属性。
>
> 但订单对象并不是每时每刻都要维护完整数据，很多时候不需要查询明细。一旦用了这个订单实体，我是不是就必须保证它是完整的，包含订单明细、订单地址等信息？这样反而更繁重。或者每次调用查询总重量的时候调用 Mapper 查数据库？或者加缓存？具体应该怎么操作？

这些疑问很正常，而且比直接背概念更接近 DDD 的关键。

## 先用一句话解释 DDD

如果给完全不知道 DDD 的人解释，我会这样说：

> DDD 是一种处理复杂业务系统的设计方法。它要求我们先理解业务，再把业务里的核心概念、规则、状态流转和一致性边界表达成代码模型，而不是只按数据库表写增删改查。

传统三层架构里，我们经常这样写：

```text
Controller -> Service -> Mapper
```

业务逻辑大多堆在 Service：

```java
public void settle(Long orderId) {
    OrderDO order = orderMapper.selectById(orderId);
    List<RealDeliveryDO> deliveries = realDeliveryMapper.listByOrderId(orderId);

    if (!order.isPaid()) {
        throw new BizException("未收款，不可结算");
    }
    if (deliveries.isEmpty()) {
        throw new BizException("没有实提，不可结算");
    }

    BigDecimal totalWeight = deliveries.stream()
            .map(RealDeliveryDO::getWeight)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    SettlementDO settlement = new SettlementDO();
    settlement.setOrderId(orderId);
    settlement.setTotalWeight(totalWeight);
    settlement.setStatus(10);
    settlementMapper.insert(settlement);
}
```

这种写法不是错。它简单、直接，在业务不复杂时很好用。

但业务复杂以后，Service 会越来越像一个巨大脚本：

- 自动结算要校验一次。
- 手动结算要校验一次。
- 审核通过要校验一次。
- 定时任务补偿又校验一次。
- 修改结算、作废结算、二次结算又各写一遍。

最后问题变成：

> 规则到底属于谁？订单状态能不能结算的判断，应该散落在每个 Service 里，还是应该有一个明确归属？

DDD 要解决的就是这个问题。

## DDD 最大的改变是什么

我现在的理解是：

> DDD 最大的改变不是多了一层，也不是实体类多写几个方法，而是业务规则的归属变了。

传统三层里，实体经常是贫血模型：

```java
public class OrderDO {
    private Long id;
    private String orderCode;
    private Integer status;
    private BigDecimal totalAmount;

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }
}
```

它只是数据库表的一行数据。谁都可以这样改：

```java
order.setStatus(OrderStatus.SETTLED);
```

但这句代码本身看不出业务含义，也保护不了规则：

- 未收款能不能结算？
- 实提没完成能不能结算？
- 存在退货能不能结算？
- 已结算能不能再次结算？

DDD 更希望对象暴露的是业务动作：

```java
public class Settlement {
    private SettlementStatus status;
    private List<SettlementItem> items;
    private Money settleAmount;

    public void submit() {
        if (items == null || items.isEmpty()) {
            throw new BizException("结算明细不能为空");
        }
        if (!status.canSubmit()) {
            throw new BizException("当前状态不可提交结算");
        }
        this.settleAmount = calculateAmount();
        this.status = SettlementStatus.SUBMITTED;
    }

    private Money calculateAmount() {
        return items.stream()
                .map(SettlementItem::amount)
                .reduce(Money.zero(), Money::add);
    }
}
```

这里的重点不是“把方法从 Service 搬到实体”，而是：

> 结算单自己知道如何提交，自己保护自己的状态，自己保证金额和明细之间的规则。

Service 不再到处 `setStatus`、`setAmount`，而是调用业务动作：

```java
settlement.submit();
```

这就是从“数据驱动”向“业务模型驱动”的变化。

## DDD 的四层分别干什么

常见 DDD 分层是：

```text
用户接口层 -> 应用层 -> 领域层 -> 基础设施层
```

可以先这样理解：

| 层级 | 负责什么 | 不应该负责什么 |
| --- | --- | --- |
| 用户接口层 | 接收请求、参数校验、返回结果 | 不写核心业务规则 |
| 应用层 | 编排一次业务用例 | 不沉淀复杂业务规则 |
| 领域层 | 表达业务概念、规则、状态流转 | 不关心 SQL、MQ、Redis、HTTP |
| 基础设施层 | 数据库、缓存、消息、外部接口实现 | 不决定业务规则 |

比如自动结算：

```java
public class SettlementApplicationService {

    public void autoSettle(Long orderId) {
        Order order = orderRepository.findForSettlement(orderId);
        List<RealDeliveryItem> realItems = realDeliveryGateway.listItems(orderId);

        Settlement settlement = settlementFactory.create(order, realItems);
        settlement.submit();

        settlementRepository.save(settlement);
        eventPublisher.publish(new SettlementCreatedEvent(settlement.id()));
    }
}
```

应用层负责把流程串起来：

```text
查订单
查实提
创建结算对象
调用结算业务动作
保存结算结果
发布事件
```

领域层负责判断和计算：

```text
能不能结算
结算金额怎么算
明细是否为空
状态怎么流转
重复结算怎么处理
```

基础设施层负责技术细节：

```text
Repository 怎么查数据库
Gateway 怎么调实提服务
MQ topic 是什么
事务怎么提交
```

## 实体、值对象、聚合到底是什么

DDD 里最常见的三个概念是实体、值对象、聚合。

### 实体

实体有唯一身份，有生命周期。

例如：

```text
订单
结算单
合同
实提单
付款申请
```

订单状态可以变化，但它还是同一张订单。

实体不应该只是 get/set 容器，它应该能表达和自己有关的业务动作：

```java
order.cancel();
order.confirmReceipt();
settlement.submit();
settlement.auditPass();
```

### 值对象

值对象没有身份，只关心值。

例如：

```text
Money 金额
Weight 重量
Address 地址
DateRange 日期范围
```

两个 `Money(100, CNY)` 没必要区分谁是谁，值一样就可以认为一样。

值对象适合封装容易出错的细节：

```java
public class Money {
    private final BigDecimal amount;

    public Money add(Money other) {
        return new Money(this.amount.add(other.amount));
    }
}
```

这样金额计算、精度处理、单位转换就不会散在各个 Service。

### 聚合

聚合是一组需要一起保持业务一致性的对象，由聚合根统一管理。

比如结算聚合可以是：

```text
Settlement 结算单，聚合根
SettlementItem 结算明细
SettlementAmount 结算金额
SettlementStatus 结算状态
```

外部不要直接改明细状态，而是通过结算单：

```java
settlement.addItem(item);
settlement.submit();
settlement.cancel();
```

聚合的关键问题是：

> 哪些数据必须在一次业务动作里保持强一致？

不是所有和订单有关的数据都属于订单聚合。

## 订单实体会不会越来越大

这是理解 DDD 时最容易踩的坑。

DDD 不是说：

> 订单相关的所有数据都放进 Order，Order 永远是完整大对象。

正确理解应该是：

> 聚合边界要尽量小。只把当前业务规则需要强一致维护的数据放到一个聚合里。

比如订单可能关联：

```text
订单基础信息
订单明细
收货地址
实提信息
付款信息
发票信息
物流轨迹
结算信息
风控信息
```

这些不应该都塞进一个 `Order`。

如果你发现 `Order` 里出现了这些方法：

```text
calculateSettlementAmount()
calculateFreight()
calculateInvoiceAmount()
calculateRiskWarning()
calculateWarehouseQuota()
calculateSellerPayAmount()
calculateBuyerReceiptAmount()
```

那大概率是订单聚合太大了。

应该按业务边界拆开：

```text
Order 负责订单状态和交易主流程
Settlement 负责结算规则
Invoice 负责开票规则
CapitalAccount 负责资金规则
Delivery 负责履约规则
```

订单不应该吞掉整个交易系统。

## 查询总重量应该放在哪里

这个问题要先问：总重量用于什么？

### 只是展示

如果只是页面展示、报表统计、列表字段：

```text
订单详情展示总重量
订单列表展示总重量
报表统计总重量
```

那完全可以用 SQL 聚合或查询模型：

```sql
select order_id, sum(weight) as total_weight
from order_item
where order_id = ?
group by order_id;
```

这类读场景不一定要构造完整领域对象。

DDD 不排斥 DTO、VO、查询模型。复杂系统里反而经常会区分：

```text
写操作：使用领域模型保护业务规则
读操作：使用查询模型满足页面展示
```

### 参与业务规则

如果总重量影响业务判断：

```text
总重量为 0 不能结算
总重量超过合同重量不能确认
总重量参与结算金额计算
总重量影响运费计算
```

这时它就应该进入领域模型或领域服务。

比如结算场景：

```java
Settlement settlement = Settlement.create(order, realDeliveryItems);
settlement.submit();
```

`Settlement` 可以基于实提明细计算总重量和金额，因为这是结算规则的一部分。

## 实体方法里能不能查数据库

一般不建议。

不推荐这样写：

```java
public class Order {
    private Long id;

    public BigDecimal totalWeight() {
        List<OrderItemDO> items = orderItemMapper.listByOrderId(this.id);
        return items.stream()
                .map(OrderItemDO::getWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
```

这样会让领域实体依赖 Mapper，领域层就被基础设施污染了。

更常见的方式是：

> 应用层或 Repository 先按当前用例加载必要数据，再组装领域对象。领域对象只基于已经加载的数据执行业务规则。

例如：

```java
Order order = orderRepository.findForSettlement(orderId);
Settlement settlement = settlementFactory.create(order);
settlement.submit();
```

`findForSettlement` 明确表达：

> 这是为结算场景加载订单，会带上结算需要的明细或必要字段。

而不是所有场景都加载完整订单。

Repository 可以有不同加载方法：

```java
Order findBasic(Long orderId);

Order findWithItems(Long orderId);

Order findForSettlement(Long orderId);
```

这不是坏事，它是在表达不同业务场景需要不同数据。

## DDD 和 CQRS 的关系

不需要一开始就上完整 CQRS，但可以借用它的思想：

```text
命令侧：处理业务动作，使用领域模型
查询侧：处理展示查询，使用 DTO、VO、SQL 聚合
```

例如：

| 场景 | 更适合的模型 |
| --- | --- |
| 订单列表 | OrderSummaryVO |
| 订单详情 | OrderDetailVO |
| 报表统计 | SQL / 查询模型 |
| 提交结算 | Settlement 聚合 |
| 作废结算 | Settlement 聚合 |
| 确认收货 | Delivery 或 Order 聚合 |

很多人误解 DDD，是因为觉得：

> 我用了 DDD，就所有查询都必须走领域对象。

其实不是。

DDD 更关注复杂业务动作，而不是替代所有查询写法。

## 如何在项目中使用 DDD

如果一个项目已经是传统三层架构，不建议一上来就全量改成 DDD。更现实的方式是从复杂业务模块开始。

### 第一步：找复杂业务，而不是找技术点

适合尝试 DDD 的地方通常有这些特征：

- 状态流转多。
- 业务规则多。
- 多个入口都要复用同一套规则。
- 金额、库存、履约、结算等一致性要求高。
- Service 里已经出现大量 if-else。
- 修改一个规则时，经常不知道影响哪些入口。

比如：

```text
订单支付
库存扣减
提货履约
采购结算
销售结算
付款申请
开票申请
```

这些比普通字典维护、列表查询更适合 DDD。

### 第二步：用业务语言重新命名

不要一开始就问表怎么设计，而是先问业务：

```text
结算单是什么？
结算明细是什么？
什么时候可以结算？
什么时候不能结算？
结算金额怎么算？
结算后要影响哪些状态？
哪些动作可以重复触发？
失败后如何补偿？
```

这些答案会慢慢形成领域模型。

### 第三步：划分聚合边界

聚合边界不要贪大。

判断标准是：

```text
这些数据是否必须在一次业务动作里强一致？
外部是否必须通过一个入口修改它们？
如果拆开，是否会破坏业务规则？
```

比如结算聚合可以维护：

```text
结算主信息
结算明细
结算金额
结算状态
调整金额
```

但合同、资金、实提状态不一定都塞进结算聚合。它们可以由应用服务编排，或者通过事件、外部服务、补偿机制保持最终一致。

### 第四步：让领域对象暴露业务方法

少暴露这种方法：

```java
setStatus()
setAmount()
setTotalWeight()
```

多暴露这种方法：

```java
submit()
cancel()
auditPass()
auditReject()
calculateAmount()
canSettle()
```

调用方应该表达业务意图，而不是随便改字段。

### 第五步：应用层只做编排

应用层可以长一点，但不要把核心规则都塞进去。

应用层适合写：

```text
查订单
查实提
查资金
创建领域对象
调用领域方法
保存结果
发消息
记录日志
```

领域层适合写：

```text
状态是否允许
金额如何计算
明细是否合法
重复操作如何处理
业务动作后状态怎么变
```

### 第六步：基础设施层做适配

基础设施层负责技术实现：

```text
MyBatis Mapper
Redis
MQ
Dubbo / OpenFeign
第三方接口
Repository 实现
```

领域层不要直接依赖这些东西。

## 用结算系统举例

传统三层写法可能是：

```text
SalesContractSettlementService
- 查订单
- 查合同
- 查实提
- 校验付款状态
- 校验退货状态
- 计算结算金额
- 插入结算主表
- 插入结算明细
- 更新资金
- 更新订单
- 更新实提
- 发 MQ
```

这种写法能跑，但随着业务模式增多，Service 会越来越大。

DDD 视角可以这样拆：

```text
应用层：
SalesSettlementApplicationService
负责自动结算这个用例的流程编排。

领域层：
Settlement 结算聚合
SettlementItem 结算明细
SettlementAmount 金额值对象
SettlementPolicy 结算规则
SettlementCalculator 结算金额计算

基础设施层：
SalesOrderGateway
RealDeliveryGateway
SettlementRepository
MqPublisher
```

自动结算可以表达成：

```java
public void autoSettle(Long orderId) {
    SalesOrder order = salesOrderGateway.get(orderId);
    List<RealDeliveryItem> realItems = realDeliveryGateway.listItems(orderId);

    Settlement settlement = settlementFactory.create(order, realItems);
    settlement.submit();

    settlementRepository.save(settlement);
    settlementEventPublisher.publish(settlement.createdEvent());
}
```

结算聚合内部表达业务规则：

```java
public class Settlement {
    private SalesOrder order;
    private List<SettlementItem> items;
    private Money amount;
    private SettlementStatus status;

    public void submit() {
        checkCanSubmit();
        this.amount = calculateAmount();
        this.status = SettlementStatus.SUBMITTED;
    }

    private void checkCanSubmit() {
        if (!order.hasReceivedPayment()) {
            throw new BizException("未收买家款，不可结算");
        }
        if (items.isEmpty()) {
            throw new BizException("实提明细为空，不可结算");
        }
        if (!status.canSubmit()) {
            throw new BizException("当前结算状态不可提交");
        }
    }
}
```

真实项目中不一定要改成这个样子，但这个例子能说明 DDD 的方向：

> 让结算规则有明确归属，而不是散落在每个入口的 Service 里。

## DDD 不适合什么场景

DDD 不是银弹。

这些场景不一定适合上 DDD：

- 简单 CRUD。
- 字典配置。
- 后台管理页面。
- 规则很少、变化很少的模块。
- 团队对业务还没理解清楚。
- 只是为了追求架构形式。

如果业务只是：

```text
新增
删除
修改
分页查询
```

传统三层就够了。

DDD 更适合复杂业务，不是用来让简单问题复杂化。

## 面试怎么回答 DDD

可以这样说：

> 我理解 DDD 不是简单把三层变四层，也不是把所有逻辑都塞进实体类。它真正解决的是复杂业务规则归属的问题。
>
> 传统三层里，Service 很容易变成大而全的事务脚本，订单状态、结算金额、明细校验这些规则散落在不同入口。DDD 会先按业务划分领域和限界上下文，再通过实体、值对象、聚合、领域服务表达业务规则。
>
> 实体不只是 get/set 的数据容器，而是暴露提交、取消、审核、结算这类业务动作。聚合根负责保护聚合内部的一致性。应用层负责编排流程，比如查询数据、开启事务、调用领域对象、保存、发消息。基础设施层负责数据库、MQ、外部接口等技术细节。
>
> 但 DDD 不是要求一个订单对象永远加载所有明细和关联数据。读场景可以使用 DTO、VO、SQL 聚合；写场景才根据业务用例加载必要数据组成领域模型。聚合边界要尽量小，只把必须强一致的数据放在一起。

## 总结

1. DDD 的核心不是多分一层，而是让业务规则有明确归属。
2. 实体不是数据库表对象，应该表达业务动作，而不是只暴露 get/set。
3. 聚合不是越大越好，只放需要强一致维护的数据。
4. 查询展示可以继续用 DTO、VO、SQL 聚合，不需要所有场景都构造完整领域对象。
5. 实体方法一般不直接查数据库，数据由 Repository 或应用层按用例加载。
6. DDD 更适合复杂业务模块，例如订单、履约、库存、结算、资金，不适合简单 CRUD 强行套架构。

我现在对 DDD 的理解可以压缩成一句话：

> DDD 是把复杂业务里的规则、状态和一致性边界，用贴近业务语言的代码模型表达出来；它不是为了让代码看起来高级，而是为了让复杂业务以后还能被理解、修改和验证。
