<script setup lang="ts">
/**
 * Renders every `:::callout{kind}` directive of the content. The directive's
 * attributes arrive as props by the names they were written with; its body
 * is the default slot.
 */
defineProps<{ kind?: string }>();
</script>

<template>
  <aside :class="['callout', kind && `callout-${kind}`]">
    <slot />
  </aside>
</template>

<style scoped>
.callout {
  border-left: 4px solid #999;
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  background: #f6f6f6;
}
.callout-tip {
  border-color: #2a7;
}
</style>
