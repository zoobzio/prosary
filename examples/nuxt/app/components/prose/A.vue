<script setup lang="ts">
/**
 * Renders every link of the content. One that leaves the site opens in a
 * new tab; one into the page, such as `[journal](#journal)`, stays.
 */
const props = defineProps<{ href?: string }>();

const external = computed(() => /^https?:/.test(props.href ?? ""));
</script>

<template>
  <a
    :href="href"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noreferrer' : undefined"
  >
    <slot />
  </a>
</template>
