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
  description: 'Java 后端项目经验、问题排查、工程实践与应用场景模拟面经',
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
      { text: '项目与排查', link: '/experience/' },
      { text: 'Java 后端', link: '/backend/' },
      { text: '中间件', link: '/middleware/' },
      { text: '数据库', link: '/database/' },
      { text: '工程实践', link: '/engineering/' },
      { text: '应用场景', link: '/scenarios/' },
      { text: '我', link: '/about' }
    ],
    sidebar: {
      '/experience/': [
        {
          text: '项目与问题排查',
          items: [
            { text: '总览', link: '/experience/' },
            { text: '项目经验总览', link: '/projects/' },
            { text: '复杂提货链路设计与排查', link: '/projects/delivery-chain' },
            { text: '业务路由系统实践', link: '/projects/business-routing' },
            { text: '问题排查总览', link: '/troubleshooting/' },
            { text: '异步方法丢失链路追踪问题解决', link: '/troubleshooting/async-trace-context-loss' },
            { text: '数据一致性问题排查', link: '/troubleshooting/data-consistency' },
            { text: '生产环境 OOM 排查复盘', link: '/troubleshooting/production-oom' }
          ]
        }
      ],
      '/projects/': [
        {
          text: '项目与问题排查',
          items: [
            { text: '总览', link: '/experience/' },
            { text: '项目经验总览', link: '/projects/' },
            { text: '复杂提货链路设计与排查', link: '/projects/delivery-chain' },
            { text: '业务路由系统实践', link: '/projects/business-routing' },
            { text: '问题排查总览', link: '/troubleshooting/' },
            { text: '异步方法丢失链路追踪问题解决', link: '/troubleshooting/async-trace-context-loss' },
            { text: '数据一致性问题排查', link: '/troubleshooting/data-consistency' },
            { text: '生产环境 OOM 排查复盘', link: '/troubleshooting/production-oom' }
          ]
        }
      ],
      '/troubleshooting/': [
        {
          text: '项目与问题排查',
          items: [
            { text: '总览', link: '/experience/' },
            { text: '项目经验总览', link: '/projects/' },
            { text: '复杂提货链路设计与排查', link: '/projects/delivery-chain' },
            { text: '业务路由系统实践', link: '/projects/business-routing' },
            { text: '问题排查总览', link: '/troubleshooting/' },
            { text: '异步方法丢失链路追踪问题解决', link: '/troubleshooting/async-trace-context-loss' },
            { text: '数据一致性问题排查', link: '/troubleshooting/data-consistency' },
            { text: '生产环境 OOM 排查复盘', link: '/troubleshooting/production-oom' }
          ]
        }
      ],
      '/backend/': [
        {
          text: 'Java 后端',
          items: [
            { text: 'Java 后端知识地图', link: '/backend/' },
            { text: 'Java 基础知识', link: '/backend/java-basic-knowledge' },
            { text: '自我修复-01：面试回答修正', link: '/backend/self-repair-01' },
            { text: '加密基础面试复盘', link: '/backend/encryption-interview-review' },
            { text: '登录认证面试复盘', link: '/backend/authentication-interview-review' },
            { text: '计算机网络基础', link: '/backend/computer-network' },
            { text: '操作系统基础', link: '/backend/operating-system' },
            { text: 'Spring Bean 生命周期与线程池关闭', link: '/backend/spring-bean-lifecycle-threadpool-shutdown' },
            { text: 'Spring 事务失效场景', link: '/backend/spring-transaction' },
            { text: 'Spring 面试复盘', link: '/backend/spring-interview-review' },
            { text: 'MyBatis 实践', link: '/backend/mybatis' },
            { text: 'DDD 入门', link: '/backend/domain-driven-design' }
          ]
        }
      ],
      '/middleware/': [
        {
          text: '中间件',
          items: [
            { text: '中间件知识地图', link: '/middleware/' },
            { text: 'Redis 面试复盘', link: '/middleware/redis' },
            { text: 'RabbitMQ 面试复盘', link: '/middleware/mq' },
            { text: '分布式锁对比：Redis 和 ZooKeeper', link: '/middleware/distributed-lock' }
          ]
        }
      ],
      '/database/': [
        {
          text: '数据库',
          items: [
            { text: '数据库知识地图', link: '/database/' },
            { text: 'MySQL 面试复盘', link: '/database/mysql-interview-review' },
            { text: '业务数据对账与修复', link: '/database/reconciliation' },
            { text: '数据库表结构设计规范', link: '/database/table-design-guidelines' },
            { text: '生产环境慢 SQL 排查复盘', link: '/database/production-slow-sql-wrong-index' }
          ]
        }
      ],
      '/engineering/': [
        {
          text: '工程实践',
          items: [
            { text: '工程实践总览', link: '/engineering/' },
            { text: 'Spring AI 音乐智能体学习复盘', link: '/engineering/spring-ai-music-agent' },
            { text: '代码评审与验证', link: '/engineering/code-review-and-verification' }
          ]
        }
      ],
      '/scenarios/': [
        {
          text: '应用场景模拟面经',
          items: [
            { text: '模块说明', link: '/scenarios/' },
            { text: 'Hikari 连接池与数据库连接数', link: '/scenarios/hikari-connection-pool' },
            { text: '后端系统性能瓶颈推演', link: '/scenarios/performance-bottlenecks' },
            { text: '后端性能优化场景', link: '/scenarios/performance-optimization' },
            { text: '采购结算合同批量打印性能优化实战', link: '/scenarios/purchase-contract-batch-print-optimization' },
            { text: '高可用强一致性的设计思路', link: '/scenarios/high-availability-strong-consistency-design' },
            { text: '面试经验-01：HR 面和技术面复盘', link: '/scenarios/interview-experience-01' },
            { text: '自我介绍里的面试钩子设计', link: '/scenarios/interview-self-introduction-hooks' },
            { text: '奇奇怪怪的应用类问题', link: '/scenarios/strange-application-questions' },
            { text: '技术选型横向对比', link: '/scenarios/technology-comparison' },
            { text: 'Spring Boot / Spring Cloud 组件模块梳理', link: '/scenarios/spring-components' }
          ]
        }
      ]
    },
    footer: {
      message: '持续沉淀后端项目经验、问题排查方法、工程实践和应用场景模拟面经。',
      copyright: 'Copyright © 2026 Ding Junhui'
    }
  }
})
