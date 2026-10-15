<script setup lang="ts">
const { posts } = useAppConfig();
</script>

<template>
  <section id="journal" class="section">
    <div class="wrap">
      <h2>{{ $t.section.journal() }}</h2>
      <div class="posts">
        <JournalPost v-for="path in posts" :key="path" :path="path" />
      </div>
    </div>
  </section>
</template>
