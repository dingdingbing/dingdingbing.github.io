# GitHub Pages Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VitePress-based technical knowledge base that can be published to GitHub Pages and used as a resume link.

**Architecture:** The site is a static VitePress documentation site stored under `docs/`, configured by `docs/.vitepress/config.mts`, built by npm scripts, and deployed by GitHub Actions to GitHub Pages. Content is written in Markdown and organized around project experience, troubleshooting, backend knowledge, middleware, database, engineering practice, and an About page.

**Tech Stack:** VitePress, Markdown, Node.js, npm, GitHub Actions, GitHub Pages.

---

## Reference Docs

- VitePress deployment guide: `https://vitepress.dev/guide/deploy`
- GitHub Pages documentation: `https://docs.github.com/en/pages`

## File Structure

Create or modify these files:

- Create: `package.json` - npm scripts and package metadata.
- Create: `.gitignore` - ignore local dependency, build, and editor output.
- Create: `docs/.vitepress/config.mts` - site metadata, theme config, nav, sidebar, search, and clean URL behavior.
- Create: `docs/index.md` - resume-ready home page.
- Create: `docs/about.md` - public profile and technical positioning.
- Create: `docs/projects/index.md` - project experience overview.
- Create: `docs/projects/delivery-chain.md` - first project experience article.
- Create: `docs/projects/business-routing.md` - second project experience article.
- Create: `docs/troubleshooting/index.md` - troubleshooting overview.
- Create: `docs/troubleshooting/data-consistency.md` - first troubleshooting article.
- Create: `docs/backend/index.md` - Java backend knowledge map.
- Create: `docs/backend/spring-transaction.md` - Spring transaction article.
- Create: `docs/backend/mybatis.md` - MyBatis practice page.
- Create: `docs/middleware/index.md` - middleware knowledge map.
- Create: `docs/middleware/redis.md` - Redis practice page.
- Create: `docs/middleware/mq.md` - MQ practice page.
- Create: `docs/database/index.md` - database knowledge map.
- Create: `docs/database/reconciliation.md` - reconciliation article.
- Create: `docs/engineering/index.md` - engineering practice overview.
- Create: `docs/engineering/code-review-and-verification.md` - engineering practice article about review and verification closure.
- Create: `.github/workflows/deploy.yml` - GitHub Pages deployment workflow.

---

### Task 1: Project Baseline

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Create npm package metadata**

Create `package.json`:

```json
{
  "name": "personal-technical-knowledge-base",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 2: Create git ignore rules**

Create `.gitignore`:

```gitignore
node_modules/
docs/.vitepress/cache/
docs/.vitepress/dist/
.DS_Store
.omx/
.env
.env.*
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
npm install -D vitepress
```

Expected:

```text
added packages
```

`package-lock.json` should be created. `package.json` should contain a `devDependencies.vitepress` entry, and the lockfile root package entry should include `engines.node >=18`.

- [ ] **Step 4: Verify npm scripts are visible**

Run:

```bash
npm run
```

Expected output includes:

```text
docs:dev
docs:build
docs:preview
```

- [ ] **Step 5: Commit baseline**

Run:

```bash
git add package.json package-lock.json .gitignore
git commit -m "Prepare the static knowledge base toolchain" -m "Constraint: The site should be hosted on GitHub Pages without a self-managed server
Rejected: Server-rendered setup | adds operations work that the first release does not need
Confidence: high
Scope-risk: narrow
Directive: Keep the initial toolchain limited to VitePress and npm unless a later requirement needs more
Tested: npm scripts are listed
Not-tested: Site build waits for content and config tasks"
```

Expected:

```text
[main
Prepare the static knowledge base toolchain
```

---

### Task 2: VitePress Configuration

**Files:**
- Create: `docs/.vitepress/config.mts`

- [ ] **Step 1: Create VitePress config**

Create `docs/.vitepress/config.mts`:

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Ding Junhui 技术知识库',
  description: 'Java 后端项目经验、问题排查与知识沉淀',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    siteTitle: 'Ding Junhui',
    search: {
      provider: 'local'
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '项目经验', link: '/projects/' },
      { text: '问题排查', link: '/troubleshooting/' },
      { text: 'Java 后端', link: '/backend/' },
      { text: '中间件', link: '/middleware/' },
      { text: '数据库', link: '/database/' },
      { text: '工程实践', link: '/engineering/' },
      { text: '关于我', link: '/about' }
    ],
    sidebar: {
      '/projects/': [
        {
          text: '项目经验',
          items: [
            { text: '项目经验总览', link: '/projects/' },
            { text: '复杂提货链路设计与排查', link: '/projects/delivery-chain' },
            { text: '业务路由系统实践', link: '/projects/business-routing' }
          ]
        }
      ],
      '/troubleshooting/': [
        {
          text: '问题排查',
          items: [
            { text: '问题排查总览', link: '/troubleshooting/' },
            { text: '数据一致性问题排查', link: '/troubleshooting/data-consistency' }
          ]
        }
      ],
      '/backend/': [
        {
          text: 'Java 后端',
          items: [
            { text: 'Java 后端知识地图', link: '/backend/' },
            { text: 'Spring 事务失效场景', link: '/backend/spring-transaction' },
            { text: 'MyBatis 实践', link: '/backend/mybatis' }
          ]
        }
      ],
      '/middleware/': [
        {
          text: '中间件',
          items: [
            { text: '中间件实践总览', link: '/middleware/' },
            { text: 'Redis 实践', link: '/middleware/redis' },
            { text: 'MQ 实践', link: '/middleware/mq' }
          ]
        }
      ],
      '/database/': [
        {
          text: '数据库',
          items: [
            { text: '数据库知识地图', link: '/database/' },
            { text: '业务数据对账与修复', link: '/database/reconciliation' }
          ]
        }
      ],
      '/engineering/': [
        {
          text: '工程实践',
          items: [
            { text: '工程实践总览', link: '/engineering/' }
          ]
        }
      ]
    },
    footer: {
      message: '持续沉淀后端项目经验、问题排查方法和工程实践。',
      copyright: 'Copyright © 2026 Ding Junhui'
    }
  }
})
```

- [ ] **Step 2: Run build to expose missing content links**

Run:

```bash
npm run docs:build
```

Expected:

```text
vitepress v
build complete
```

If this fails with missing Markdown files, continue to Task 3 before retrying. Missing content is expected until the pages exist.

- [ ] **Step 3: Commit config**

Run:

```bash
git add docs/.vitepress/config.mts
git commit -m "Define the knowledge base navigation model" -m "Constraint: The site needs to behave like a technical knowledge base for resume review
Rejected: Blog-first navigation | hides project and troubleshooting evidence behind a timeline
Confidence: high
Scope-risk: narrow
Directive: Keep project experience and troubleshooting as primary navigation groups
Tested: VitePress config syntax prepared for build
Not-tested: Full build waits for Markdown content"
```

Expected:

```text
[main
Define the knowledge base navigation model
```

---

### Task 3: Core Content Skeleton

**Files:**
- Create: `docs/index.md`
- Create: `docs/about.md`
- Create: `docs/projects/index.md`
- Create: `docs/troubleshooting/index.md`
- Create: `docs/backend/index.md`
- Create: `docs/middleware/index.md`
- Create: `docs/database/index.md`
- Create: `docs/engineering/index.md`

- [ ] **Step 1: Create home page**

Create `docs/index.md`:

```markdown
---
layout: home

hero:
  name: Ding Junhui 技术知识库
  text: Java 后端项目经验、问题排查与知识沉淀
  tagline: 聚焦业务系统、复杂链路、数据一致性、中间件实践和工程质量。
  actions:
    - theme: brand
      text: 查看项目经验
      link: /projects/
    - theme: alt
      text: 查看问题排查
      link: /troubleshooting/

features:
  - title: 项目经验
    details: 以业务背景、职责、难点、方案、结果和复盘组织真实项目经验。
    link: /projects/
  - title: 问题排查
    details: 记录现象、排查过程、根因、修复方案、验证方式和经验沉淀。
    link: /troubleshooting/
  - title: 知识领域
    details: 持续整理 Java、Spring、数据库、Redis、MQ 和工程实践。
    link: /backend/
---

## 核心能力

- 业务建模：理解业务链路中的角色、状态、约束和异常分支。
- 链路分析：从接口、日志、SQL、消息和任务中还原问题路径。
- 数据对账：关注采购、销售、实提、结算等关键数据的一致性。
- 中间件实践：围绕 Redis、MQ、分布式锁和定时任务沉淀使用经验。
- 工程质量：用清晰代码、验证手段和复盘机制降低后续维护成本。

## 推荐阅读

- [复杂提货链路设计与排查](/projects/delivery-chain)
- [数据一致性问题排查](/troubleshooting/data-consistency)
- [Spring 事务失效场景](/backend/spring-transaction)
- [业务数据对账与修复](/database/reconciliation)
```

- [ ] **Step 2: Create about page**

Create `docs/about.md`:

```markdown
# 关于我

我是一名 Java 后端工程师，主要关注业务系统开发、复杂链路分析、数据一致性、问题排查和工程质量。

这个知识库用于整理项目经验、排查方法和技术知识。相比零散笔记，这里的文章会更重视背景、过程、判断依据和复盘，方便在面试或技术交流时直接展示。

## 技术方向

- Java / Spring Boot / MyBatis
- 业务链路设计与问题排查
- 数据库设计、SQL 排查与数据对账
- Redis、MQ、分布式锁、定时任务
- 后端工程实践与代码质量

## 内容原则

- 公开文章不暴露公司敏感信息、客户信息、内部域名、账号凭证和真实业务数据。
- 项目经验重点描述方法、判断和结果，不堆砌流水账。
- 知识总结优先来自真实项目经验，再补充必要概念。
```

- [ ] **Step 3: Create overview pages**

Create `docs/projects/index.md`:

```markdown
# 项目经验

这里整理适合公开展示的项目经验。每篇文章围绕背景、职责、难点、方案、结果和复盘展开，重点展示对业务复杂度和技术方案的理解。

## 精选项目

- [复杂提货链路设计与排查](/projects/delivery-chain)
- [业务路由系统实践](/projects/business-routing)
```

Create `docs/troubleshooting/index.md`:

```markdown
# 问题排查

这里记录后端问题的定位过程，包括现象、排查路径、根因、修复方案、验证方式和经验沉淀。

## 精选案例

- [数据一致性问题排查](/troubleshooting/data-consistency)
```

Create `docs/backend/index.md`:

```markdown
# Java 后端

这里整理 Java 后端开发中的核心知识和实践经验，重点关注 Spring、MyBatis、事务、接口设计和代码质量。

## 文章

- [Spring 事务失效场景](/backend/spring-transaction)
- [MyBatis 实践](/backend/mybatis)
```

Create `docs/middleware/index.md`:

```markdown
# 中间件

这里整理 Redis、MQ、分布式锁和定时任务相关经验，重点关注真实业务中的使用边界、失败场景和排查方法。

## 文章

- [Redis 实践](/middleware/redis)
- [MQ 实践](/middleware/mq)
```

Create `docs/database/index.md`:

```markdown
# 数据库

这里整理数据库设计、SQL 排查、数据对账和数据修复相关经验。

## 文章

- [业务数据对账与修复](/database/reconciliation)
```

Create `docs/engineering/index.md`:

```markdown
# 工程实践

这里整理代码结构、开发规范、验证习惯、上线风险控制和复盘方法。

## 关注点

- 代码可读性和维护成本。
- 需求变更中的边界控制。
- 问题修复后的验证和复盘。
- 面向长期维护的知识沉淀。
```

- [ ] **Step 4: Build after core pages**

Run:

```bash
npm run docs:build
```

Expected:

```text
build complete
```

The build may still report broken links to article pages until Task 4 creates them.

- [ ] **Step 5: Commit skeleton pages**

Run:

```bash
git add docs/index.md docs/about.md docs/projects/index.md docs/troubleshooting/index.md docs/backend/index.md docs/middleware/index.md docs/database/index.md docs/engineering/index.md
git commit -m "Shape the public knowledge base skeleton" -m "Constraint: The first release must look useful before every Yuque note is migrated
Rejected: Empty category pages | makes the resume link feel unfinished
Confidence: high
Scope-risk: narrow
Directive: Keep overview pages concise and route readers toward project and troubleshooting evidence
Tested: Core Markdown pages prepared for VitePress build
Not-tested: Article pages and deployment workflow are added in later tasks"
```

Expected:

```text
[main
Shape the public knowledge base skeleton
```

---

### Task 4: First Public Articles

**Files:**
- Create: `docs/projects/delivery-chain.md`
- Create: `docs/projects/business-routing.md`
- Create: `docs/troubleshooting/data-consistency.md`
- Create: `docs/backend/spring-transaction.md`
- Create: `docs/backend/mybatis.md`
- Create: `docs/middleware/redis.md`
- Create: `docs/middleware/mq.md`
- Create: `docs/database/reconciliation.md`

- [ ] **Step 1: Create project experience articles**

Create `docs/projects/delivery-chain.md`:

```markdown
# 复杂提货链路设计与排查

## 背景

在交易类业务系统中，提货链路通常会连接订单、采购、销售、实提、结算和库存等多个环节。链路越长，越容易出现状态不一致、数量不一致或上下游处理顺序不一致的问题。

## 我的职责

- 梳理提货相关业务对象之间的关系。
- 分析采购实提与销售实提之间的数据同步路径。
- 参与问题排查、数据核对和修复方案设计。

## 难点

- 业务链路长，单个问题可能跨多个表和多个服务。
- 状态变化多，部分异常只在特定流程组合下出现。
- 数据一致性要求高，数量、重量、金额和结算状态需要相互匹配。

## 方案

排查这类问题时，先从订单号或业务单号定位主链路，再按采购侧、销售侧、结算侧拆开核对。对每个环节分别确认业务状态、数量重量、关联关系和更新时间，最后再判断问题来自创建、同步、状态流转还是后续补偿。

## 结果

这种排查方式可以把“感觉链路很乱”的问题拆成可验证的步骤，减少盲目改数据或盲目改代码的风险。

## 复盘

复杂业务链路的问题不能只看单表或单接口。更可靠的方式是先建立业务对象地图，再用数据证据确认每个环节是否符合预期。
```

Create `docs/projects/business-routing.md`:

```markdown
# 业务路由系统实践

## 背景

业务系统经常需要在不同入口、不同模式和不同主体之间做路由判断。业务路由模块的价值在于把请求入口、业务规则和后续处理链路连接起来。

## 我的职责

- 理解业务入口和后续服务之间的调用关系。
- 梳理不同业务模式下的判断条件。
- 在问题排查中确认请求是否进入正确链路。

## 难点

- 入口逻辑容易叠加历史分支。
- 不同业务模式的判断条件可能相似但含义不同。
- 一处路由错误可能导致后续数据全部进入错误处理路径。

## 方案

处理这类系统时，先明确请求从哪里来、要去哪里、依赖哪些业务标识，再把判断逻辑整理成可以逐项验证的条件集合。代码实现上优先保持判断清晰，避免为了复用把简单业务判断拆得过深。

## 结果

通过梳理入口与链路关系，可以更快定位请求走错分支、参数缺失或模式判断不一致的问题。

## 复盘

业务路由系统的核心不是写复杂抽象，而是让每个判断条件都能被解释、验证和维护。
```

- [ ] **Step 2: Create troubleshooting article**

Create `docs/troubleshooting/data-consistency.md`:

```markdown
# 数据一致性问题排查

## 现象

业务系统中常见的数据一致性问题包括：上下游数量不一致、状态不一致、关联关系缺失、结算数据与业务数据不匹配。

## 排查过程

排查时先确定一个稳定入口，例如订单号、业务单号或实提 ID。然后按业务链路依次查询核心表，记录每个环节的状态、数量、重量、关联 ID、创建时间和更新时间。

## 根因

常见根因包括：上游数据创建成功但下游同步失败、状态机分支漏处理、补偿任务未覆盖异常数据、人工修复只修了单侧数据。

## 修复方案

修复前先确认数据差异范围，再决定使用代码补偿、脚本修复还是人工处理。修复时必须同时考虑关联表、状态字段和后续结算影响。

## 验证方式

- 重新按链路查询关键数据。
- 对比修复前后的数量、重量和状态。
- 确认后续流程可以继续推进。
- 确认没有引入新的孤立数据或重复数据。

## 经验沉淀

数据一致性排查要避免只修表面现象。先还原链路，再确认根因，最后用可重复的核对方式验证修复结果。
```

- [ ] **Step 3: Create backend and middleware articles**

Create `docs/backend/spring-transaction.md`:

```markdown
# Spring 事务失效场景

## 使用场景

Spring 事务用于保证一组数据库操作要么全部成功，要么在异常时回滚。它常见于订单创建、状态流转、数据修复和跨表写入场景。

## 核心概念

Spring 声明式事务通常依赖代理生效。只有通过代理对象调用被事务增强的方法时，事务边界才会按预期创建。

## 实践经验

常见失效场景包括：同类内部方法调用、方法不是 public、异常被捕获后没有继续抛出、数据库引擎不支持事务、事务传播行为设置不符合预期。

## 常见问题

排查事务问题时，先确认方法是否真的经过代理，再确认异常类型、传播行为、回滚规则和数据库提交情况。

## 总结

事务问题不能只看注解是否存在。更可靠的排查路径是确认调用方式、异常传播、事务边界和数据库实际写入结果。
```

Create `docs/backend/mybatis.md`:

```markdown
# MyBatis 实践

## 使用场景

MyBatis 适合需要精细控制 SQL 的后端业务系统，尤其是复杂查询、对账查询和业务报表场景。

## 核心概念

Mapper 接口定义调用入口，XML 或注解定义 SQL。动态 SQL 可以处理条件查询，但需要控制复杂度，避免查询逻辑难以维护。

## 实践经验

复杂业务查询优先保证 SQL 可读性。条件分支较多时，保持字段命名清楚，明确查询边界，避免把无关业务规则全部塞进一个 SQL。

## 常见问题

- 参数为空导致查询范围扩大。
- 动态条件遗漏导致结果不准确。
- 一对多关联查询造成重复行。
- 大范围查询缺少分页或索引。

## 总结

MyBatis 的优势是 SQL 可控。使用时要把可控变成可读、可验证，而不是把所有逻辑堆到一条难以维护的 SQL 里。
```

Create `docs/middleware/redis.md`:

```markdown
# Redis 实践

## 使用场景

Redis 常用于缓存、分布式锁、计数、限流和临时状态存储。

## 核心概念

使用 Redis 前需要明确数据生命周期、一致性要求、过期策略和失败后的降级方式。

## 实践经验

缓存场景要关注穿透、击穿、雪崩和脏数据。分布式锁场景要关注锁粒度、过期时间、释放条件和业务执行时间。

## 常见问题

- 缓存 key 设计不稳定。
- 过期时间设置过长导致脏数据。
- 锁过期时间短于业务处理时间。
- 删除缓存和更新数据库顺序不清晰。

## 总结

Redis 不是简单的性能工具。每次使用都要明确一致性边界和失败处理方式。
```

Create `docs/middleware/mq.md`:

```markdown
# MQ 实践

## 使用场景

MQ 常用于异步解耦、削峰、事件通知和最终一致性处理。

## 核心概念

消息链路至少要关注生产、投递、消费、重试、幂等和补偿。

## 实践经验

业务消息要有可追踪的业务键。消费者要支持幂等处理，避免重复消费导致重复写入或重复状态流转。

## 常见问题

- 消息发送成功但业务事务回滚。
- 消费失败后重试导致重复处理。
- 缺少业务键导致问题难以追踪。
- 补偿任务和消息消费逻辑不一致。

## 总结

MQ 的重点不是把同步改异步，而是设计清楚失败、重试和幂等边界。
```

- [ ] **Step 4: Create database article**

Create `docs/database/reconciliation.md`:

```markdown
# 业务数据对账与修复

## 使用场景

业务数据对账用于发现上下游系统、不同业务环节或不同主体之间的数据差异。

## 核心概念

对账需要先确定口径，包括业务范围、时间范围、状态范围、数量字段、金额字段和关联关系。

## 实践经验

对账前先明确主数据来源，再选择辅助表进行校验。不要一开始就写复杂 SQL，先用简单查询确认链路和字段含义。

## 常见问题

- 对账口径不一致导致误判。
- 修复单表数据后关联表仍然错误。
- 忽略历史状态导致重复修复。
- 没有保存修复前后的核对证据。

## 总结

数据修复的核心是证据链。每次修复都要能说明差异是什么、为什么错、怎么修、如何确认修复完成。
```

- [ ] **Step 5: Build with all content**

Run:

```bash
npm run docs:build
```

Expected:

```text
build complete
```

- [ ] **Step 6: Commit articles**

Run:

```bash
git add docs/projects docs/troubleshooting docs/backend docs/middleware docs/database
git commit -m "Publish the first resume-ready article set" -m "Constraint: Initial content must demonstrate ability without exposing private company details
Rejected: Raw Yuque copy | may expose uneven notes or sensitive details
Confidence: medium
Scope-risk: moderate
Directive: Rewrite future migrated notes into public article templates before publishing
Tested: npm run docs:build
Not-tested: Browser visual review is handled after deployment setup"
```

Expected:

```text
[main
Publish the first resume-ready article set
```

---

### Task 5: GitHub Pages Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create deployment workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy VitePress site to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Install dependencies
        run: npm ci

      - name: Build VitePress
        run: npm run docs:build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Validate YAML exists and build still passes locally**

Run:

```bash
npm run docs:build
```

Expected:

```text
build complete
```

- [ ] **Step 3: Commit workflow**

Run:

```bash
git add .github/workflows/deploy.yml
git commit -m "Automate publishing through GitHub Pages" -m "Constraint: Resume link should update from normal git pushes
Rejected: Manual dist branch publishing | adds avoidable release steps
Confidence: high
Scope-risk: narrow
Directive: Keep GitHub Pages source set to GitHub Actions in repository settings
Tested: npm run docs:build
Not-tested: Remote GitHub Actions run requires pushing to GitHub"
```

Expected:

```text
[main
Automate publishing through GitHub Pages
```

---

### Task 6: Local Preview And Visual Smoke Test

**Files:**
- No file changes expected unless smoke testing reveals a layout or link issue.

- [ ] **Step 1: Start local preview server**

Run:

```bash
npm run docs:preview -- --port 4173 --host 127.0.0.1
```

Expected:

```text
Local:
```

The site should be available at:

```text
http://localhost:4173
```

- [ ] **Step 2: Smoke test key routes**

Open these routes in a browser:

```text
http://localhost:4173/
http://localhost:4173/projects/
http://localhost:4173/projects/delivery-chain
http://localhost:4173/troubleshooting/data-consistency
http://localhost:4173/backend/spring-transaction
http://localhost:4173/about
```

Expected:

```text
Each route loads without a 404 page.
Navigation links remain clickable.
Text is readable on desktop width.
```

- [ ] **Step 3: Mobile viewport smoke test**

Use browser responsive mode or resize the browser to a narrow width around 390 pixels.

Expected:

```text
Navigation is usable.
Home page content remains readable.
Article headings and paragraphs do not overlap.
```

- [ ] **Step 4: Stop preview server**

Press:

```text
Control+C
```

Expected:

```text
Preview server stops and shell prompt returns.
```

- [ ] **Step 5: Commit visual fixes if needed**

If no file changes were needed, skip this commit. If fixes were made, run:

```bash
git add docs
git commit -m "Polish the local knowledge base preview" -m "Constraint: The site needs to be readable before it is used as a resume link
Rejected: Shipping after build-only verification | misses navigation and viewport issues
Confidence: medium
Scope-risk: narrow
Directive: Keep preview fixes focused on readability and navigation
Tested: Local desktop and mobile smoke routes
Not-tested: Remote GitHub Pages URL until push"
```

Expected if fixes were committed:

```text
[main
Polish the local knowledge base preview
```

---

### Task 7: GitHub Repository Publishing

**Files:**
- No local file changes required.

- [ ] **Step 1: Confirm there is no existing remote**

Run:

```bash
git remote -v
```

Expected before remote setup:

```text
```

No output means no remote is configured.

- [ ] **Step 2: Read GitHub username**

Run:

```bash
GITHUB_USER="$(gh api user --jq .login)"
printf '%s\n' "$GITHUB_USER"
```

Expected:

```text
your GitHub username
```

- [ ] **Step 3: Create public GitHub repository and push**

Run:

```bash
GITHUB_USER="$(gh api user --jq .login)"
gh repo create "$GITHUB_USER.github.io" --public --source . --remote origin --push
```

Expected output includes:

```text
https://github.com/
```

- [ ] **Step 4: Confirm remote**

Run:

```bash
git remote -v
```

Expected output includes:

```text
origin
github.io
```

- [ ] **Step 5: Confirm main branch tracking**
Run:

```bash
git branch -vv
```

Expected output includes:

```text
main
origin/main
```

- [ ] **Step 6: Configure GitHub Pages**

In the GitHub repository settings, configure:

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

Expected:

```text
GitHub Actions starts the deployment workflow after push.
```

- [ ] **Step 7: Verify public URL**

Run:

```bash
GITHUB_USER="$(gh api user --jq .login)"
open "https://$GITHUB_USER.github.io"
```

Expected:

```text
The knowledge base home page loads without login.
```

---

### Task 8: Final Verification

**Files:**
- No file changes expected unless verification reveals a defect.

- [ ] **Step 1: Run production build**

Run:

```bash
npm run docs:build
```

Expected:

```text
build complete
```

- [ ] **Step 2: Check git status**

Run:

```bash
git status --short
```

Expected:

```text
```

No output means the worktree is clean.

- [ ] **Step 3: Verify resume-link criteria**

Confirm:

```text
Home page clearly states Java backend direction.
Project experience is reachable from the home page.
Troubleshooting content is reachable from the home page.
About page explains technical direction and content principles.
Public URL opens without login.
No private company data, customer data, internal domain, credential, or real private data appears in public content.
```

- [ ] **Step 4: Record final result**

Final implementation report should include:

```text
Public site URL
GitHub repository URL
Build command result
Preview or browser smoke test result
Known remaining content gaps
Recommended next Yuque article to rewrite
```
