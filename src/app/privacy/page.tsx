import type { Metadata } from "next";
import { LegalLayout } from "@/components/landing/LegalLayout";

const title = "Privacy Policy — Flowbuk";
const description = "How Flowbuk collects, uses, and protects your information.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image" },
};

const sections = [
  {
    heading: "1. Information we collect",
    body: (
      <>
        <p>
          When you create a Flowbuk account, we collect the information you give us directly — your
          name, email address, phone number, and any profile details you add to your public booking
          page (bio, location, photo, social links).
        </p>
        <p>
          When students book a class through your Flowbuk page, we collect the booking details they
          provide — name, email, and payment information, which is processed by our third-party
          payment provider and never stored on our own servers.
        </p>
        <p>
          We also collect basic usage data automatically — pages visited, device and browser type,
          and general location — to help us understand how Flowbuk is used and to fix problems.
        </p>
      </>
    ),
  },
  {
    heading: "2. How we use your information",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>To operate your account and your public booking page</li>
        <li>To process bookings and payments between you and your students</li>
        <li>To send account, booking, and billing notifications</li>
        <li>To provide customer support when you contact us</li>
        <li>To improve Flowbuk and understand how it&apos;s used</li>
        <li>To detect and prevent fraud or abuse of the platform</li>
      </ul>
    ),
  },
  {
    heading: "3. How we share information",
    body: (
      <p>
        We don&apos;t sell your personal information. We share it only with the service providers
        that help us run Flowbuk — such as payment processors, email delivery, and hosting
        infrastructure — and only to the extent needed for them to provide that service. We may also
        share information if required by law.
      </p>
    ),
  },
  {
    heading: "4. Cookies",
    body: (
      <p>
        We use cookies and similar technologies to keep you signed in, remember your preferences,
        and understand how Flowbuk is used. You can control cookies through your browser settings,
        though some parts of Flowbuk may not work properly without them.
      </p>
    ),
  },
  {
    heading: "5. Data retention",
    body: (
      <p>
        We keep your information for as long as your account is active, or as long as needed to
        provide our services, comply with legal obligations, and resolve disputes. You can request
        deletion of your account and associated data at any time.
      </p>
    ),
  },
  {
    heading: "6. Your rights",
    body: (
      <p>
        Depending on where you live, you may have the right to access, correct, export, or delete
        the personal information we hold about you. To exercise any of these rights, contact us and
        we&apos;ll respond within a reasonable timeframe.
      </p>
    ),
  },
  {
    heading: "7. Security",
    body: (
      <p>
        We use industry-standard measures to protect your information, including encryption in
        transit. No method of storage or transmission is completely secure, but we work to
        continuously improve how we protect your data.
      </p>
    ),
  },
  {
    heading: "8. Children's privacy",
    body: (
      <p>
        Flowbuk is not directed at children under 16, and we do not knowingly collect personal
        information from them.
      </p>
    ),
  },
  {
    heading: "9. Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. If we make material changes, we&apos;ll let you
        know by email or through a notice on Flowbuk before the change takes effect.
      </p>
    ),
  },
  {
    heading: "10. Contact us",
    body: (
      <p>
        Questions about this policy or your data? Reach us at{" "}
        <a href="mailto:privacy@flowboc.com" className="text-clay hover:underline">
          privacy@flowboc.com
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="August 12, 2026"
      intro="This policy explains what information Flowbuk collects, how we use it, and the choices you have. It applies to instructors using Flowbuk to manage their business and to students booking classes through a Flowbuk page."
      sections={sections}
    />
  );
}
