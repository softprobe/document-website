<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useData } from 'vitepress'

interface FooterLink {
  text: string
  link: string
}

interface FooterGroup {
  title: string
  items: FooterLink[]
}

interface FooterConfig {
  message?: string
  copyright?: string
  links?: FooterGroup[]
}

const { theme, frontmatter } = useData()
const footer = theme.value.footer as FooterConfig | undefined

const show = () => footer && frontmatter.value.footer !== false

/** Lift fixed sidebar above footer band so footer can span full viewport like the home page */
const root = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | undefined
let intersectionObserver: IntersectionObserver | undefined

function syncFooterHeight(el: HTMLElement) {
  document.documentElement.style.setProperty(
    '--sp-site-footer-height',
    `${el.offsetHeight}px`,
  )
}

onMounted(() => {
  const el = root.value
  if (!el || typeof window === 'undefined') return

  syncFooterHeight(el)
  resizeObserver = new ResizeObserver(() => syncFooterHeight(el))
  resizeObserver.observe(el)

  intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      document.documentElement.style.setProperty(
        '--sp-footer-in-view',
        entry?.isIntersecting ? '1' : '0',
      )
    },
    { threshold: 0 },
  )
  intersectionObserver.observe(el)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  document.documentElement.style.setProperty('--sp-site-footer-height', '0px')
  document.documentElement.style.setProperty('--sp-footer-in-view', '0')
})
</script>

<template>
  <footer v-if="show()" ref="root" class="SpFooter">
    <div class="SpFooter-container">
      <div v-if="footer?.links?.length" class="SpFooter-links">
        <div v-for="group in footer.links" :key="group.title" class="SpFooter-group">
          <h4 class="SpFooter-group-title">{{ group.title }}</h4>
          <ul>
            <li v-for="item in group.items" :key="item.link">
              <a :href="item.link">{{ item.text }}</a>
            </li>
          </ul>
        </div>
      </div>
      <p v-if="footer?.message" class="SpFooter-message" v-html="footer.message" />
      <p v-if="footer?.copyright" class="SpFooter-copyright" v-html="footer.copyright" />
    </div>
  </footer>
</template>

<style scoped>
.SpFooter {
  position: relative;
  z-index: var(--vp-z-index-footer);
  margin-top: auto;
  box-sizing: border-box;
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  padding: 48px 24px 32px;
  background-color: #1b1b1f;
  color: rgba(255, 255, 255, 0.75);
  border-top: none;
  flex-shrink: 0;
  align-self: stretch;
}

.SpFooter-container {
  margin: 0 auto;
  width: 100%;
  max-width: var(--vp-layout-max-width);
  padding: 0 8px;
  text-align: center;
}

.SpFooter-links {
  display: grid;
  gap: 2rem;
  margin-bottom: 2rem;
  text-align: left;
}

@media (min-width: 768px) {
  .SpFooter {
    padding: 48px 32px 32px;
  }

  .SpFooter-container {
    padding: 0;
  }

  .SpFooter-links {
    grid-template-columns: repeat(3, 1fr);
    gap: 2.5rem;
  }
}

.SpFooter-group-title {
  margin: 0 0 0.75rem;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.SpFooter-group ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.SpFooter-group li {
  margin: 0.35rem 0;
}

.SpFooter-group a {
  font-size: 14px;
  color: var(--sp-brand-lighter, #c280ff);
  text-decoration: none;
  transition: color 0.2s ease;
}

.SpFooter-group a:hover {
  color: var(--sp-brand-lightest, #e0b3ff);
  text-decoration: underline;
}

.SpFooter-message,
.SpFooter-copyright {
  margin: 0.5rem 0 0;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
}
</style>
