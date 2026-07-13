import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import InterfaceTabs from './components/InterfaceTabs.vue'
import Interface from './components/Interface.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  // Site-wide interface switcher, usable in any Markdown page without an import.
  enhanceApp({ app }) {
    app.component('InterfaceTabs', InterfaceTabs)
    app.component('Interface', Interface)
  },
} satisfies Theme
