<script setup lang="ts">
const { network } = useAppConfig();
</script>

<template>
  <section id="top" class="hero">
    <div class="wrap">
      <p class="eyebrow">{{ $t.brand.tagline() }}</p>
      <h1>{{ $t.hero.heading() }}</h1>
      <p class="lede">{{ $t.hero.lede({ count: network.cities }) }}</p>
      <p class="actions">
        <a class="button primary" href="#planner">{{ $t.hero.plan() }}</a>
        <a class="button" href="#routes">{{ $t.hero.routes() }}</a>
      </p>
    </div>
  </section>
</template>
