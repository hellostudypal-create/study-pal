import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · Study Pal",
  description: "How Study Pal collects, uses and protects your information.",
};

const CONTACT_EMAIL = "hello.studypal@gmail.com";
const LAST_UPDATED = "27 September 2026";

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <p>
        This Privacy Policy explains how Study Pal (&quot;Study Pal&quot;, &quot;we&quot;,
        &quot;us&quot; or &quot;our&quot;) collects, uses, shares and protects information when you
        use our website at <a href="https://studypal.store">studypal.store</a>, our learning app,
        and our official social media channels, including TikTok (together, the
        &quot;Service&quot;). Study Pal is a language-learning and exam-preparation service based in
        Sri Lanka, offering Sinhala-to-English phrasebooks, vocabulary practice, question banks and
        quizzes.
      </p>
      <p>
        By using the Service you agree to the practices described in this policy. If you do not
        agree, please do not use the Service.
      </p>

      <h2>1. Information we collect</h2>
      <h3>Information you give us</h3>
      <ul>
        <li>
          <strong>Account information:</strong> your email address, display name, an optional phone
          number, and your password. Passwords are stored only as a secure one-way hash; we never
          store or see your password in plain text.
        </li>
        <li>
          <strong>Learning content you create:</strong> vocabulary words, exam questions, answers,
          explanations, images you upload, and quizzes you build in your personal study banks.
        </li>
        <li>
          <strong>Purchase communications:</strong> when you contact us to buy a book or question
          bank (for example on WhatsApp or by email), we receive your name, phone number and the
          messages you send us, along with the details we need to confirm your payment.
        </li>
        <li>
          <strong>Support messages:</strong> anything you send us when you contact us for help.
        </li>
      </ul>

      <h3>Information collected automatically</h3>
      <ul>
        <li>
          <strong>Study activity:</strong> quiz attempts, answers, scores and progress, so the app
          can show your results and help you review.
        </li>
        <li>
          <strong>Technical data:</strong> basic information such as IP address, browser type,
          device type and request logs, recorded by our hosting provider for security and
          reliability.
        </li>
        <li>
          <strong>Cookies and local storage:</strong> we use essential cookies to keep you signed in
          and to remember preferences such as your language (English or Sinhala). We do not use
          advertising or cross-site tracking cookies.
        </li>
      </ul>

      <h3>Information from TikTok and other platforms</h3>
      <p>
        We use TikTok&apos;s developer tools (such as Login Kit and the Content Posting API) to
        publish Study Pal&apos;s own educational videos to our TikTok account and to understand how
        they perform. When a TikTok account is connected to our app, TikTok may share with us, with
        that account holder&apos;s permission:
      </p>
      <ul>
        <li>basic profile information (such as open ID, display name and avatar);</li>
        <li>
          the access permissions granted to our app, and the information needed to upload and
          publish videos to that account;
        </li>
        <li>public statistics about videos posted through our app (such as views and likes).</li>
      </ul>
      <p>
        We use this data only to publish and manage our educational content on TikTok. We do not
        sell it, use it for advertising, or combine it with other data to build profiles of TikTok
        users. You can revoke our app&apos;s access at any time in your TikTok settings under
        &quot;Security and permissions&quot; &gt; &quot;Manage app permissions&quot;. If you comment
        on or message our TikTok account, that information is processed by TikTok under{" "}
        <a href="https://www.tiktok.com/legal/privacy-policy" target="_blank" rel="noreferrer">
          TikTok&apos;s Privacy Policy
        </a>
        .
      </p>

      <h2>2. How we use your information</h2>
      <ul>
        <li>to create and manage your account and let you sign in;</li>
        <li>to provide study features such as phrasebooks, quizzes, progress tracking and read-aloud;</li>
        <li>to confirm purchases and unlock the books or question banks you have bought;</li>
        <li>
          to send service emails, such as account invitations and password resets (we do not send
          marketing emails without your consent);
        </li>
        <li>to respond to your questions and provide support;</li>
        <li>to publish and measure our educational content on social media platforms;</li>
        <li>to keep the Service secure, prevent abuse, and fix problems;</li>
        <li>to comply with legal obligations.</li>
      </ul>

      <h2>3. Read-aloud feature</h2>
      <p>
        The speaker icon on English phrases uses your browser&apos;s or device&apos;s built-in
        text-to-speech engine. The phrase text is processed on your device by your browser; Study
        Pal does not record your voice or collect any audio from you.
      </p>

      <h2>4. How we share information</h2>
      <p>We do not sell your personal information. We share it only with:</p>
      <ul>
        <li>
          <strong>Service providers</strong> who help us run the Service, such as website hosting,
          database hosting and email delivery providers, who may process data only on our
          instructions;
        </li>
        <li>
          <strong>Platforms you choose to interact with</strong>, such as WhatsApp or TikTok, under
          their own terms and privacy policies;
        </li>
        <li>
          <strong>Authorities</strong>, when required by law or to protect the rights, property or
          safety of Study Pal, our users or others;
        </li>
        <li>
          <strong>A successor business</strong>, if Study Pal is involved in a merger, acquisition
          or sale of assets, in which case this policy will continue to apply to your information.
        </li>
      </ul>

      <h2>5. Data retention</h2>
      <p>
        We keep your account information and learning content for as long as your account is
        active. If you ask us to delete your account, we delete or anonymise your personal
        information within 30 days, except where we must keep limited records (for example,
        purchase records) to meet legal or accounting obligations. Data received from TikTok is kept
        only as long as needed to publish and manage our content and is deleted when access is
        revoked or no longer needed.
      </p>

      <h2>6. Security</h2>
      <p>
        We use reasonable technical and organisational measures to protect your information,
        including encrypted HTTPS connections, hashed passwords and restricted access to our
        systems. No method of transmission or storage is completely secure, so we cannot guarantee
        absolute security.
      </p>

      <h2>7. Your rights and choices</h2>
      <p>Depending on where you live, you may have the right to:</p>
      <ul>
        <li>access the personal information we hold about you;</li>
        <li>correct inaccurate information (you can update your name and email on your Account page);</li>
        <li>ask us to delete your account and personal information;</li>
        <li>object to or restrict certain processing, or withdraw consent you have given;</li>
        <li>receive a copy of your information in a portable format.</li>
      </ul>
      <p>
        To make a request, email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We
        respond within 30 days. Sri Lankan users have rights under the Personal Data Protection Act,
        No. 9 of 2022.
      </p>

      <h2>8. Children</h2>
      <p>
        Study Pal is a general learning tool. Children under 13 may use the Service only with the
        involvement and consent of a parent or guardian, who creates and manages the account. We do
        not knowingly collect personal information from children under 13 without such consent. If
        you believe a child has given us information without consent, contact us and we will delete
        it.
      </p>

      <h2>9. International transfers</h2>
      <p>
        Our service providers may store and process information on servers outside Sri Lanka. When
        this happens, we take reasonable steps to make sure your information remains protected in
        line with this policy.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. When we do, we will change the &quot;Last
        updated&quot; date above and, for significant changes, notify you in the app or by email.
      </p>

      <h2>11. Contact us</h2>
      <p>
        If you have questions about this policy or your information, contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      <p>
        See also our <Link href="/terms">Terms of Service</Link>.
      </p>
    </>
  );
}
