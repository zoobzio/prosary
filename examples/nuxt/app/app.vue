<script setup lang="ts">
const prosary = useProsary();
const t = useT();

// Without a time zone the server and the browser each format times in their
// own, and the timetable would change under the visitor as the page hydrates.
// Settled here on the first request, it travels with the selection from then
// on; the visitor changes it next to the routes.
if (prosary.config.timeZone === undefined) {
  prosary.setTimeZone("Europe/Paris");
}

// The document title is a message like any other, and follows the locale.
useHead({
  title: computed(() => `${t.brand.name()} · ${t.brand.tagline()}`),
});
</script>

<template>
  <SiteHeader />
  <main>
    <SectionHero />
    <SectionNetwork />
    <SectionRoutes />
    <SectionPlanner />
    <ContentSection id="onboard" path="onboard.md" />
    <SectionJournal />
    <ContentSection id="faq" path="faq.md" />
    <ContentSection id="story" path="story.md" />
    <ContentSection id="conditions" path="legal/conditions.md" muted />
  </main>
  <SiteFooter />
</template>
