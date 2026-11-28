"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  BookOpen,
  Check,
  Lock,
  Mail,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  SageClassCard,
  SageOfferCard,
  SageProfileHeader,
  SageSocialLinks,
} from "@/components/public/SageTheme";
import type { PublicClass } from "@/lib/public-page-layout";
import styles from "./HeroBookingDemo.module.css";

type DemoOffer = "class" | "call" | "ebook";
const offers = {
  class: { title: "Morning Flow", price: "$28", image: "/demo/morning-mats.jpg" },
  call: { title: "Private practice", price: "$70", image: "/demo/home-studio-stretch.jpg" },
  ebook: { title: "Your daily yoga guide", price: "$18", image: null },
};
const durations = [8000, 6500, 4500, 5000];
const demoClass: PublicClass = {
  id: "hero-demo",
  seriesId: null,
  recurringLabel: null,
  name: "Morning Flow",
  coverUrl: "/demo/morning-mats.jpg",
  description: null,
  startAt: new Date("2026-11-02T06:00:00Z"),
  timezone: "Africa/Lagos",
  durationMinutes: 60,
  mode: "ONLINE",
  location: null,
  price: 28,
  originalPrice: null,
  capacity: 12,
  spots: 8,
};
const theme = {
  "--public-heading": "var(--font-fraunces), Georgia, serif",
  "--public-body": "var(--font-dm-sans), sans-serif",
  "--theme": "#3e4935",
  "--theme-on": "#ffffff",
} as CSSProperties;

export function HeroBookingDemo({
  staticPreview = false,
  mood,
  activeStep,
  onStepChange,
}: {
  activeStep?: number;
  onStepChange?: (step: number) => void;
  staticPreview?: boolean;
  mood?: { page: string; bg: string };
} = {}) {
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [internalStep, setInternalStep] = useState(0);
  const step = activeStep ?? internalStep;
  const setStep = useCallback(
    (next: number) => {
      if (activeStep === undefined) setInternalStep(next);
      onStepChange?.(next);
    },
    [activeStep, onStepChange],
  );
  const [selectedOffer, setSelectedOffer] = useState<DemoOffer>("class");
  const [sessionTime, setSessionTime] = useState("07:00");
  const [guideOpen, setGuideOpen] = useState(false);
  const offer = offers[selectedOffer];
  const stages = [
    "Explore the page",
    selectedOffer === "call" ? "Choose a time" : "Your details",
    "Payment",
    selectedOffer === "ebook" ? "Your guide is ready" : "You’re booked",
  ];
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = staticPreview || prefersReducedMotion;
  const root = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? false),
      {
        threshold: 0.25,
      },
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion || !visible) return;
    const timer = window.setTimeout(() => setStep((step + 1) % 4), durations[step]);
    return () => window.clearTimeout(timer);
  }, [step, playing, reducedMotion, visible, setStep]);

  useEffect(() => {
    screen.current?.scrollTo({ top: 0 });
  }, [step]);

  function goTo(next: number) {
    setPlaying(false);
    setStep(next);
  }
  const advance = () => goTo(Math.min(step + 1, 3));
  function startOffer(kind: DemoOffer) {
    setSelectedOffer(kind);
    setGuideOpen(false);
    goTo(1);
  }

  return (
    <div
      ref={root}
      className={styles["demo"]}
      aria-label="Interactive student booking demonstration"
    >
      {/* <div className="text-sm text-[#272334] mb-4 lg:mb-6 text-center">
        <span>{staticPreview ? "YOUR PUBLIC PAGE" : "THE STUDENT EXPERIENCE"}</span>
      </div> */}
      <div className={styles["phone"]}>
        <div className={styles["status"]} aria-hidden="true">
          <span>9:41</span>
          <span className={styles["island"]} />
          <span>5G ▰</span>
        </div>
        {/* <div className={styles["address"]}>
          <Lock size={10} /> flowboc.com/sarah-yoga
        </div> */}
        <div
          ref={screen}
          onFocusCapture={() => setPlaying(false)}
          className={styles["screen"]}
          style={{ ...theme, ...(mood ? { "--theme": mood.page } : {}) } as CSSProperties}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: reducedMotion ? 0 : 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reducedMotion ? 0 : -12 }}
              transition={{ duration: reducedMotion ? 0 : 0.3 }}
            >
              {step === 0 ? (
                <div
                  className={`sage-page public-personalized ${styles["sage"]}`}
                  inert={staticPreview || undefined}
                  style={mood ? { background: mood.bg } : undefined}
                >
                  <SageProfileHeader
                    instructor={{
                      name: "Sarah Boone",
                      photoUrl: "/demo/sarah-boone.jpg",
                      bio: "Mindful movement. A little space for you.",
                      coverImageUrl: null,
                      socials: [],
                    }}
                  />
                  <div className={styles["socials"]}>
                    <SageSocialLinks
                      preview
                      compact
                      socials={[
                        { platform: "instagram", handle: "sarah-yoga" },
                        { platform: "youtube", handle: "sarah-yoga" },
                        { platform: "facebook", handle: "sarah-yoga" },
                      ]}
                    />
                  </div>
                  <div className={styles["classes"]}>
                    <button
                      type="button"
                      className={`sage-link-row ${styles["newsletter"]}`}
                      aria-expanded={newsletterOpen}
                      onClick={() => {
                        setPlaying(false);
                        setNewsletterOpen(!newsletterOpen);
                      }}
                    >
                      <Mail size={14} />
                      <span>Join my newsletter</span>
                      <ArrowRight size={14} />
                    </button>
                    {newsletterOpen && (
                      <form
                        className={styles["newsletterForm"]}
                        onSubmit={(event) => {
                          event.preventDefault();
                          setSubscribed(true);
                        }}
                      >
                        {subscribed ? (
                          <p role="status">You’re on the list! This is a demo signup.</p>
                        ) : (
                          <>
                            <label htmlFor="hero-newsletter-email">
                              Get updates on new classes and openings.
                            </label>
                            <input
                              id="hero-newsletter-email"
                              type="email"
                              placeholder="Your email address"
                              required
                            />
                            <button type="submit">Subscribe</button>
                            <p>Demo only · Your email is not saved.</p>
                          </>
                        )}
                      </form>
                    )}

                    <p className={styles["eyebrow"]}>Upcoming classes</p>
                    <div
                      onClickCapture={(event) => {
                        if ((event.target as HTMLElement).closest("a")) {
                          event.preventDefault();
                          event.stopPropagation();
                          startOffer("class");
                        }
                      }}
                    >
                      <SageClassCard
                        c={demoClass}
                        slug="sarah-yoga-demo"
                        currency="USD"
                        onWaitlist={false}
                        onJoinWaitlist={() => {}}
                      />
                    </div>
                    <div className={styles["offers"]}>
                      <SageOfferCard
                        kind="call"
                        title="Private practice"
                        description="A 60-minute online session, tailored to your pace and goals."
                        imageUrl="/demo/home-studio-stretch.jpg"
                        price={70}
                        currency="USD"
                        available
                        onClick={() => startOffer("call")}
                      />
                      <SageOfferCard
                        kind="ebook"
                        title="Your daily yoga guide"
                        description="Simple sequences and breathing practices to keep."
                        imageUrl={null}
                        price={18}
                        currency="USD"
                        available
                        onClick={() => startOffer("ebook")}
                      />
                    </div>
                    <p className={styles["pageFooter"]}>A little movement goes a long way.</p>
                  </div>
                </div>
              ) : (
                <div className={styles["checkout"]}>
                  <button className={styles["back"]} onClick={() => goTo(step - 1)}>
                    <ArrowLeft size={13} /> {step === 1 ? "Sarah’s page" : "Back"}
                  </button>
                  <div className={styles["summary"]}>
                    {offer.image ? (
                      <img src={offer.image} alt="" />
                    ) : (
                      <BookOpen size={32} aria-hidden="true" />
                    )}
                    <div>
                      <h3>{offer.title}</h3>
                      {selectedOffer === "ebook" ? (
                        <p>Digital ebook · PDF guide</p>
                      ) : (
                        <>
                          <p>
                            Mon, 2 Nov ·{" "}
                            {selectedOffer === "call" && sessionTime === "10:00" ? "10:00" : "7:00"}{" "}
                            AM WAT
                          </p>
                          <p>
                            {selectedOffer === "call" ? "1:1 online session" : "Online"} · 60
                            minutes
                          </p>
                        </>
                      )}
                    </div>
                    <strong>{offer.price}</strong>
                  </div>
                  <div className={styles["pills"]}>
                    {["Your details", "Payment", "Confirmed"].map((label, index) => (
                      <span key={label} data-active={step === index + 1}>
                        {index + 1}. {label}
                      </span>
                    ))}
                  </div>
                  {step === 1 && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        advance();
                      }}
                    >
                      <p className={styles["hint"]}>
                        No account needed — just your details to{" "}
                        {selectedOffer === "ebook" ? "receive your guide" : "confirm your booking"}.
                      </p>
                      {selectedOffer === "call" && (
                        <fieldset className={styles["timeSlots"]}>
                          <legend>Choose a time · Monday, 2 November (WAT)</legend>
                          {[
                            ["07:00", "7:00 AM"],
                            ["10:00", "10:00 AM"],
                          ].map(([value, label]) => (
                            <label key={value}>
                              <input
                                type="radio"
                                name="demo-session-time"
                                value={value}
                                checked={sessionTime === value}
                                onChange={() => setSessionTime(value!)}
                              />
                              {label}
                            </label>
                          ))}
                        </fieldset>
                      )}
                      <label>
                        Full name
                        <input
                          autoComplete="off"
                          aria-label="Demo full name"
                          defaultValue="Amara Okafor"
                        />
                      </label>
                      <label>
                        Email
                        <input
                          type="email"
                          autoComplete="off"
                          aria-label="Demo email"
                          defaultValue="amara@example.com"
                        />
                      </label>
                      <label>
                        Phone number
                        <input
                          type="tel"
                          autoComplete="off"
                          aria-label="Demo phone number"
                          defaultValue="+234 803 000 0000"
                        />
                      </label>
                      <label className={styles["optin"]}>
                        <input type="checkbox" /> Send me class updates and news from this
                        instructor.
                      </label>
                      <button className={styles["cta"]} type="submit">
                        Continue to payment <ArrowRight size={14} />
                      </button>
                    </form>
                  )}
                  {step === 2 && (
                    <div className={styles["payment"]}>
                      <h3>
                        {selectedOffer === "ebook"
                          ? "Your practice, wherever you are."
                          : "One more step to your mat."}
                      </h3>
                      <div className={styles["total"]}>
                        <span>{offer.title}</span>
                        <strong>{offer.price}</strong>
                      </div>
                      <p className={styles["hint"]}>
                        <Lock size={13} /> You’ll be redirected to Paystack’s secure checkout to pay
                        — Flowboc never sees your card details.
                      </p>
                      <button className={styles["cta"]} onClick={advance}>
                        Pay {offer.price} <ArrowRight size={14} />
                      </button>
                      <p className={styles["safe"]}>Demo payment · No charge is made</p>
                    </div>
                  )}
                  {step === 3 && (
                    <div className={styles["confirmed"]}>
                      <span className={styles["check"]}>
                        <Check size={30} />
                      </span>
                      <h3>
                        {selectedOffer === "ebook" ? "Your guide is ready!" : "You’re booked!"}
                      </h3>
                      <p>
                        {selectedOffer === "ebook"
                          ? "Your daily yoga guide is yours to keep."
                          : `Your ${selectedOffer === "call" ? "1:1 session" : "place in Morning Flow"} is confirmed.`}
                      </p>
                      <div className={styles["receipt"]}>
                        {selectedOffer === "ebook" ? (
                          <BookOpen size={21} />
                        ) : (
                          <CalendarDays size={21} />
                        )}
                        <div>
                          <strong>
                            {selectedOffer === "ebook" ? offer.title : "Monday, 2 November"}
                          </strong>
                          <p>
                            {selectedOffer === "ebook"
                              ? "Digital ebook · PDF guide"
                              : `${selectedOffer === "call" && sessionTime === "10:00" ? "10:00" : "7:00"} AM WAT · Online`}
                          </p>
                        </div>
                      </div>
                      <p>
                        {selectedOffer === "ebook"
                          ? "Your download link arrives by email."
                          : "Your confirmation and session details arrive by email."}
                      </p>
                      {selectedOffer === "ebook" && (
                        <>
                          <button
                            className={styles["cta"]}
                            onClick={() => setGuideOpen(!guideOpen)}
                            aria-expanded={guideOpen}
                          >
                            <BookOpen size={14} />{" "}
                            {guideOpen ? "Close preview" : "Preview your guide"}
                          </button>
                          {guideOpen && (
                            <div className={styles["guidePreview"]}>
                              <h4>A moment to begin</h4>
                              <p>
                                Sit comfortably. Relax your shoulders. Take five slow breaths, then
                                gently move through cat–cow and a seated stretch.
                              </p>
                              <p>Example excerpt · Demo guide</p>
                            </div>
                          )}
                        </>
                      )}
                      <p className={styles["safe"]}>
                        Demo only · No purchase or booking was created.
                      </p>
                      <button className={styles["cta"]} onClick={() => goTo(0)}>
                        <RotateCcw size={14} /> Try it again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className={styles["homeIndicator"]} aria-hidden="true" />
      </div>
      {/* {!staticPreview && (
        <div className={styles["controls"]}>
          <div className={styles["steps"]}>
            {stages.map((label, index) => (
              <button
                key={label}
                aria-label={`Show step ${index + 1}: ${label}`}
                aria-current={step === index ? "step" : undefined}
                onClick={() => goTo(index)}
              >
                {index < step ? <Check size={13} /> : index + 1}
              </button>
            ))}
          </div>
          <span className={styles["caption"]}>{stages[step]}</span>
          <button
            className={styles["play"]}
            aria-label={playing && !reducedMotion ? "Pause demo" : "Play demo"}
            onClick={() => {
              if (reducedMotion) {
                goTo((step + 1) % 4);
              } else setPlaying(!playing);
            }}
          >
            {playing && !reducedMotion ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      )}
      <p className={styles["disclaimer"]}>
        {staticPreview
          ? "Example public page · Sage Pro theme"
          : "Interactive demo · Example bookings & purchases"}
      </p> */}
    </div>
  );
}
