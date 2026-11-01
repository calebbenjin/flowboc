export const ONBOARDING_MOODS = {
  sand: { label: "Warm sand", color: "#af774d", background: "#f0e3d0" },
  forest: { label: "Quiet forest", color: "#3e4935", background: "#e7ebdf" },
  violet: { label: "Soft violet", color: "#6355ff", background: "#eeebff" },
} as const;
export type OnboardingMood = keyof typeof ONBOARDING_MOODS;
export function onboardingAppearance(mood: string, entitled: boolean) {
  if (!entitled || !Object.hasOwn(ONBOARDING_MOODS, mood)) return null;
  const selected = ONBOARDING_MOODS[mood as OnboardingMood];
  return {
    pageTemplate: "SAGE",
    themeColor: selected.color,
    backgroundType: "COLOR" as const,
    backgroundColor: selected.background,
  };
}
