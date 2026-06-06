import { defineConfig } from 'vitepress'

const translateGeneratedText = (code: string) =>
  code
    .replaceAll('Main Navigation', '主导航')
    .replaceAll('extra navigation', '更多导航')
    .replaceAll('mobile navigation', '移动端导航')
    .replaceAll('Sidebar Navigation', '侧边栏导航')
    .replaceAll('Pager', '分页导航')
    .replaceAll('toggle section', '切换章节')
    .replaceAll('go to home', '返回首页')
    .replaceAll('Permalink to', '复制标题链接')

export default defineConfig({
  lang: 'zh-CN',
  title: 'Ding Junhui 技术知识库',
  description: 'Java 后端知识储备、面经、复盘与独自升级',
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['superpowers/**'],
  transformHtml(code) {
    return translateGeneratedText(code)
  },
  vite: {
    plugins: [
      {
        name: 'translate-vitepress-default-theme-labels',
        generateBundle(_, bundle) {
          for (const chunk of Object.values(bundle)) {
            if (chunk.type === 'chunk') {
              chunk.code = translateGeneratedText(chunk.code)
            } else if (typeof chunk.source === 'string') {
              chunk.source = translateGeneratedText(chunk.source)
            }
          }
        }
      }
    ]
  },
  themeConfig: {
    siteTitle: 'Ding Junhui',
    outline: { label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新' },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '返回顶部',
    langMenuLabel: '切换语言',
    skipToContentLabel: '跳转到正文',
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清空搜索',
            backButtonTitle: '返回',
            noResultsText: '没有找到相关结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车键',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '向上键',
              navigateDownKeyAriaLabel: '向下键',
              closeText: '关闭',
              closeKeyAriaLabel: 'Esc 键'
            }
          }
        }
      }
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '知识储备', link: '/knowledge/' },
      { text: '面经', link: '/interviews/' },
      { text: '复盘', link: '/reviews/' },
      { text: '独自升级', link: '/growth/' }
    ],
    sidebar: {
      '/knowledge/': [
        {
          text: 'Java 后端',
          items: [
            { text: 'Java基础&集合&并发&JVM&GC', link: '/knowledge/java-basic-collection-concurrency-jvm-gc' },
            { text: '计算机网络基础', link: '/knowledge/computer-network' },
            { text: '操作系统基础', link: '/knowledge/operating-system' },
            { text: 'Spring Bean 生命周期与线程池 / JVM 关闭机制知识整理', link: '/knowledge/spring-bean-lifecycle-threadpool-shutdown' },
            { text: 'Spring 事务失效场景', link: '/knowledge/spring-transaction' },
            { text: 'Spring 面试复盘：基础、AOP、事务、容器源码、MVC 与 Boot', link: '/knowledge/spring-interview-review' }
          ]
        },
        {
          text: '中间件',
          items: [
            { text: 'Redis 常见问题', link: '/knowledge/redis-common-questions' },
            { text: 'RabbitMQ 常见问题', link: '/knowledge/rabbitmq-common-questions' },
            { text: '分布式锁对比：Redis 和 ZooKeeper 怎么选？', link: '/knowledge/distributed-lock-redis-zookeeper' }
          ]
        },
        {
          text: '数据库',
          items: [
            { text: 'MySQL常见问题', link: '/knowledge/mysql-common-questions' },
            { text: '数据库表结构设计规范：从三范式到业务落地', link: '/knowledge/table-design-guidelines' }
          ]
        }
      ],
      '/interviews/': [
        {
          text: '面试复盘',
          items: [
            { text: '面试经验-01：一次 HR 面和技术面的完整复盘', link: '/interviews/interview-experience-01' },
            { text: 'JD 一面复盘：从真实经历到面试表达', link: '/interviews/jd-first-round-interview-review' }
          ]
        },
        {
          text: '表达修正',
          items: [
            { text: 'Java 后端模拟面试全链路复盘', link: '/interviews/java-backend-mock-interview-review' },
            { text: '自我介绍里的面试钩子设计', link: '/interviews/interview-self-introduction-hooks' }
          ]
        }
      ],
      '/reviews/': [
        {
          text: '线上问题',
          items: [
            { text: '生产环境 OOM 排查复盘', link: '/reviews/production-oom' },
            { text: '异步方法丢失链路追踪问题解决', link: '/reviews/async-trace-context-loss' },
            { text: '生产慢 SQL：优化器误选索引排查', link: '/reviews/production-slow-sql-wrong-index' }
          ]
        },
        {
          text: '性能与稳定性',
          items: [
            { text: '深分页&慢SQL&JVM&线程池优化', link: '/reviews/backend-performance-optimization' },
            { text: '采购结算合同批量打印性能优化实战', link: '/reviews/purchase-contract-batch-print-optimization' }
          ]
        },
        {
          text: '项目与代码',
          items: [
            { text: '复杂提货链路设计与排查复盘', link: '/reviews/delivery-chain-review' },
            { text: '业务路由系统设计复盘', link: '/reviews/business-routing-review' },
            { text: '多主体互转问题复盘', link: '/reviews/main-relation-transfer-issue-review' },
            { text: 'Code Review 与验证闭环复盘', link: '/reviews/code-review-and-verification' },
            { text: '业务系统 Code Review 规范复盘', link: '/reviews/code-review-business-boundary' },
            { text: 'AI 使用过程中常见的坑：从一次生产故障复盘说起', link: '/reviews/ai-usage-pitfalls' }
          ]
        }
      ],
      '/growth/': [
        {
          text: 'AI 与智能体',
          items: [
            { text: 'Spring AI 智能体学习复盘', link: '/growth/spring-ai-music-agent' },
            { text: 'Dify 工作流：钢银提货助手流程地图', link: '/growth/dify-delivery-assistant-flow-map' }
          ]
        },
        {
          text: '系统设计与性能推演',
          items: [
            { text: 'Spring Boot / Spring Cloud 组件模块梳理', link: '/growth/spring-components' },
            { text: 'MQ&分布式锁技术选型横向对比', link: '/growth/mq-distributed-lock-technology-comparison' },
            { text: '超时&重复&慢怎么办', link: '/growth/timeout-duplicate-slow-questions' },
            { text: '系统性能瓶颈与排查', link: '/growth/system-performance-bottlenecks' },
            { text: '高可用强一致性的设计思路', link: '/growth/high-availability-strong-consistency-design' },
            { text: 'Hikari 连接池与数据库连接数', link: '/growth/hikari-connection-pool' },
            { text: 'DDD 入门：从三层架构到业务建模', link: '/growth/domain-driven-design' }
          ]
        },
        {
          text: '安全与认证',
          items: [
            { text: '加密基础：对称加密、非对称加密', link: '/growth/encryption-basics' },
            { text: '登录认证Cookie、Session、JWT', link: '/growth/authentication-cookie-session-jwt' }
          ]
        }
      ]
    },
    footer: {
      message: '持续沉淀知识储备、面试经验、项目复盘和独自升级记录。',
      copyright: 'Copyright © 2026 Ding Junhui'
    }
  }
})
