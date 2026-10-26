import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import InterfaceTabs from './components/InterfaceTabs.vue'
import Interface from './components/Interface.vue'
import './custom.css'
import { shouldReloadProductNavigation } from '../../auth/policy'

export default {
  extends: DefaultTheme,
  Layout,
  // Site-wide interface switcher, usable in any Markdown page without an import.
  enhanceApp({ app, router }) {
    app.component('InterfaceTabs', InterfaceTabs)
    app.component('Interface', Interface)
    router.onBeforeRouteChange = (to) => {
      if (typeof window !== 'undefined' && shouldReloadProductNavigation(to, window.location.href)) {
        window.location.assign(to)
        return false
      }
    }
  },
} satisfies Theme
