import Image from "next/image";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/CookieBanner";

const links = [
  { label: "About", href: "/about" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Guides", href: "/guides" },
  { label: "Contact", href: "/contact" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

export function LaunchFooter() {
  return (
    <footer className="px-5 py-14 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1230px] flex-wrap items-start justify-between gap-6">
        <div>
          <Image
            src="/flowboc-launch/assets/flowboc-logo.png"
            alt="Flowboc"
            width={132}
            height={35}
            className="h-auto w-[132px]"
          />
          <p className="mt-3 text-sm leading-[1.9] text-[#a78bb0]">
            The business home for
            <br />
            independent yoga instructors.
          </p>
        </div>
        <div className="flex gap-7 text-sm text-[#9a7da5]">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-[#6355ff]">
              {l.label}
            </Link>
          ))}
        </div>
        <a href="#home" className="text-sm font-semibold text-[#272334] hover:text-[#6355ff]">
          Back to the beginning ↑
        </a>
      </div>
      <div className="mx-auto mt-10 flex w-full max-w-[1230px] flex-wrap items-center justify-between gap-3 border-t border-[#eadfec] pt-5 text-xs text-[#b69bbe]">
        <span>© 2026 Flowboc</span>
        <CookieSettingsButton className="hover:text-[#6355ff]" />
      </div>
    </footer>
  );
}
