<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vitepress'

// Business observability (Istio/Envoy mesh capture) only exists on SoftProbe Cloud.
// Shown on every /platform/ page so readers of a self-hosted install don't follow it.
const route = useRoute()
const locale = computed(() => {
  if (route.path.startsWith('/zh/platform/')) return 'zh'
  if (route.path.startsWith('/en/platform/')) return 'en'
  return undefined
})
</script>

<template>
  <div v-if="locale === 'zh'" class="custom-block info sp-scope-note">
    <p class="custom-block-title">仅适用于 SoftProbe Cloud</p>
    <p>业务观测基于 Istio/Envoy 采集网格流量，只在 SoftProbe Cloud 上提供。私有化部署的录制回放见 <a href="/zh/testing/">流量回放测试</a>。</p>
  </div>
  <div v-else-if="locale === 'en'" class="custom-block info sp-scope-note">
    <p class="custom-block-title">SoftProbe Cloud only</p>
    <p>Business observability captures mesh traffic with Istio/Envoy and is only offered on SoftProbe Cloud. For self-hosted record and replay, see <a href="/en/testing/">Replay Testing</a>.</p>
  </div>
</template>
