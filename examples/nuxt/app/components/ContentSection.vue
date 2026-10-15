<script setup lang="ts">
const props = defineProps<{
  /** The section's anchor. */
  id: string;
  /** The document that is the section. */
  path: AppProsaryDocument;
  /** Set on a section that steps back, such as the legal one. */
  muted?: boolean;
}>();

// A section that is a document, whole: the heading and the lede are the
// document's own front matter, translated along with its prose, and the
// body renders through `Prose` with the overrides under `components/prose`.
const { data: doc } = await useDocument(props.path);
const matter = computed(() => matterOf(doc.value));
</script>

<template>
  <section :id="id" class="section" :class="{ muted }">
    <div v-if="doc" class="wrap">
      <h2>{{ text(matter.title) }}</h2>
      <p v-if="matter.description" class="lede">
        {{ text(matter.description) }}
      </p>
      <div class="prose">
        <Prose :tree="doc" />
      </div>
    </div>
  </section>
</template>
