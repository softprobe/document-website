<script setup lang="ts">
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

// Full-bleed branded footer renders only on pages without a doc sidebar
// (home / page layouts). Doc pages close with VitePress's native prev/next,
// edit link, and last-updated — the same pattern Vue and Vite use.
const show = () => {
  if (!footer || frontmatter.value.footer === false) return false
  const layout = frontmatter.value.layout
  return layout === 'home' || layout === 'page'
}
</script>

<template>
  <footer v-if="show()" class="SpFooter">
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
  width: 100%;
  padding: 48px 24px 32px;
  background-color: var(--vp-c-bg-alt);
  color: var(--vp-c-text-2);
  border-top: 1px solid var(--vp-c-divider);
  flex-shrink: 0;
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
  color: var(--vp-c-text-1);
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
  color: var(--sp-brand-link, #7a2eff);
  text-decoration: none;
  transition: color 0.2s ease;
}

.SpFooter-group a:hover {
  color: var(--sp-brand, #a14eff);
  text-decoration: underline;
}

.SpFooter-message,
.SpFooter-copyright {
  margin: 0.5rem 0 0;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
</style>
