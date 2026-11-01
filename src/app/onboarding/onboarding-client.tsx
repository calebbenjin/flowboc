"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { upload } from "@vercel/blob/client";
import posthog from "posthog-js";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  ImagePlus,
  Leaf,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PayoutConnectForm } from "@/components/PayoutConnectForm";
import { PublicPagePreview } from "@/components/PublicPagePreview";
import { SagePreview } from "@/components/public/SagePreview";
import { compressImage } from "@/lib/compress-image";
import { currencies, payoutProviderInfo } from "@/lib/demo";
import { ONBOARDING_MOODS, type OnboardingMood } from "@/lib/onboarding-appearance";
import { payoutProviderForCurrency } from "@/lib/payout";
import { siteHost } from "@/lib/site";
import { checkSlugAvailable, completeOnboarding, saveProfile, skipOnboarding } from "./actions";
import type { CurrencyCode } from "@/generated/prisma/enums";
import styles from "./onboarding.module.css";

const specialties = [
  "Vinyasa",
  "Hatha",
  "Yin",
  "Ashtanga",
  "Restorative",
  "Breathwork",
  "Prenatal",
  "Beginners",
];
const steps = ["welcome", "basics", "story", "mood", "payout", "done"] as const;
type Step = (typeof steps)[number];
type Defaults = {
  name: string;
  location: string;
  bio: string;
  phone: string;
  instagram: string;
  specialties: string[];
  slug: string;
  currency: CurrencyCode;
  photoUrl: string | null;
  themeColor: string;
};
const copy: Record<Step, { title: string; body: string }> = {
  welcome: {
    title: "A little space for your teaching.",
    body: "Bring your practice, your people, and your plans together. Let’s make this space feel like you.",
  },
  basics: {
    title: "First, a little about you.",
    body: "Give your students a familiar name and a sense of the practice you share.",
  },
  story: {
    title: "Let your students meet you.",
    body: "A photo and a few words go a long way. Add them now or later, then choose the link your students will use.",
  },
  mood: { title: "Find your kind of calm.", body: "Choose a mood and see your page take shape." },
  payout: {
    title: "Where your earnings will arrive.",
    body: "Connect your payouts when you’re ready to accept paid bookings. You can also come back to this later.",
  },
  done: {
    title: "Your teaching space is ready.",
    body: "Now let’s give your students something to look forward to. Your dashboard will help you take the next step.",
  },
};

export function OnboardingClient({
  defaults,
  canCustomize,
}: {
  defaults: Defaults;
  canCustomize: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [profile, setProfile] = useState(defaults);
  const [previewDesign, setPreviewDesign] = useState<"pro" | "starter">("pro");
  const [mood, setMood] = useState<OnboardingMood>(
    () =>
      (Object.entries(ONBOARDING_MOODS).find(
        ([, value]) => value.color === defaults.themeColor,
      )?.[0] as OnboardingMood | undefined) ?? "violet",
  );
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    message: string | null;
    ok: boolean;
  }>({ checking: false, message: null, ok: true });
  const [pending, setPending] = useState(false);
  const [photoPending, setPhotoPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const checkedSlug = useRef(0);
  const reducedMotion = useReducedMotion();
  const index = steps.indexOf(step);
  const selected = ONBOARDING_MOODS[mood];
  const provider = payoutProviderForCurrency(profile.currency);
  const providerInfo = payoutProviderInfo[provider === "PAYSTACK" ? "paystack" : "stripe"];

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  function update<K extends keyof Defaults>(key: K, value: Defaults[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }
  function move(next: Step) {
    setError(null);
    setStep(next);
  }

  async function checkSlug() {
    const request = ++checkedSlug.current;
    setSlugStatus({ checking: true, message: null, ok: true });
    try {
      const result = await checkSlugAvailable(profile.slug);
      if (request === checkedSlug.current)
        setSlugStatus({
          checking: false,
          ok: result.available,
          message: result.available
            ? "This link is yours to use."
            : (result.reason ?? "Choose another link."),
        });
    } catch {
      if (request === checkedSlug.current)
        setSlugStatus({
          checking: false,
          ok: true,
          message: "We’ll check your link when you continue.",
        });
    }
  }

  async function saveAndContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === "basics") {
      move("story");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await saveProfile({
        ...profile,
        instagramHandle: profile.instagram,
        ...(step === "mood" && canCustomize ? { mood } : {}),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      move(step === "story" ? "mood" : "payout");
    } catch {
      setError("We couldn’t save your progress. Your details are still here — please try again.");
    } finally {
      setPending(false);
    }
  }

  async function finish() {
    setPending(true);
    setError(null);
    try {
      const result = await completeOnboarding();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (
        process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
        process.env["NEXT_PUBLIC_POSTHOG_HOST"]
      )
        posthog.capture("onboarding_completed");
      move("done");
    } catch {
      setError("We couldn’t finish setup. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function skip() {
    setPending(true);
    setError(null);
    try {
      const result = await skipOnboarding();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("We couldn’t open your dashboard. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function uploadPhoto(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP photo.");
      return;
    }
    setPhotoPending(true);
    setError(null);
    try {
      const compressed = await compressImage(file, { maxDimension: 1000 });
      const blob = await upload(compressed.name, compressed, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      update("photoUrl", blob.url);
      toast.success("Your photo is ready.");
    } catch {
      setError("We couldn’t upload your photo. Please try again, or add it later.");
    } finally {
      setPhotoPending(false);
    }
  }

  const emptyClasses = (
    <div className={styles["emptyClasses"]}>
      <Leaf size={22} aria-hidden="true" />
      <h4>No upcoming classes right now</h4>
      <p>Your classes will appear here when you’re ready to share them.</p>
    </div>
  );
  const proPreview = (
    <SagePreview
      instructor={{
        name: profile.name || "Your teaching space",
        photoUrl: profile.photoUrl,
        bio: profile.bio,
        themeColor: selected.color,
        backgroundType: "COLOR",
        backgroundColor: selected.background,
        pageTemplate: "SAGE",
        pageLayout: "CLASSIC",
        socials: profile.instagram ? [{ platform: "instagram", handle: profile.instagram }] : [],
      }}
      classes={[]}
      emptyState={emptyClasses}
      size="sm"
    />
  );
  const starterPreview = (
    <PublicPagePreview
      instructor={{
        name: profile.name || "Your teaching space",
        photoUrl: profile.photoUrl,
        bio: profile.bio,
        themeColor: profile.themeColor,
        pageTemplate: "STANDARD",
        pageLayout: "CLASSIC",
        socials: profile.instagram ? [{ platform: "instagram", handle: profile.instagram }] : [],
      }}
      classes={[]}
      emptyState={emptyClasses}
      showSampleClasses={false}
      size="sm"
    />
  );
  const preview = (
    <div className={styles["previewContent"]}>
      {!canCustomize && (
        <>
          <div className={styles["previewToggle"]} role="group" aria-label="Compare page designs">
            <button
              type="button"
              aria-pressed={previewDesign === "pro"}
              onClick={() => setPreviewDesign("pro")}
            >
              Pro preview
            </button>
            <button
              type="button"
              aria-pressed={previewDesign === "starter"}
              onClick={() => setPreviewDesign("starter")}
            >
              Your Starter page
            </button>
          </div>
          <p className={styles["previewLabel"]}>
            {previewDesign === "pro" ? "You’re previewing Pro" : "Included with Starter"}
          </p>
        </>
      )}
      {previewDesign === "pro" || canCustomize ? proPreview : starterPreview}
      {(previewDesign === "pro" || canCustomize) && (
        <fieldset className={styles["previewMoods"]}>
          <legend>Try a mood for your Pro page</legend>
          <div className={styles["moods"]}>
            {(Object.entries(ONBOARDING_MOODS) as [OnboardingMood, typeof selected][]).map(
              ([key, value]) => (
                <button
                  type="button"
                  key={key}
                  aria-pressed={mood === key}
                  onClick={() => {
                    setMood(key);
                    setPreviewDesign("pro");
                  }}
                  style={{ background: value.background }}
                >
                  <span style={{ background: value.color }}>
                    {mood === key && <Check size={16} />}
                  </span>
                  {value.label}
                </button>
              ),
            )}
          </div>
          <p className={styles["note"]}>
            {canCustomize
              ? "Included with your Pro design access. You can change it later."
              : "Try every colour. Your Starter public page keeps its standard design."}
          </p>
        </fieldset>
      )}
      {!canCustomize && (
        <p className={styles["previewDisclosure"]}>
          {previewDesign === "pro"
            ? "Your Starter page includes your profile and classes. Upgrade to keep this design."
            : "Your photo, bio, and class details carry over. Pro moods aren’t applied to this page."}
        </p>
      )}
    </div>
  );

  async function explorePro() {
    setPending(true);
    setError(null);
    try {
      const saved = await saveProfile({ ...profile, instagramHandle: profile.instagram });
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      const completed = await completeOnboarding();
      if (!completed.ok) {
        setError(completed.error);
        return;
      }
      if (
        process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
        process.env["NEXT_PUBLIC_POSTHOG_HOST"]
      ) {
        posthog.capture("onboarding_completed");
      }
      router.push(`/dashboard/billing?onboardingMood=${mood}`);
    } catch {
      setError("We couldn’t open plans. Your details are still here — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={styles["page"]}>
      <header className={styles["header"]}>
        <Link href="/" className={styles["logo"]} aria-label="Flowboc home">
          <Image src="/flowboc-brand-logo.png" alt="Flowboc" width={1439} height={379} priority />
        </Link>
        <span>Your teaching space, taking shape.</span>
      </header>
      <div className={styles["layout"]}>
        <div className={styles["main"]}>
          {step !== "welcome" && step !== "done" && (
            <nav className={styles["progress"]} aria-label="Setup progress">
              {["About you", "Your story", "Your mood", "Payouts"].map((label, i) => (
                <span
                  key={label}
                  aria-current={index === i + 1 ? "step" : undefined}
                  data-complete={index > i + 1}
                >
                  <span>{index > i + 1 ? <Check size={12} /> : i + 1}</span>
                  <small>{label}</small>
                </span>
              ))}
            </nav>
          )}
          <motion.section
            key={step}
            initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
          >
            {step === "done" && (
              <div className={styles["success"]}>
                <Check size={28} />
              </div>
            )}
            <p className={styles["eyebrow"]}>
              {step === "welcome"
                ? "Welcome to Flowboc"
                : step === "done"
                  ? "A lovely beginning"
                  : `Step ${index} of 4`}
            </p>
            <h1 ref={heading} tabIndex={-1} className={styles["title"]}>
              {copy[step].title}
            </h1>
            <p className={styles["intro"]}>{copy[step].body}</p>
            {error && (
              <p role="alert" className={styles["error"]}>
                {error}
              </p>
            )}
            {step === "welcome" && (
              <>
                <div className={styles["welcomePhoto"]}>
                  <Image
                    src="/demo/evening-candlelight.jpg"
                    alt="A peaceful yoga studio filled with warm light"
                    width={1200}
                    height={800}
                    priority
                  />
                  <span>A new chapter, at your pace.</span>
                </div>
                <div className={styles["actions"]}>
                  <Button
                    className={styles["primary"]}
                    onClick={() => move("basics")}
                    disabled={pending}
                  >
                    Let’s begin <ArrowRight size={16} />
                  </Button>
                  <Button variant="ghost" onClick={() => void skip()} disabled={pending}>
                    {pending ? "Opening…" : "I’ll explore first"}
                  </Button>
                </div>
                <p className={styles["note"]}>
                  Four small steps. You can finish the details later.
                </p>
              </>
            )}
            {["basics", "story", "mood"].includes(step) && (
              <form onSubmit={(event) => void saveAndContinue(event)} className={styles["form"]}>
                {step === "basics" && (
                  <>
                    <div>
                      <Label htmlFor="pname">What should students call you?</Label>
                      <Input
                        id="pname"
                        autoComplete="name"
                        value={profile.name}
                        onChange={(e) => update("name", e.target.value)}
                        required
                        maxLength={120}
                        placeholder="Your name or teaching name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="loc">
                        Where do you teach? <span className={styles["optional"]}>Optional</span>
                      </Label>
                      <Input
                        id="loc"
                        autoComplete="address-level2"
                        value={profile.location}
                        onChange={(e) => update("location", e.target.value)}
                        placeholder="Your city, or online"
                      />
                    </div>
                    <fieldset>
                      <legend>
                        Your kind of practice{" "}
                        <span className={styles["optional"]}>Choose a few</span>
                      </legend>
                      <div className={styles["specialties"]}>
                        {specialties.map((item) => (
                          <button
                            key={item}
                            type="button"
                            aria-pressed={profile.specialties.includes(item)}
                            onClick={() =>
                              update(
                                "specialties",
                                profile.specialties.includes(item)
                                  ? profile.specialties.filter((value) => value !== item)
                                  : [...profile.specialties, item],
                              )
                            }
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <div>
                      <Label htmlFor="cur">Currency for your classes</Label>
                      <select
                        id="cur"
                        value={profile.currency}
                        onChange={(e) => update("currency", e.target.value as CurrencyCode)}
                      >
                        {currencies.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.symbol} {item.code} — {item.label}
                          </option>
                        ))}
                      </select>
                      <p className={styles["note"]}>
                        Choose the currency you’ll charge students. Payout availability depends on
                        your currency and location.
                      </p>
                    </div>
                  </>
                )}
                {step === "story" && (
                  <>
                    <div className={styles["photoUpload"]}>
                      {profile.photoUrl ? (
                        <img src={profile.photoUrl} alt="Your profile photo" />
                      ) : (
                        <span>
                          <ImagePlus size={24} />
                        </span>
                      )}
                      <div>
                        <label htmlFor="profile-photo" className={styles["uploadLabel"]}>
                          {photoPending ? "Uploading your photo…" : "Add your photo"}
                        </label>
                        <input
                          id="profile-photo"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={photoPending || pending}
                          onChange={(e) => {
                            void uploadPhoto(e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                        <p className={styles["note"]}>JPG, PNG, or WebP. A familiar face helps.</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="bio">A few words about your teaching</Label>
                      <Textarea
                        id="bio"
                        rows={3}
                        value={profile.bio}
                        onChange={(e) => update("bio", e.target.value)}
                        maxLength={1500}
                        placeholder="I help people slow down, move mindfully, and find their own rhythm."
                      />
                    </div>
                    <div>
                      <Label htmlFor="ig">
                        Instagram <span className={styles["optional"]}>Optional</span>
                      </Label>
                      <Input
                        id="ig"
                        value={profile.instagram}
                        onChange={(e) => update("instagram", e.target.value)}
                        placeholder="@yourhandle"
                        autoCapitalize="none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">
                        Phone <span className={styles["optional"]}>Optional</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        value={profile.phone}
                        onChange={(e) => update("phone", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Your booking page link</Label>
                      <span className={styles["linkPrefix"]}>{siteHost}/</span>
                      <Input
                        id="slug"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        value={profile.slug}
                        onChange={(e) => {
                          ++checkedSlug.current;
                          update("slug", e.target.value.toLowerCase());
                          setSlugStatus({ checking: false, ok: true, message: null });
                        }}
                        onBlur={() => void checkSlug()}
                        required
                        aria-describedby="slug-status"
                      />
                      <p id="slug-status" className={styles["note"]} role="status">
                        {slugStatus.checking
                          ? "Checking your link…"
                          : (slugStatus.message ?? "One link for your students to find you.")}
                      </p>
                    </div>
                  </>
                )}
                {step === "mood" && (
                  <>
                    {!canCustomize && previewDesign === "pro" && (
                      <div className={styles["gentlePanel"]}>
                        <Leaf size={24} />
                        <h2>A feel for what’s possible.</h2>
                        <p>
                          You’re previewing the Sage Pro design. Your profile and classes are
                          included with Starter; this layout and mood colours require Pro.
                        </p>
                        <button
                          type="button"
                          className={styles["upgradeButton"]}
                          disabled={pending || photoPending}
                          onClick={() => void explorePro()}
                        >
                          Get this look with Pro <ArrowRight size={14} />
                        </button>
                        <p className={styles["note"]}>
                          We’ll save your profile and open plans. No payment starts here. You can
                          connect payouts later.
                        </p>
                      </div>
                    )}
                    <div className={styles["mobileMoodPreview"]}>{preview}</div>
                  </>
                )}
                {step !== "mood" && (
                  <details className={styles["mobilePreview"]}>
                    <summary>
                      <Eye size={16} /> Preview your page
                    </summary>
                    <div>{preview}</div>
                  </details>
                )}
                <div className={styles["actions"]}>
                  <Button
                    className={styles["primary"]}
                    type="submit"
                    disabled={pending || photoPending || (step === "story" && !slugStatus.ok)}
                  >
                    {pending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving…
                      </>
                    ) : (
                      <>
                        {step === "story"
                          ? "Save my story"
                          : step === "mood" && !canCustomize
                            ? "Continue with Starter"
                            : "Continue"}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pending || photoPending}
                    onClick={() =>
                      move(step === "basics" ? "welcome" : step === "story" ? "basics" : "story")
                    }
                  >
                    <ArrowLeft size={16} /> Back
                  </Button>
                </div>
              </form>
            )}
            {step === "payout" && (
              <div className={styles["form"]}>
                <div className={styles["gentlePanel"]}>
                  <Building2 size={24} />
                  <p>
                    {provider === "PAYSTACK"
                      ? `Your ${profile.currency} payouts connect through ${providerInfo.name}.`
                      : `Direct payouts for ${profile.currency} aren’t available yet. You can return here when support is available.`}
                  </p>
                </div>
                {provider === "PAYSTACK" && (
                  <PayoutConnectForm
                    currency={profile.currency}
                    instructorName={profile.name}
                    connectLabel={`Connect with ${providerInfo.name}`}
                    onConnected={() => void finish()}
                  />
                )}
                <div className={styles["actions"]}>
                  <Button
                    className={styles["primary"]}
                    disabled={pending}
                    onClick={() => void finish()}
                  >
                    {pending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "I’ll do this later"
                    )}
                  </Button>
                  <Button variant="ghost" disabled={pending} onClick={() => move("mood")}>
                    <ArrowLeft size={16} /> Back
                  </Button>
                </div>
              </div>
            )}
            {step === "done" && (
              <>
                <p className={styles["readyLink"]}>
                  {siteHost}/{profile.slug}
                </p>
                <div className={styles["actions"]}>
                  <Button asChild className={styles["primary"]}>
                    <Link href="/dashboard">
                      Step into my dashboard <ArrowRight size={16} />
                    </Link>
                  </Button>
                </div>
                <p className={styles["note"]}>
                  Your first class starts there. We’ll help you along.
                </p>
              </>
            )}
          </motion.section>
        </div>
        <aside className={styles["aside"]}>
          <div className={styles["previewHeading"]}>
            <Leaf size={16} /> Your space, taking shape
          </div>
          {preview}
          <p className={styles["previewNote"]}>
            {canCustomize
              ? "Your story now. Your first class next."
              : "Compare Pro with the page included in Starter."}
          </p>
        </aside>
      </div>
    </main>
  );
}
