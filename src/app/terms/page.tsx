import type { Metadata } from "next";
import { LegalLayout } from "@/components/landing/LegalLayout";
import { supportEmail } from "@/lib/site";

const title = "Terms of Service — Flowboc";
const description = "The terms that govern your use of Flowboc.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image" },
};

const sections = [
  {
    heading: "1. Acceptance of terms",
    body: (
      <p>
        By creating a Flowboc account or using our booking pages, you agree to these Terms of
        Service and our Privacy Policy. If you don&apos;t agree, please don&apos;t use Flowboc.
      </p>
    ),
  },
  {
    heading: "2. Who can use Flowboc",
    body: (
      <p>
        You must be at least 18 years old and able to form a binding contract to create an
        instructor account. You&apos;re responsible for the accuracy of the information on your
        profile and booking page, and for keeping your login credentials secure.
      </p>
    ),
  },
  {
    heading: "3. Your account and content",
    body: (
      <p>
        You keep ownership of the content you add to your Flowboc page — your bio, photos, class
        descriptions, and branding. You&apos;re responsible for making sure you have the right to
        use anything you upload, and for the classes and services you offer through the platform.
      </p>
    ),
  },
  {
    heading: "4. Subscriptions and billing",
    body: (
      <p>
        Paid plans are billed on a recurring basis until cancelled. You can cancel anytime from your
        account settings; cancellation takes effect at the end of your current billing period. Fees
        are non-refundable except where required by law.
      </p>
    ),
  },
  {
    heading: "5. Payments to instructors",
    body: (
      <p>
        Flowboc facilitates payments between you and your students through our third-party payment
        processor. Payouts are subject to the processor&apos;s own terms and standard processing
        times, and Flowboc is not a party to the underlying transaction between you and your
        students.
      </p>
    ),
  },
  {
    heading: "6. Referral program",
    body: (
      <p>
        Instructors who join the Flowboc Referral Program earn 20% commission on the paid
        subscription of each instructor they refer, for as long as that referral remains a paying
        subscriber. Commissions are calculated on the subscription amount actually paid (excluding
        taxes and refunds), accrue as referred accounts are billed, and are paid out monthly once
        the minimum payout threshold is met. Flowboc may adjust the commission rate, payout
        threshold, or eligibility criteria going forward, and will not retroactively reduce
        commission already earned on existing referrals. Self-referrals and fraudulent sign-ups are
        not eligible for commission.
      </p>
    ),
  },
  {
    heading: "7. Acceptable use",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Don&apos;t use Flowboc for anything illegal or to mislead your students</li>
        <li>Don&apos;t attempt to disrupt, reverse-engineer, or abuse the platform</li>
        <li>Don&apos;t use Flowboc to send spam or unsolicited communications</li>
        <li>Don&apos;t misrepresent your identity or impersonate someone else</li>
      </ul>
    ),
  },
  {
    heading: "8. Termination",
    body: (
      <p>
        You can close your account at any time. We may suspend or terminate accounts that violate
        these terms, with notice where reasonably possible. On termination, your public booking page
        will no longer be accessible to students.
      </p>
    ),
  },
  {
    heading: "9. Disclaimers and limitation of liability",
    body: (
      <p>
        Flowboc is provided &quot;as is&quot; without warranties of any kind. To the extent
        permitted by law, Flowboc is not liable for indirect, incidental, or consequential damages
        arising from your use of the platform, including disputes between you and your students.
      </p>
    ),
  },
  {
    heading: "10. Changes to these terms",
    body: (
      <p>
        We may update these terms from time to time. We&apos;ll notify you of material changes by
        email or through a notice on Flowboc before they take effect. Continuing to use Flowboc
        after a change takes effect means you accept the updated terms.
      </p>
    ),
  },
  {
    heading: "11. Contact us",
    body: (
      <p>
        Questions about these terms? Reach us at{" "}
        <a href={`mailto:${supportEmail}`} className="text-clay hover:underline">
          {supportEmail}
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      updated="August 12, 2026"
      intro="These terms govern your access to and use of Flowboc. Please read them carefully — they cover subscriptions, payments, the referral program, and what we each can expect from one another."
      sections={sections}
    />
  );
}
