import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import { defineComponent, h, nextTick, onMounted, watch } from 'vue'
import './style.css'

const enhanceCodeBlocks = () => {
  document.querySelectorAll<HTMLElement>('.vp-doc div[class*="language-"]').forEach((block) => {
    if (block.querySelector('.code-wrap-toggle')) {
      return
    }

    const pre = block.querySelector('pre')
    if (!pre) {
      return
    }

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'code-wrap-toggle'
    button.textContent = '换行'
    button.title = '切换代码块自动换行'
    button.setAttribute('aria-label', '切换代码块自动换行')
    button.setAttribute('aria-pressed', 'false')

    button.addEventListener('click', () => {
      const wrapped = block.classList.toggle('is-wrapped')
      button.textContent = wrapped ? '不换行' : '换行'
      button.setAttribute('aria-pressed', String(wrapped))
    })

    block.appendChild(button)
  })
}

const Layout = defineComponent({
  name: 'CodeWrapLayout',
  setup() {
    const route = useRoute()

    onMounted(() => {
      nextTick(enhanceCodeBlocks)
    })

    watch(
      () => route.path,
      () => nextTick(enhanceCodeBlocks)
    )

    return () => h(DefaultTheme.Layout)
  }
})

export default {
  extends: DefaultTheme,
  Layout
} satisfies Theme
