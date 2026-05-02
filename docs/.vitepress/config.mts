import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Ding Junhui 技术知识库',
  description: 'Java 后端项目经验、问题排查与知识沉淀',
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['superpowers/**'],
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
