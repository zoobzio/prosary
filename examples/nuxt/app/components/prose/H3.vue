<script setup lang="ts">
/**
 * Renders every `h3` of the content. An element's component receives the
 * element's attributes as props by their HTML names: a heading with a
 * `{#id}` marker arrives with its `id`, and gets a link to itself.
 */
defineProps<{ id?: string }>();
</script>

<template>
  <h3 :id="id">
    <slot />
    <a
      v-if="id"
      class="anchor"
      :href="`#${id}`"
      aria-hidden="true"
      tabindex="-1"
    >
      #
    </a>
  </h3>
</template>
