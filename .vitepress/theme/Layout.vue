<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import SpFooter from './components/SpFooter.vue'
import PlatformScopeNote from './components/PlatformScopeNote.vue'
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-before>
      <PlatformScopeNote />
    </template>
    <template #layout-bottom>
      <SpFooter />
    </template>
  </DefaultTheme.Layout>
</template>
