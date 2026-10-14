import type {
  AppProsary,
  AppProsaryBundle,
  AppProsaryConfig,
  AppProsaryContract,
  AppProsaryLocale,
  ProsaryNuxtApp,
  SetLocale,
} from "./types";

import type { Schema } from "prosary";

import { shallowRef } from "vue";
import { useRequestHeaders } from "#imports";
import { contract } from "#build/prosary/index.mjs";
import { bundles } from "#build/prosary/bundles.mjs";
// The core constructor, renamed: this module's own `makeProsary` wraps it.
import { defineSchema, makeProsary as makeService } from "prosary";
import { negotiate } from "./negotiate";
import { onServer } from "./side";
import { accessProsary } from "./store";

/**
 * Builds the app's prosary service over reactive state: the selection in
 * {@link accessProsary}'s `useState`, and the active locale's messages in a
 * shallow ref this call owns — replaced whole on a switch, never observed in
 * depth, and never serialized.
 *
 * On the server the selection is settled first: the locale from the
 * visitor's cookie, else the best match for their `Accept-Language`, else
 * the source locale; the time zone and convention from their cookies when
 * those still hold. The browser starts from the selection the server
 * rendered with. Either side then loads that one locale's bundle.
 *
 * Every later change is written through to the cookies, so the next request
 * renders the way the visitor left things.
 *
 * @param nuxtApp - The Nuxt app, for its hooks.
 * @returns The service, and the function that switches locale.
 */
export const makeProsary = async (
  nuxtApp: ProsaryNuxtApp,
): Promise<{ service: AppProsary; setLocale: SetLocale }> => {
  const { selection, cookies } = accessProsary();
  const schema: Schema<AppProsaryContract> = defineSchema(contract);

  if (onServer()) {
    const header = useRequestHeaders(["accept-language"])["accept-language"];
    const { locale, timeZone, convention } = cookies;
    selection.value = {
      locale: schema.check.locale(locale.value)
        ? locale.value
        : (negotiate(header, contract.locales) ?? contract.locale),
      ...(schema.check.timeZone(timeZone.value)
        ? { timeZone: timeZone.value }
        : {}),
      ...(schema.check.convention(convention.value)
        ? { convention: convention.value }
        : {}),
    };
  }

  const messages = shallowRef<AppProsaryBundle>(
    await bundles[selection.value.locale](),
  );

  /*
   * The container the service reads and writes: the selection's fields and
   * the messages, each through its ref, so every read inside a render is
   * tracked and every write re-renders what read it.
   */
  const config: AppProsaryConfig = {
    get locale() {
      return selection.value.locale;
    },
    set locale(value) {
      selection.value.locale = value;
    },
    get messages() {
      return messages.value;
    },
    set messages(value) {
      messages.value = value;
    },
    get timeZone() {
      return selection.value.timeZone;
    },
    set timeZone(value) {
      selection.value.timeZone = value;
    },
    get convention() {
      return selection.value.convention;
    },
    set convention(value) {
      selection.value.convention = value;
    },
  };

  const service = makeService<AppProsaryContract>(contract, config, {
    set: {
      config: {
        locale: (locale) => {
          cookies.locale.value = locale;
          nuxtApp.callHook("prosary:locale", locale);
          return locale;
        },
        timeZone: (timeZone) => {
          cookies.timeZone.value = timeZone ?? null;
          return timeZone;
        },
        convention: (convention) => {
          cookies.convention.value = convention ?? null;
          return convention;
        },
      },
    },
  });

  /*
   * Loads, then applies. Switches that overlap resolve in the order their
   * bundles arrive, so only the latest call is allowed to apply.
   */
  let latest = 0;
  const setLocale = async (locale: AppProsaryLocale): Promise<void> => {
    schema.assert.locale(locale);
    const call = ++latest;
    const bundle = await bundles[locale]();
    if (call === latest) {
      service.apply(locale, bundle);
    }
  };

  return { service, setLocale };
};
