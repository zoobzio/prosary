import { defineSchema } from "@prosary/schema";

/** A contract as the kit emits it. */
export const contract = {
  locale: "en",
  locales: ["en", "fr"],
  messages: ["greeting", "title"],
} as const;

export const schema = defineSchema(contract);

/** A bundle per locale, compiled the way the kit emits them. */
export const bundles = {
  en: { title: [{ type: 0, value: "Welcome" }] },
  fr: { title: [{ type: 0, value: "Bienvenue" }] },
};

export const entries = [
  { id: "en", name: "English" },
  { id: "fr", name: "français" },
];

/** The documents the content serves, and one tree per locale. */
export const paths = ["guide/intro.md", "faq.md"];

export const trees = {
  en: { type: "root", children: [{ type: "text", value: "Hello" }] },
  fr: { type: "root", children: [{ type: "text", value: "Bonjour" }] },
};
