import { z } from "zod";
export const publicDesignSchema = z.object({
  pageTemplate: z.enum(["STANDARD", "SAGE"]),
  pageFont: z.enum(["EDITORIAL", "LITERARY", "MODERN"]),
  coverImageUrl: z.string().nullable(),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  pageLayout: z.enum(["CLASSIC", "COMPACT", "COVER_GRID"]),
  backgroundType: z.enum(["IMAGE", "COLOR", "GRADIENT"]),
  backgroundImageUrl: z.string().nullable(),
  backgroundColor: z.string().nullable(),
  backgroundGradientFrom: z.string().nullable(),
  backgroundGradientTo: z.string().nullable(),
});
export type PublicDesignPreview = z.infer<typeof publicDesignSchema>;
