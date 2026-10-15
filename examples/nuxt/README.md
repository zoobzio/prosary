# Nuxt example

A Nuxt app translated with prosary: one locale per visitor, a language and
time zone picker, typed messages through `$t`, messages configured as data,
the formatting helpers, and a Markdown document per locale.

```sh
pnpm build              # from the repo root: build the packages first
pnpm --filter @prosary/example-nuxt dev
```

- `nuxt.config.ts` — points the module at the build of
  [`@prosary/example-prose`](../prose), which holds the messages, the
  translations and the content
- `app/app.config.ts` — the page's sections and plans as data, each message
  a key (`"plan.team"`) or a key with its values
  (`["plan.seats", { count: 25 }]`), checked against the contract and
  resolved with `$t(message)`
- `app/app.vue` — everything the page does
- `app/components/prose/Callout.vue` — renders the content's `callout`
  directives; `<Prose>` picks it up from the overrides directory
