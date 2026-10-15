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
