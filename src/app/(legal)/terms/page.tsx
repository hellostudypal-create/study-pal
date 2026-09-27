import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service · Study Pal",
  description: "The terms that govern your use of Study Pal.",
};

const CONTACT_EMAIL = "hello.studypal@gmail.com";
const LAST_UPDATED = "27 September 2026";

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of Study Pal (&quot;Study
        Pal&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;), including our website at{" "}
        <a href="https://studypal.store">studypal.store</a>, our learning app, and the content we
        publish on our official social media channels, including TikTok (together, the
        &quot;Service&quot;). By creating an account or using the Service, you agree to these Terms
        and to our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the
        Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        Study Pal is a language-learning and exam-preparation service. It offers Sinhala-to-English
        phrasebooks, vocabulary practice, question banks, quizzes, progress tracking and related
        educational videos. Some content is free; other content (such as full phrasebooks and
        premium question banks) is available for purchase.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <ul>
        <li>
          You must be at least 13 years old to create an account. Users under 18 should use the
          Service with the permission of a parent or guardian, and children under 13 may use it
          only through an account created and managed by a parent or guardian.
        </li>
        <li>You must provide accurate information and keep it up to date.</li>
        <li>
          You are responsible for keeping your password secure and for all activity under your
          account. Tell us immediately at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if
          you suspect unauthorised use.
        </li>
        <li>Accounts are personal; do not share, sell or transfer your account.</li>
      </ul>

      <h2>3. Purchases and access</h2>
      <ul>
        <li>
          Prices are shown in Sri Lankan Rupees (LKR) on the store. To buy a book or question bank,
          you contact us (for example on WhatsApp) and complete payment using the method we provide.
          Once payment is confirmed, we unlock the item on your account.
        </li>
        <li>
          A purchase gives you a personal, non-exclusive, non-transferable licence to access the
          content through your Study Pal account for your own study. Some access may be
          time-limited; if so, the duration is stated at the time of purchase.
        </li>
        <li>
          Because digital content is available immediately after it is unlocked, purchases are
          generally non-refundable. If you were charged in error or cannot access content you paid
          for, contact us within 14 days and we will fix the problem or refund you.
        </li>
        <li>We may change prices at any time, but changes do not affect purchases already confirmed.</li>
      </ul>

      <h2>4. Your content</h2>
      <p>
        You can add your own vocabulary words, questions, answers, explanations and images to
        personal study banks (&quot;Your Content&quot;). You keep ownership of Your Content. You
        give us a limited licence to store, process and display Your Content only as needed to
        provide the Service to you. You are responsible for Your Content and confirm that you have
        the right to upload it and that it does not infringe anyone else&apos;s rights or break any
        law.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>copy, resell, redistribute, publicly share or scrape paid content or our phrasebooks;</li>
        <li>share login details or give others access to content you purchased;</li>
        <li>upload unlawful, harmful, hateful, obscene or infringing material;</li>
        <li>
          try to break, overload or gain unauthorised access to the Service, other accounts or our
          systems;
        </li>
        <li>use automated tools to access the Service without our written permission;</li>
        <li>use the Service for any illegal purpose.</li>
      </ul>
      <p>We may remove content or suspend or close accounts that break these rules.</p>

      <h2>6. Our intellectual property</h2>
      <p>
        The Service, including our phrasebooks, translations, explanations, question banks, videos,
        designs, logos and the &quot;Study Pal&quot; name, belongs to Study Pal or our licensors and
        is protected by copyright and other laws. Apart from the rights expressly given in these
        Terms, no rights are transferred to you.
      </p>

      <h2>7. Social media and third-party services</h2>
      <p>
        We publish educational videos on TikTok and other platforms and may use their developer
        tools to do so. Your use of those platforms, and any interaction with our content there, is
        governed by that platform&apos;s own terms and policies, including{" "}
        <a href="https://www.tiktok.com/legal/terms-of-service" target="_blank" rel="noreferrer">
          TikTok&apos;s Terms of Service
        </a>
        . The Service may also link to third-party services such as WhatsApp. We are not
        responsible for third-party services or their content.
      </p>

      <h2>8. Educational content disclaimer</h2>
      <p>
        We work hard to make our translations, pronunciations and explanations accurate, and
        phrases are reviewed before they are published. However, language is nuanced, and content
        is provided for learning purposes only. We do not guarantee that it is error-free or that
        using the Service will lead to any particular exam result. The read-aloud feature uses your
        device&apos;s text-to-speech engine, and pronunciation may vary between devices.
      </p>

      <h2>9. Availability and changes</h2>
      <p>
        We may update, change or discontinue parts of the Service at any time. We try to keep the
        Service available but do not promise it will be uninterrupted or free of errors.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the Service and ask us to delete your account at any time by emailing{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We may suspend or end your access
        if you seriously or repeatedly break these Terms, or if required by law. Sections that by
        their nature should continue after termination (such as intellectual property, disclaimers
        and limitation of liability) will continue to apply.
      </p>

      <h2>11. Disclaimer of warranties</h2>
      <p>
        To the extent permitted by law, the Service is provided &quot;as is&quot; and &quot;as
        available&quot;, without warranties of any kind, whether express or implied, including
        warranties of merchantability, fitness for a particular purpose and non-infringement.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        To the extent permitted by law, Study Pal will not be liable for any indirect, incidental,
        special or consequential damages, or for loss of data, profits or opportunities, arising
        from your use of the Service. Our total liability for any claim relating to the Service is
        limited to the amount you paid us in the 12 months before the claim. Nothing in these Terms
        limits liability that cannot be limited by law.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Democratic Socialist Republic of Sri Lanka. Any
        disputes will be handled by the courts of Sri Lanka, unless the consumer laws of your
        country give you the right to bring a claim where you live.
      </p>

      <h2>14. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. We will change the &quot;Last updated&quot;
        date above and, for significant changes, notify you in the app or by email. If you keep
        using the Service after changes take effect, you accept the updated Terms.
      </p>

      <h2>15. Contact us</h2>
      <p>
        Questions about these Terms? Email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
