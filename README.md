# prosary

prosary is becoming a content management service: a type-safe content
pipeline from Markdown to any medium, with translation built in. This repo is
the monorepo for it.

The repo is mid-merge. The translation system is here now, in full. The rich
text pipeline that prosary started as — the contract, the parser, the store,
and the HTML renderer — was removed from the working tree and is in the git
history, at the commit before the merge. It returns package by package as the
two are unified.

## What is here now

A type-safe translation system with runtime language delivery, built on
[FormatJS](https://formatjs.github.io/) and ICU MessageFormat. It separates
the **contract** — which messages exist and the arguments each one takes —
from the **translations that fill it**. A build kit turns enumerated content
into per-locale JSON and typed modules; the runtime service delivers and
formats them; a translate command keeps the translations current through a
model.

## Workspace

| Directory                        | Contents                                           |
| -------------------------------- | -------------------------------------------------- |
| [`packages`](./packages)         | The library: the runtime service and the build kit |
| [`integrations`](./integrations) | Framework bridges                                  |
| [`examples`](./examples)         | Example apps                                       |

## Development

```sh
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

`pnpm build` runs through turbo, so a downstream package builds after the
packages it depends on. The tests of a package read its own build output, so
build before you test.

## License

MIT
