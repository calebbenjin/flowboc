"use client";

import { useState, type FormEvent } from "react";
import { Check, Mail, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Reveal, Section, Eyebrow } from "@/components/landing/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactClient() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Navbar />
      <main>
        <Section className="pb-14 pt-16 lg:pb-20 lg:pt-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow className="justify-center">Contact</Eyebrow>
              <h1 className="mt-4 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
                We&apos;d love to <span className="display italic text-clay">hear from you.</span>
              </h1>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Question about Flowbuk, feedback on the product, or just want to say hi? Send us a
                message and we&apos;ll get back to you within a day.
              </p>
            </div>
          </Reveal>
        </Section>

        <Section className="pt-0">
          <Reveal>
            <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_1.3fr]">
              <div className="space-y-4">
                <div className="surface flex items-start gap-4 p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-clay/12 text-clay">
                    <Mail className="size-5" />
                  </span>
                  <div>
                    <p className="font-medium">Email us</p>
                    <a
                      href="mailto:hello@flowbuk.com"
                      className="text-sm text-clay hover:underline"
                    >
                      hello@flowbuk.com
                    </a>
                  </div>
                </div>
                <div className="surface flex items-start gap-4 p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-clay/12 text-clay">
                    <MessageCircle className="size-5" />
                  </span>
                  <div>
                    <p className="font-medium">Response time</p>
                    <p className="text-sm text-muted-foreground">
                      We usually reply within one business day.
                    </p>
                  </div>
                </div>
              </div>

              <div className="surface p-6">
                {sent ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <span className="grid size-12 place-items-center rounded-full bg-success/12 text-success">
                      <Check className="size-6" />
                    </span>
                    <p className="mt-4 font-medium">Message sent</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Thanks for reaching out — we&apos;ll get back to you soon.
                    </p>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" required placeholder="Your name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" required placeholder="you@example.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="What's this about?" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" rows={5} required placeholder="How can we help?" />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" variant="clay">
                        Send message
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </Reveal>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
