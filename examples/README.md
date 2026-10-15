# Examples

| Example            | Directory        | Description                                                               |
| ------------------ | ---------------- | ------------------------------------------------------------------------- |
| [`nuxt`](./nuxt)   | `examples/nuxt`  | The landing page of a fictional night-train company, in three languages   |
| [`prose`](./prose) | `examples/prose` | Its messages, content and translations, built with the kit into a package |

The two are one example in two packages: `prose` is what a content team
would own and `nuxt` is the app that renders it. The app never reads a
Markdown file or a message source; it imports the build.
