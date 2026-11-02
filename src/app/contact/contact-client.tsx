"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Clock3, Flower2, Loader2, Mail } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { LaunchFooter } from "@/components/landing/launch/LaunchFooter";
import { Reveal, Section, Eyebrow } from "@/components/landing/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactEmail } from "@/lib/site";
import { submitContactForm } from "./actions";

const topics = [
  "Getting started",
  "Plans & billing",
  "Something isn’t working",
  "An idea to share",
];
const fieldClass = "h-12 rounded-xl border-primary/15 bg-background/50 px-4 shadow-none";

export function ContactClient() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [replyEmail, setReplyEmail] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const formData = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    try {
      const email = String(formData.get("email") ?? "").trim();
      const result = await submitContactForm({
        name: String(formData.get("name") ?? ""),
        email,
        subject,
        message,
      });
      if (result.ok) {
        setReplyEmail(email);
        setSent(true);
      } else {
        setError(result.error);
      }
    } catch {
      setError(
        "We couldn’t submit your message. Your details are still here. Please try again, or email us directly.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div id="home" className="min-h-screen overflow-x-clip bg-background">
      <Navbar />
      <main id="top">
        <Section className="pb-16 pt-10 sm:pt-14 lg:pb-24 lg:pt-20">
          <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <Reveal>
              <Eyebrow className="text-primary">A little conversation. A clear next step.</Eyebrow>
              <h1 className="mt-5 text-[2.75rem] leading-[1.06] tracking-tight sm:text-6xl">
                There’s room
                <br />
                <span className="display italic text-primary">for your questions.</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                Finding your feet, planning your next chapter, or sharing an idea? We’re here to
                help you feel at home on Flowboc.
              </p>
              <div className="mt-7 flex flex-col gap-4">
                <a
                  href={`mailto:${contactEmail}`}
                  className="group flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <Mail className="size-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-xs text-muted-foreground">
                      Prefer your own inbox?
                    </span>
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      {contactEmail}
                    </span>
                  </span>
                </a>
                <p className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Clock3 className="size-4" aria-hidden="true" />
                  </span>
                  We usually reply within one business day.
                </p>
              </div>
              <figure className="mt-9 hidden sm:block">
                <div className="relative aspect-[16/9] overflow-hidden rounded-t-[4rem] rounded-b-xl">
                  <Image
                    src="/flowboc-launch/assets/practice.jpg"
                    alt="A quiet moment of seated yoga practice in a sunlit room"
                    fill
                    sizes="(min-width: 1280px) 500px, (min-width: 1024px) 43vw, 100vw"
                    className="object-cover object-[center_60%]"
                  />
                </div>
                <figcaption className="mt-3 text-xs text-muted-foreground">
                  A little support. More space for your practice.
                </figcaption>
              </figure>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-[0_16px_60px_-30px_rgba(99,85,255,0.2)] sm:p-9">
                {sent ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex min-h-[480px] flex-col items-center justify-center py-8 text-center"
                  >
                    <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-7" aria-hidden="true" />
                    </span>
                    <Eyebrow className="mt-7 text-primary">You’re in the right place</Eyebrow>
                    <h2 className="mt-3 text-3xl">Your message is with us.</h2>
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      Thanks for reaching out. We’ve received your message and will reply to{" "}
                      <span className="break-all font-medium text-foreground">{replyEmail}</span>,
                      usually within one business day.
                    </p>
                    <Button asChild className="mt-7 gap-2">
                      <Link href="/">
                        Back to Flowboc <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <button
                      type="button"
                      className="mt-5 rounded text-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                      onClick={() => {
                        setSent(false);
                        setSubject("");
                        setMessage("");
                        setError("");
                      }}
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl sm:text-3xl">Let’s talk.</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          Tell us what’s on your mind. We’ll take it from here.
                        </p>
                      </div>
                      <Flower2
                        className="mt-1 size-8 shrink-0 text-primary/70"
                        strokeWidth={1.4}
                        aria-hidden="true"
                      />
                    </div>
                    <form
                      className="mt-7"
                      onSubmit={(e) => void handleSubmit(e)}
                      aria-label="Contact Flowboc"
                      aria-busy={pending}
                    >
                      <fieldset
                        disabled={pending}
                        className="min-w-0 space-y-5 disabled:opacity-70"
                      >
                        <legend className="sr-only">Your contact details and message</legend>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name">Your name</Label>
                            <Input
                              className={fieldClass}
                              id="name"
                              name="name"
                              autoComplete="name"
                              maxLength={200}
                              required
                              placeholder="What should we call you?"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                              className={fieldClass}
                              id="email"
                              name="email"
                              type="email"
                              autoComplete="email"
                              required
                              placeholder="you@example.com"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p id="topics-label" className="text-sm font-medium">
                            What can we help with?{" "}
                            <span className="font-normal text-muted-foreground">(optional)</span>
                          </p>
                          <div
                            role="group"
                            aria-labelledby="topics-label"
                            className="flex flex-wrap gap-2"
                          >
                            {topics.map((topic) => (
                              <button
                                key={topic}
                                type="button"
                                aria-pressed={subject === topic}
                                onClick={() => setSubject(subject === topic ? "" : topic)}
                                className={`rounded-full border px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${subject === topic ? "border-primary bg-primary text-primary-foreground" : "border-primary/15 bg-primary/5 text-muted-foreground hover:border-primary/40 hover:text-primary"}`}
                              >
                                {topic}
                              </button>
                            ))}
                          </div>
                          <Label htmlFor="subject" className="sr-only">
                            Subject (optional)
                          </Label>
                          <Input
                            className={fieldClass}
                            id="subject"
                            name="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            maxLength={200}
                            placeholder="Or write your own subject"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Your message</Label>
                          <Textarea
                            id="message"
                            name="message"
                            rows={6}
                            required
                            maxLength={5000}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="A question, a detail, an idea… start wherever you like."
                            className="min-h-40 resize-y rounded-xl border-primary/15 bg-background/50 p-4 shadow-none"
                            aria-describedby="message-help"
                          />
                          <div className="flex justify-between gap-4 text-xs text-muted-foreground">
                            <p id="message-help">
                              Please keep passwords and payment details private.
                            </p>
                            <span className="shrink-0 tabular-nums">
                              {message.length.toLocaleString()} / 5,000
                            </span>
                          </div>
                        </div>
                        {error && (
                          <p
                            role="alert"
                            className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
                          >
                            {error}
                          </p>
                        )}
                        <Button
                          type="submit"
                          size="lg"
                          className="w-full gap-2 rounded-xl"
                          disabled={pending}
                        >
                          {pending ? (
                            <>
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sending
                              your message…
                            </>
                          ) : (
                            <>
                              Send message <ArrowRight className="size-4" aria-hidden="true" />
                            </>
                          )}
                        </Button>
                        <p className="text-center text-xs leading-relaxed text-muted-foreground">
                          Your details stay with your enquiry. Read our{" "}
                          <Link
                            href="/privacy"
                            className="rounded underline underline-offset-2 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                          >
                            privacy policy
                          </Link>
                          .
                        </p>
                      </fieldset>
                    </form>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </Section>

        <Section className="border-y border-primary/10 bg-primary/5 py-12 lg:py-14">
          <div className="grid gap-7 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
            <Reveal>
              <Eyebrow className="text-primary">A helpful place to start</Eyebrow>
              <h2 className="mt-3 text-3xl">Before you send.</h2>
            </Reveal>
            <Reveal className="space-y-5">
              <div>
                <h3 className="text-lg">A question about a class you booked?</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  For class times, joining details, or cancellations, contact your instructor using
                  the details in your booking confirmation. For trouble using Flowboc, send us a
                  message here.
                </p>
              </div>
              <div className="border-t border-primary/15 pt-5">
                <h3 className="text-lg">Exploring Flowboc for your teaching?</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Tell us a little about your practice and what you need help with. You can also
                  find answers in our{" "}
                  <Link href="/#faq" className="text-primary underline underline-offset-4">
                    frequently asked questions
                  </Link>
                  .
                </p>
              </div>
            </Reveal>
          </div>
        </Section>
      </main>
      <LaunchFooter />
    </div>
  );
}
