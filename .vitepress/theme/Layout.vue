<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import SpFooter from './components/SpFooter.vue'
import PlatformScopeNote from './components/PlatformScopeNote.vue'
import { useData } from 'vitepress'
import { isProductPath } from '../../auth/policy'
const { page } = useData()
</script>

<template>
  <DefaultTheme.Layout :class="{ 'public-doc-page': !isProductPath('/' + page.relativePath) }">
    <template #doc-before>
      <PlatformScopeNote />
    </template>
    <template #layout-bottom>
      <form v-if="isProductPath('/' + page.relativePath)" class="docs-logout" action="/__docs/logout" method="post">
        <button type="submit">{{ page.relativePath.startsWith('zh/') ? '退出文档访问' : 'Sign out of documentation' }}</button>
      </form>
      <SpFooter />
    </template>
  </DefaultTheme.Layout>
</template>

<style>
.public-doc-page .VPNavBarSearch { display: none; }
.docs-logout { text-align: center; padding: 16px; font-size: 13px; color: var(--vp-c-text-2); }
.docs-logout button:hover { color: var(--vp-c-brand-1); }
</style>
