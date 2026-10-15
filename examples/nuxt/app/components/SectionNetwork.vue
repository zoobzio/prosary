<script setup lang="ts">
const prosary = useProsary();
const { network, countries } = useAppConfig();

// The countries named in the visitor's language and joined the way that
// language lists things — two helpers, feeding a message.
const served = computed(() =>
  prosary.list(countries.map((code) => prosary.name(code, "region"))),
);
</script>

<template>
  <section class="network">
    <div class="wrap">
      <ul class="figures">
        <li>{{ $t.network.cities({ count: network.cities }) }}</li>
        <li>{{ $t.network.track({ distance: network.track }) }}</li>
        <li>{{ $t.network.travellers({ count: network.travellers }) }}</li>
      </ul>
      <p class="countries">{{ $t.network.countries({ countries: served }) }}</p>
    </div>
  </section>
</template>
