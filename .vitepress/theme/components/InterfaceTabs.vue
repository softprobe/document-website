<script setup lang="ts">
import { computed, provide } from 'vue'
import { useData } from 'vitepress'
import { useInterface, type InterfaceId } from '../composables/useInterface'

/**
 * Site-wide interface switcher (Web UI / sp CLI / YAML). Wrap one or more
 * <Interface id="…"> panels; this renders the tab bar and the shared store
 * decides which panel shows. The pick is remembered across every page.
 *
 * Usage in Markdown:
 *   <InterfaceTabs :tabs="['ui','cli']">
 *   <Interface id="ui">…Web console steps…</Interface>
 *   <Interface id="cli">…sp command steps…</Interface>
 *   </InterfaceTabs>
 *
 * `tabs` lists which interfaces this block offers, in display order. If the
 * user's remembered pick isn't offered here, the first listed tab is shown.
 */
const props = withDefaults(
  defineProps<{
    tabs?: InterfaceId[]
  }>(),
  { tabs: () => ['ui', 'cli'] }
)

const { selected, select } = useInterface()

// Localised labels — the switcher reads naturally in both site languages.
const { lang } = useData()
const isZh = computed(() => lang.value.startsWith('zh'))
const LABELS: Record<InterfaceId, { en: string; zh: string }> = {
  ui: { en: 'Web console', zh: '网页控制台' },
  cli: { en: 'sp CLI', zh: 'sp 命令' },
  yaml: { en: 'Policy YAML', zh: '策略 YAML' },
}
function label(id: InterfaceId) {
  return isZh.value ? LABELS[id].zh : LABELS[id].en
}

// The tab that's actually shown here: the remembered pick if this block offers
// it, otherwise fall back to the first tab so a panel always renders.
const activeTab = computed<InterfaceId>(() =>
  props.tabs.includes(selected.value as InterfaceId) ? (selected.value as InterfaceId) : props.tabs[0]
)

// Expose the resolved active tab to child <Interface> panels via provide.
provide('sp-active-interface', activeTab)
</script>

<template>
  <div class="sp-itabs">
    <div class="sp-itabs-nav" role="tablist">
      <button
        v-for="id in tabs"
        :key="id"
        role="tab"
        :aria-selected="activeTab === id"
        :class="{ active: activeTab === id }"
        @click="select(id)"
      >
        {{ label(id) }}
      </button>
    </div>
    <div class="sp-itabs-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sp-itabs {
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}
.sp-itabs-nav {
  display: flex;
  background: var(--vp-c-bg-mute);
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 0 4px;
}
.sp-itabs-nav button {
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.2s ease, border-color 0.2s ease;
  outline: none;
}
.sp-itabs-nav button:hover {
  color: var(--vp-c-text-1);
}
.sp-itabs-nav button.active {
  color: var(--sp-brand);
  border-bottom-color: var(--sp-brand);
}
.sp-itabs-body {
  padding: 20px;
  background: var(--vp-c-bg);
}
/* Match the tight spacing the old hand-rolled tabs used inside the panel. */
.sp-itabs-body :deep(> :first-child) {
  margin-top: 0;
}
.sp-itabs-body :deep(> :last-child) {
  margin-bottom: 0;
}
</style>
