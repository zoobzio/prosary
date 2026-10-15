<script setup lang="ts">
const prosary = useProsary();
const { routes, zones } = useAppConfig();
const planner = usePlanner();
</script>

<template>
  <section id="routes" class="section">
    <div class="wrap">
      <div class="section-head">
        <h2>{{ $t.section.routes() }}</h2>

        <!--
          Every time on the page is an instant, formatted in the zone chosen
          here: the server renders in it, the browser keeps it, and switching
          it moves every departure and arrival at once.
        -->
        <label class="zone">
          <span>{{ $t.settings.timeZone() }}</span>
          <select
            :value="prosary.config.timeZone"
            @change="
              prosary.setTimeZone(($event.target as HTMLSelectElement).value)
            "
          >
            <option v-for="zone in zones" :key="zone" :value="zone">
              {{ zone }}
            </option>
          </select>
          <small>{{ $t.settings.timeZoneHint() }}</small>
        </label>
      </div>

      <ul class="routes">
        <li v-for="route in routes" :key="route.id" class="card route">
          <h3>
            {{
              $t.route.pair({
                origin: $t(route.origin),
                destination: $t(route.destination),
              })
            }}
          </h3>
          <p class="times">
            <span>{{ $t.route.departs({ at: route.departs }) }}</span>
            <span>{{ $t.route.arrives({ at: route.arrives }) }}</span>
          </p>
          <p class="meta">
            <span>{{ $t.route.nights({ count: route.nights }) }}</span>
            <strong>{{ $t.route.from({ amount: route.from }) }}</strong>
          </p>
          <a
            class="button small"
            href="#planner"
            @click="planner.route = route.id"
          >
            {{ $t.hero.plan() }}
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>
