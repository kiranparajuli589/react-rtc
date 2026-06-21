import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ne", "hi", "es", "fr", "de", "zh"],
  defaultLocale: "en",
});

export type AppLocale = (typeof routing.locales)[number];
