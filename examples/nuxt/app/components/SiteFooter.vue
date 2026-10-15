<script setup lang="ts">
// The tags of the legal line, each a link into the conditions document — to
// the section whose `{#id}` the Markdown gives it.
const terms = (chunks: string[]) =>
  `<a href="#conditions">${chunks.join("")}</a>`;
const privacy = (chunks: string[]) =>
  `<a href="#privacy">${chunks.join("")}</a>`;

// When the timetable last changed: a fixed instant, shown in the visitor's
// time zone.
const updated = Date.UTC(2026, 9, 2, 8, 30);
</script>

<template>
  <footer class="site-footer">
    <div class="wrap">
      <!-- eslint-disable-next-line vue/no-v-html -- the tag handlers' own markup -->
      <p class="legal" v-html="$t.footer.legal({ terms, privacy })" />
      <p class="updated">{{ $t.footer.updated({ at: updated }) }}</p>
      <p class="fiction">{{ $t.footer.fiction() }}</p>
    </div>
  </footer>
</template>
