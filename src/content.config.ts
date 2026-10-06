import { defineCollection, z } from "astro:content";

// Content collections carry a `locale` field (default "en") so future articles
// are i18n-ready. No entries yet — this declares the schema only.
const articles = defineCollection({
  schema: z.object({
    title: z.string(),
    locale: z.string().default("en"),
    publishedAt: z.date().optional(),
  }),
});

export const collections = { articles };
