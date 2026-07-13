<script setup lang="ts">
import { inject, computed, type ComputedRef } from 'vue'
import type { InterfaceId } from '../composables/useInterface'

/**
 * One interface panel inside <InterfaceTabs>. Shows only when its `id` matches
 * the tab block's active interface. Markdown between the tags renders as normal
 * (fenced code, lists, tips) — no HTML gymnastics needed.
 */
const props = defineProps<{ id: InterfaceId }>()

const active = inject<ComputedRef<InterfaceId>>('sp-active-interface')
const show = computed(() => active?.value === props.id)
</script>

<template>
  <div v-show="show" class="sp-interface-panel">
    <slot />
  </div>
</template>
