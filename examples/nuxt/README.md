# Nuxt example

The landing page of Solstice Rail, a fictional night-train company, rendered
with prosary in English, French and German: one locale per visitor, typed
messages through `$t`, the formatting helpers, and the prose of the site as
Markdown documents rendered with the app's own components.

```sh
pnpm build              # from the repo root: build the packages first
pnpm --filter @prosary/example-nuxt dev
```

## What it shows

**Messages.** Every string on the page is an ICU message of
[`@prosary/example-prose`](../prose), resolved with `$t` in the active locale.
Among them: plurals (`route.nights`), a select (`planner.summary`), exact
matches (`fare.supplement`, which reads "Included in the fare" at zero), tags
that become links (`footer.legal`), and messages whose values are other
messages (`route.pair` takes two translated city names).

**Named formats.** `{amount, number, price}`, `{distance, number, distance}`
and `{count, number, compact}` format by names the kit config declares; the
`departure` and `calendar` date formats too. The `calendar` format fixes its
time zone, so the date of a journal post is the same day everywhere.

**Helpers.** The network strip names the countries in the visitor's language
and joins them the way that language lists things (`name`, `list`); the
planner counts down with `relative` and spells the night with `date`; the
language picker names each locale in itself.

**Time zones.** Every departure and arrival is an instant. The picker next to
the routes sets the zone; the server renders in it and the browser keeps it,
so nothing moves as the page hydrates.

**Messages as data.** `app/app.config.ts` holds the routes, fares and
sections with their messages as keys — `"city.vienna"`, or a key with its
values — checked against the contract where they are written. A key that does
not exist fails `nuxt typecheck`, and so does a document path the content
does not build.

**Content.** The sections "Life on board", "Questions", "Our story" and the
conditions of carriage are Markdown documents, each one translated as a
document and loaded with `useDocument` in the active locale. The journal is
three documents under `journal/`. A section's heading and lede are the
document's front matter, which travels with the translation; a post's date is
front matter too, and stays data for a message to format.

**Overrides.** `<Prose>` renders a document with the components under
`app/components/prose`, each named for what it renders:

| Component      | Renders                                                                               |
| -------------- | ------------------------------------------------------------------------------------- |
| `Callout.vue`  | `:::callout{kind="tip"}` as an aside; the attribute arrives as the `kind` prop        |
| `Question.vue` | `:::question` as a disclosure: the heading it opens with is the summary               |
| `Badge.vue`    | `:badge[New]`, an inline directive, as a pill                                         |
| `H3.vue`       | every `h3`; one with a `{#id}` marker arrives with its `id` and gets a link to itself |
| `A.vue`        | every link; one that leaves the site opens in a new tab                               |
| `Table.vue`    | every table, in a box that scrolls on a narrow screen                                 |

An override that names an element or a directive the content does not build
fails `nuxt typecheck`.

## Files

- `nuxt.config.ts` — points the module at the build of `@prosary/example-prose`
- `app/app.vue` — the page: settles the time zone, sets the document title,
  lays out the sections
- `app/app.config.ts` — the routes, fares, journal posts, sections and figures
- `app/components/` — a component per section; `ContentSection.vue` renders a
  document whole, `JournalPost.vue` a post with its byline
- `app/components/prose/` — the overrides
- `app/composables/planner.ts` — the planner's choices, shared with the route cards
- `app/utils/matter.ts` — reads a document's front matter off its tree
