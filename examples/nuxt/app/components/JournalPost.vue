<script setup lang="ts">
const props = defineProps<{ path: AppProsaryDocument }>();

// The post, in the active locale: its prose as the tree the build made of
// it, and its title, author and date on the root as the front matter the
// translation carried. The date stays data; a message formats it.
const { data: post } = await useDocument(props.path);
const matter = computed(() => matterOf(post.value));
</script>

<template>
  <article v-if="post" class="post">
    <h3>{{ text(matter.title) }}</h3>
    <p class="byline">
      {{
        $t.journal.byline({ author: text(matter.author), at: day(matter.date) })
      }}
    </p>
    <div class="prose">
      <Prose :tree="post" />
    </div>
  </article>
</template>
