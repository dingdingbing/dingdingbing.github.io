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
  description: 'Java 后端项目经验、问题排查与知识沉淀',
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
            { text: 'Spring AI 音乐智能体学习复盘', link: '/backend/spring-ai-music-agent' },
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
            { text: 'RabbitMQ 面试复盘', link: '/middleware/mq' }
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
            { text: '工程实践总览', link: '/engineering/' },
            { text: '代码评审与验证闭环', link: '/engineering/code-review-and-verification' }
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
