<script setup lang="ts">
const prosary = useProsary();
const { routes, fares } = useAppConfig();
const planner = usePlanner();

const DAY = 86_400_000;

// "Today", fixed: counted from the clock, the days until departure would
// differ between the server's render and the browser's.
const TODAY = Date.UTC(2026, 9, 15);

/** The first night of the winter timetable, the night the routes are shown for. */
const FIRST_NIGHT = Date.UTC(2026, 11, 4);

const route = computed(
  () => routes.find((route) => route.id === planner.value.route) ?? routes[0],
);
const fare = computed(
  () => fares.find((fare) => fare.id === planner.value.fare) ?? fares[0],
);
const travellers = computed(() =>
  Math.max(1, Math.floor(planner.value.travellers || 1)),
);

// The night picked, as the day it falls on: midnight UTC of the date in the
// picker, the first night when the picker holds nothing.
const picked = computed(() => {
  const parsed = Date.parse(`${planner.value.date}T00:00:00Z`);
  return Number.isNaN(parsed) ? FIRST_NIGHT : parsed;
});

// The departure that night: the route's, moved from the first night to the
// one picked. An instant, so the summary's date follows the time zone.
const departure = computed(
  () => route.value.departs + (picked.value - FIRST_NIGHT),
);

// The countdown counts days between dates, not between instants.
const days = computed(() => Math.round((picked.value - TODAY) / DAY));

const each = computed(() => route.value.from + fare.value.supplement);
const total = computed(() => each.value * travellers.value);

// The fare is held for half an hour from the click: a real instant, formatted
// in the visitor's time zone like every other.
const held = ref<number | undefined>(undefined);
const hold = () => {
  held.value = Date.now() + 30 * 60_000;
};
</script>

<template>
  <section id="planner" class="section planner">
    <div class="wrap">
      <h2>{{ $t.section.planner() }}</h2>
      <p class="lede">{{ $t.planner.lede() }}</p>

      <form class="planner-form" @submit.prevent="hold">
        <div class="choices">
          <label>
            <span>{{ $t.planner.route() }}</span>
            <select v-model="planner.route">
              <option
                v-for="option in routes"
                :key="option.id"
                :value="option.id"
              >
                {{
                  $t.route.pair({
                    origin: $t(option.origin),
                    destination: $t(option.destination),
                  })
                }}
              </option>
            </select>
          </label>
          <label>
            <span>{{ $t.planner.date() }}</span>
            <input
              v-model="planner.date"
              type="date"
              min="2026-12-04"
              max="2027-03-27"
            />
          </label>
          <label>
            <span>{{ $t.planner.travellers() }}</span>
            <input
              v-model.number="planner.travellers"
              type="number"
              min="1"
              max="6"
            />
          </label>
        </div>

        <fieldset class="fares">
          <legend>{{ $t.planner.fare() }}</legend>
          <label
            v-for="option in fares"
            :key="option.id"
            class="card fare"
            :class="{ chosen: option.id === planner.fare }"
          >
            <input
              v-model="planner.fare"
              type="radio"
              name="fare"
              :value="option.id"
            />
            <strong>{{ $t(option.name) }}</strong>
            <span class="supplement">
              {{ $t.fare.supplement({ amount: option.supplement }) }}
            </span>
            <p>{{ $t(option.about) }}</p>
          </label>
        </fieldset>

        <div class="summary">
          <p class="sentence">
            {{
              $t.planner.summary({
                count: travellers,
                fare: fare.id,
                origin: $t(route.origin),
                at: departure,
              })
            }}
          </p>
          <p class="countdown">
            {{ prosary.relative(days, "day") }} ·
            {{ prosary.date(departure, "full") }}
          </p>
          <p class="line">
            {{ $t.planner.line({ count: travellers, amount: each }) }}
          </p>
          <p class="total">{{ $t.planner.total({ amount: total }) }}</p>
          <button type="submit" class="button primary">
            {{ $t.planner.hold() }}
          </button>
          <p v-if="held !== undefined" class="held">
            {{ $t.planner.held({ count: travellers, until: held }) }}
          </p>
        </div>
      </form>
    </div>
  </section>
</template>
