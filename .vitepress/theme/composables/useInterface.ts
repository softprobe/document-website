import { ref, computed, readonly, type Ref } from 'vue'

/**
 * Site-wide "which interface am I using" store — the GitHub-docs tool-switcher
 * pattern. Every <InterfaceTabs> on every page and locale reads and writes this
 * one value, so choosing "sp CLI" once keeps CLI steps showing everywhere, and
 * the choice survives reloads via localStorage.
 *
 * Interfaces we document a task through:
 *   ui   — Web console (Dashboard)
 *   cli  — the `sp` command
 *   yaml — declarative policy YAML
 * A page only offers the tabs it actually has; the store just remembers the
 * user's last pick and each page falls back to its first available tab.
 */
export type InterfaceId = 'ui' | 'cli' | 'yaml'

const STORAGE_KEY = 'sp-docs-interface'
const VALID: InterfaceId[] = ['ui', 'cli', 'yaml']

// Module-level singleton: one ref shared by every component instance.
const selected: Ref<InterfaceId> = ref('ui')

let hydrated = false

/** Read the persisted choice once on the client (no-op during SSR). */
function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  const stored = window.localStorage.getItem(STORAGE_KEY) as InterfaceId | null
  if (stored && VALID.includes(stored)) {
    selected.value = stored
  }
  // Cross-tab / cross-instance sync: if another tab changes the pick, follow it.
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue && VALID.includes(e.newValue as InterfaceId)) {
      selected.value = e.newValue as InterfaceId
    }
  })
}

export function useInterface() {
  hydrate()

  function select(id: InterfaceId) {
    if (!VALID.includes(id)) return
    selected.value = id
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, id)
    }
  }

  return {
    selected: readonly(selected),
    select,
    isActive: (id: InterfaceId) => computed(() => selected.value === id),
  }
}
