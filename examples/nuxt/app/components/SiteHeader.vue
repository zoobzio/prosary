<script setup lang="ts">
const prosary = useProsary();
const { locale, locales, setLocale } = useLocale();
const { sections } = useAppConfig();
</script>

<template>
  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="#top">
        <span class="brand-mark" aria-hidden="true">☾</span>
        <span class="brand-name">
          <strong>{{ $t.brand.name() }}</strong>
          <small>{{ $t.brand.tagline() }}</small>
        </span>
      </a>

      <nav class="site-nav">
        <a
          v-for="section in sections"
          :key="section.id"
          :href="`#${section.id}`"
        >
          {{ $t(section.title) }}
        </a>
      </nav>

      <!--
        The language picker: each locale named in its own language, as the
        runtime names it. The switch loads the locale's bundle before anything
        changes, and every message, number and date on the page follows.
      -->
      <label class="picker">
        <span class="visually-hidden">{{ $t.settings.language() }}</span>
        <select
          :value="locale"
          @change="
            setLocale(
              ($event.target as HTMLSelectElement).value as AppProsaryLocale,
            )
          "
        >
          <option v-for="option in locales" :key="option" :value="option">
            {{ prosary.name(option, "language") }}
          </option>
        </select>
      </label>
    </div>
  </header>
</template>
