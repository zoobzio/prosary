# prosary

prosary is a type-safe rich text system with renderers for more than one
medium. A document is written once, against a contract, and rendered as HTML,
as components in an app, or as a PDF, in one consistent shape.

This repo contains the prosary library, a build kit, a reference preset,
framework integrations, and examples. It is the sister of
[untheme](https://github.com/zoobzio/untheme), and keeps its structure: a
runtime, a schema, a kit that builds a config into typed output, a preset a
customer extends, and integrations that connect the runtime to a host.

A contract lists the kinds of node a document may hold, their attributes, and
what each may contain. A document fills the contract. A style binds each kind
of node to design tokens, which an untheme theme supplies. A renderer reads a
document and a style and writes one medium. A customer's package is a config
over the reference preset: its own node kinds, its own style, built by the kit
into types, a manifest, and the output each renderer needs.

The document is an [mdast](https://github.com/syntax-tree/mdast) tree: the
Markdown abstract syntax tree of the [unified](https://unifiedjs.com)
ecosystem, which conforms to [unist](https://github.com/syntax-tree/unist).
Markdown is the definition language. A contract is a schema over the tree: the
node types it permits, the custom blocks it names, each block's attributes and
what it may contain. The kit validates a document against the contract and
writes its types. A renderer reads the tree: to [hast](https://github.com/syntax-tree/hast)
and HTML through the ecosystem's own transforms, to components, or to print.

## Workspace

| Directory                        | Contents                                                                  |
| -------------------------------- | ------------------------------------------------------------------------- |
| [`packages`](./packages)         | The library, the `prosary` package, and the build kit                     |
| [`presets`](./presets)           | The reference preset: the core node kinds with a default style            |
| [`integrations`](./integrations) | The Nuxt module and the renderers for each host                           |
| [`examples`](./examples)         | A prose package over the preset, and an app or a document that renders it |

## Development

```sh
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

## License

MIT
