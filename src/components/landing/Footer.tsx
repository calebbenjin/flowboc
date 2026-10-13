import Link from "next/link";
import { Instagram, Youtube, Music2 } from "lucide-react";
import Image from "next/image";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#product" },
      { label: "Pricing", href: "/#pricing" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Referral Program", href: "/referral-program" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Help Center", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-sand/40 px-5 py-16 sm:px-8">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Image
            src="/flowboc-brand-logo.png"
            width={100}
            height={100}
            alt="Flowboc Logo"
            className="h-6 w-auto"
          />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Simple booking software for independent yoga instructors.
          </p>
          <div className="mt-5 flex gap-2">
            {[Instagram, Music2, Youtube].map((Icon, i) => (
              <span
                key={i}
                className="grid size-11 place-items-center rounded-full border border-border bg-card text-muted-foreground"
              >
                <Icon className="size-4" />
              </span>
            ))}
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-medium">{col.title}</p>
            <ul className="mt-3 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 w-full max-w-[1200px] border-t border-border pt-6 text-sm text-muted-foreground">
        © 2026 Flowboc. All rights reserved.
      </div>
    </footer>
  );
}
