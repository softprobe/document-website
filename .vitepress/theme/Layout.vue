<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import SpFooter from './components/SpFooter.vue'
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-bottom>
      <SpFooter />
    </template>
  </DefaultTheme.Layout>
</template>
