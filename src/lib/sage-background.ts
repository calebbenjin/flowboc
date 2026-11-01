import {
  backgroundColorValue,
  backgroundImageValue,
  hasActiveBackground,
  isFlatBackgroundBright,
  type PageBackground,
} from "./public-page-background.ts";

export function sageBackgroundStyle(input: Partial<PageBackground>) {
  const background: PageBackground = {
    backgroundType: input.backgroundType ?? "IMAGE",
    backgroundImageUrl: input.backgroundImageUrl ?? null,
    backgroundColor: input.backgroundColor ?? null,
    backgroundGradientFrom: input.backgroundGradientFrom ?? null,
    backgroundGradientTo: input.backgroundGradientTo ?? null,
  };
  const active = hasActiveBackground(background);
  // Image backgrounds receive a light wash so the profile stays readable.
  const bright =
    !active || background.backgroundType === "IMAGE" || isFlatBackgroundBright(background);
  const image = backgroundImageValue(background);
  return {
    backgroundColor: backgroundColorValue(background) ?? "#e8ebdf",
    backgroundImage: !active
      ? "radial-gradient(ellipse at 50% 20%, #f7f5e9 0%, #e7ebdf 70%)"
      : background.backgroundType === "IMAGE"
        ? `linear-gradient(#faf7eeb3, #faf7eeb3), ${image}`
        : (image ?? "none"),
    backgroundSize: "cover",
    backgroundPosition: "center",
    "--sage-profile-ink": bright ? "#303b2d" : "#fffdf7",
    "--muted-foreground": bright ? "#60685b" : "#eee9df",
  };
}
