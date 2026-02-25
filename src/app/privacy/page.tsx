"use client";

import Link from "next/link";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import { ArrowLeft, Shield } from "lucide-react";

const serif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-serif",
});

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

const LAST_UPDATED = "February 25, 2026";

export default function PrivacyPolicy() {
  return (
    <div
      className={`${sans.variable} ${serif.variable}`}
      style={{ fontFamily: "var(--font-sans), sans-serif" }}
    >
      <style>{`
        .legal-content h2 {
          font-family: var(--font-serif), serif;
          color: #2C1810;
          font-size: 1.5rem;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(193, 127, 78, 0.2);
        }
        .legal-content h3 {
          color: #2C1810;
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
        }
        .legal-content p {
          color: #4A3D34;
          line-height: 1.75;
          margin-bottom: 1rem;
        }
        .legal-content ul {
          color: #4A3D34;
          line-height: 1.75;
          margin-bottom: 1rem;
          padding-left: 1.5rem;
          list-style-type: disc;
        }
        .legal-content li {
          margin-bottom: 0.5rem;
        }
        .legal-content a {
          color: #C17F4E;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .legal-content a:hover {
          color: #A86B3D;
        }
        .legal-content strong {
          color: #2C1810;
          font-weight: 600;
        }
        .info-box {
          background: rgba(193, 127, 78, 0.06);
          border: 1px solid rgba(193, 127, 78, 0.15);
          border-radius: 0.75rem;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
        }
        .info-box p {
          margin-bottom: 0.25rem;
        }
        .back-link {
          transition: color 0.2s ease;
        }
        .back-link:hover {
          color: #C17F4E !important;
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────── */}
      <section
        className="relative px-6 sm:px-10 pt-8 pb-20"
        style={{ backgroundColor: "#1C1210" }}
      >
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="back-link inline-flex items-center gap-2 text-sm font-medium no-underline mb-12"
            style={{ color: "#8B7D6B" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Coffee Budget
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "rgba(193, 127, 78, 0.12)",
                border: "1px solid rgba(193, 127, 78, 0.2)",
              }}
            >
              <Shield className="w-5 h-5" style={{ color: "#C17F4E" }} />
            </div>
            <h1
              className="text-3xl sm:text-4xl"
              style={{
                fontFamily: "var(--font-serif), serif",
                color: "#F5F0EB",
              }}
            >
              Privacy Policy
            </h1>
          </div>

          <p className="text-sm" style={{ color: "#8B7D6B" }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* ── Content ────────────────────────────────────── */}
      <section
        className="px-6 sm:px-10 py-16"
        style={{ backgroundColor: "#F5F0EB" }}
      >
        <div className="max-w-3xl mx-auto legal-content">
          <p style={{ fontSize: "1.05rem" }}>
            At Coffee Budget, we take the protection of your personal data
            seriously. This Privacy Policy explains what data we collect, why we
            process it, who we share it with, and what rights you have under the
            General Data Protection Regulation (GDPR) and Italian data
            protection law (Legislative Decree 196/2003, as amended by
            Legislative Decree 101/2018).
          </p>

          {/* ── 1. Data Controller ─────────────────────── */}
          <h2>1. Data Controller</h2>
          <div className="info-box">
            <p>
              <strong>Coffee Budget</strong>
            </p>
            <p>
              Email:{" "}
              <a href="mailto:privacy@coffeebudget.app">
                privacy@coffeebudget.app
              </a>
            </p>
          </div>
          <p>
            The data controller is the person or entity responsible for
            determining the purposes and means of processing your personal data.
            For any questions regarding this policy or to exercise your rights,
            please contact us at the email address above.
          </p>

          {/* ── 2. Data We Collect ─────────────────────── */}
          <h2>2. What Data We Collect</h2>
          <p>
            We collect only the data necessary to provide and improve our
            service. We do not process any special categories of personal data
            (such as data revealing racial or ethnic origin, political opinions,
            religious beliefs, health data, or biometric data).
          </p>

          <h3>2.1 Identity &amp; Authentication Data</h3>
          <p>
            When you create an account, we receive your <strong>email address</strong> and{" "}
            <strong>name</strong> from Auth0, our authentication provider. We
            also store a unique user identifier to associate your data within our
            system.
          </p>

          <h3>2.2 Financial Data</h3>
          <p>You provide the following data when using the service:</p>
          <ul>
            <li>
              <strong>Transactions</strong> — amounts, descriptions, dates,
              types, and associated categories or tags
            </li>
            <li>
              <strong>Categories and tags</strong> — custom labels you create to
              organize transactions
            </li>
            <li>
              <strong>Expense plans</strong> — budgeting envelopes, contribution
              rules, and spending limits
            </li>
            <li>
              <strong>Income plans</strong> — income sources and distribution
              rules
            </li>
            <li>
              <strong>Payment accounts</strong> — bank account and credit card
              names and balances
            </li>
          </ul>

          <h3>2.3 Bank Connection Data</h3>
          <p>
            If you choose to connect your bank account via GoCardless (our Open
            Banking provider), we store connection identifiers needed to
            synchronize your transactions. Bank accounts are accessed in{" "}
            <strong>read-only mode</strong> — we cannot initiate payments or
            modify your accounts. Connection identifiers are encrypted at rest
            using AES-256-GCM encryption.
          </p>

          <h3>2.4 AI Processing Data</h3>
          <p>
            When AI-powered categorization is enabled, transaction descriptions
            may be sent to OpenAI for analysis. We send only the{" "}
            <strong>transaction description</strong> — no amounts, account
            numbers, or other personally identifiable information. OpenAI does
            not use this data to train their models.
          </p>

          <h3>2.5 Technical &amp; Usage Data</h3>
          <p>
            We collect minimal technical data required to operate the service:
          </p>
          <ul>
            <li>
              <strong>Session cookies</strong> — set by NextAuth.js for
              authentication (session token, CSRF token, callback URL)
            </li>
            <li>
              <strong>Sidebar preference</strong> — a cookie to remember your
              sidebar layout preference
            </li>
          </ul>
          <p>
            We do not use analytics cookies, advertising trackers, or any
            third-party tracking scripts.
          </p>

          {/* ── 3. Legal Bases ─────────────────────────── */}
          <h2>3. Why We Process Your Data</h2>
          <p>
            Under Article 6(1) of the GDPR, we process your data based on the
            following legal grounds:
          </p>
          <ul>
            <li>
              <strong>Contract performance</strong> (Art. 6.1.b) — Processing is
              necessary to provide you with the Coffee Budget service: storing
              transactions, managing budgets, synchronizing bank data, and
              categorizing expenses.
            </li>
            <li>
              <strong>Consent</strong> (Art. 6.1.a) — For optional features that
              require explicit consent, such as connecting your bank account via
              GoCardless or enabling AI-powered categorization. You can withdraw
              consent at any time.
            </li>
            <li>
              <strong>Legitimate interest</strong> (Art. 6.1.f) — For security
              measures such as duplicate detection, rate limiting, and
              protection against unauthorized access.
            </li>
          </ul>

          {/* ── 4. Third-Party Processors ──────────────── */}
          <h2>4. Third-Party Processors</h2>
          <p>
            We share your data with the following third-party service providers,
            each acting as a data processor on our behalf under a data
            processing agreement:
          </p>
          <ul>
            <li>
              <strong>Auth0</strong> (Okta, Inc.) — Authentication and identity
              management. Processes your email, name, and login credentials.
              Privacy policy:{" "}
              <a
                href="https://www.okta.com/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                okta.com/privacy-policy
              </a>
            </li>
            <li>
              <strong>GoCardless</strong> (GoCardless Ltd.) — Open Banking
              connection for automatic transaction synchronization. Processes
              bank account identifiers and transaction data. Privacy policy:{" "}
              <a
                href="https://gocardless.com/privacy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                gocardless.com/privacy
              </a>
            </li>
            <li>
              <strong>OpenAI</strong> (OpenAI, LLC) — AI-powered transaction
              categorization. Receives only transaction descriptions. Privacy
              policy:{" "}
              <a
                href="https://openai.com/policies/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                openai.com/policies/privacy-policy
              </a>
            </li>
            <li>
              <strong>Railway</strong> (Railway Corp.) — Cloud hosting
              infrastructure. All application data and databases are hosted on
              Railway servers. Privacy policy:{" "}
              <a
                href="https://railway.com/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                railway.com/legal/privacy
              </a>
            </li>
          </ul>
          <p>
            We do not sell, rent, or share your personal data with third parties
            for marketing or advertising purposes.
          </p>

          {/* ── 5. Data Retention ──────────────────────── */}
          <h2>5. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active
            and as needed to provide you with the service. Specifically:
          </p>
          <ul>
            <li>
              <strong>Account and financial data</strong> — Retained for the
              duration of your account. When you delete your account, all
              associated data is permanently removed within 30 days.
            </li>
            <li>
              <strong>Bank connection data</strong> — GoCardless connection
              tokens have a 90-day validity period and are refreshed
              automatically. When you disconnect a bank account, connection data
              is deleted immediately.
            </li>
            <li>
              <strong>Session data</strong> — Authentication cookies expire when
              your session ends or after the configured session duration.
            </li>
            <li>
              <strong>Backups</strong> — Database backups are retained for up to
              7 days and then automatically overwritten.
            </li>
          </ul>

          {/* ── 6. Data Security ───────────────────────── */}
          <h2>6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to
            protect your personal data:
          </p>
          <ul>
            <li>
              All data in transit is encrypted via <strong>TLS/SSL</strong>
            </li>
            <li>
              Sensitive fields (bank connection identifiers, provider
              configurations) are encrypted at rest using{" "}
              <strong>AES-256-GCM</strong>
            </li>
            <li>
              Database connections use <strong>SSL</strong> with connection
              pooling
            </li>
            <li>
              All data queries are <strong>isolated per user</strong> — you can
              only access your own data
            </li>
            <li>
              API endpoints are protected by <strong>rate limiting</strong> and{" "}
              <strong>JWT authentication</strong>
            </li>
            <li>
              Security headers are enforced via{" "}
              <strong>Helmet</strong> (HSTS, CSP, X-Frame-Options)
            </li>
          </ul>

          {/* ── 7. Cookies ─────────────────────────────── */}
          <h2>7. Cookies</h2>
          <p>
            Coffee Budget uses only <strong>strictly necessary cookies</strong>{" "}
            required for the application to function. We do not use analytics,
            advertising, or tracking cookies.
          </p>
          <ul>
            <li>
              <strong>__Secure-next-auth.session-token</strong> — Maintains your
              authenticated session
            </li>
            <li>
              <strong>__Secure-next-auth.callback-url</strong> — Stores the
              redirect URL during authentication
            </li>
            <li>
              <strong>__Secure-next-auth.csrf-token</strong> — Protects against
              cross-site request forgery attacks
            </li>
            <li>
              <strong>sidebar:state</strong> — Remembers your sidebar layout
              preference
            </li>
          </ul>
          <p>
            Since these cookies are strictly necessary for the service to
            function, they do not require consent under the ePrivacy Directive
            (2009/136/EC).
          </p>

          {/* ── 8. International Transfers ─────────────── */}
          <h2>8. International Data Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries outside
            the European Economic Area (EEA) through our third-party processors.
            Where such transfers occur, they are protected by:
          </p>
          <ul>
            <li>
              <strong>EU Standard Contractual Clauses</strong> (SCCs) approved
              by the European Commission, or
            </li>
            <li>
              <strong>Adequacy decisions</strong> by the European Commission for
              the receiving country
            </li>
          </ul>
          <p>
            OpenAI and Railway are based in the United States. Transfers to the
            US are covered under the EU-US Data Privacy Framework. Auth0 (Okta)
            and GoCardless maintain EU data processing capabilities.
          </p>

          {/* ── 9. Your Rights ─────────────────────────── */}
          <h2>9. Your Rights</h2>
          <p>
            Under the GDPR (Articles 15–22), you have the following rights
            regarding your personal data:
          </p>
          <ul>
            <li>
              <strong>Right of access</strong> (Art. 15) — Request a copy of all
              personal data we hold about you
            </li>
            <li>
              <strong>Right to rectification</strong> (Art. 16) — Request
              correction of inaccurate or incomplete data
            </li>
            <li>
              <strong>Right to erasure</strong> (Art. 17) — Request deletion of
              your personal data ("right to be forgotten")
            </li>
            <li>
              <strong>Right to restrict processing</strong> (Art. 18) — Request
              that we limit how we use your data
            </li>
            <li>
              <strong>Right to data portability</strong> (Art. 20) — Receive
              your data in a structured, commonly used, machine-readable format
              (JSON or CSV)
            </li>
            <li>
              <strong>Right to object</strong> (Art. 21) — Object to processing
              based on legitimate interest
            </li>
            <li>
              <strong>Right to withdraw consent</strong> — Where processing is
              based on consent, you can withdraw it at any time without affecting
              the lawfulness of prior processing
            </li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:privacy@coffeebudget.app">
              privacy@coffeebudget.app
            </a>
            . We will respond to your request within <strong>one month</strong>,
            as required by the GDPR.
          </p>
          <p>
            You also have the right to lodge a complaint with the Italian Data
            Protection Authority (Garante per la protezione dei dati personali)
            at{" "}
            <a
              href="https://www.garanteprivacy.it"
              target="_blank"
              rel="noopener noreferrer"
            >
              garanteprivacy.it
            </a>
            . However, we encourage you to contact us first so we can address
            your concern directly.
          </p>

          {/* ── 10. Children ───────────────────────────── */}
          <h2>10. Children</h2>
          <p>
            Coffee Budget is not intended for use by anyone under the age of 16.
            We do not knowingly collect personal data from children. If you
            believe that a child under 16 has provided us with personal data,
            please contact us so we can delete it.
          </p>

          {/* ── 11. Changes ────────────────────────────── */}
          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect
            changes in our practices or applicable law. When we make significant
            changes, we will notify you through the application or by email. The
            &ldquo;Last updated&rdquo; date at the top of this page indicates
            when the policy was last revised.
          </p>

          {/* ── 12. Contact ────────────────────────────── */}
          <h2>12. Contact</h2>
          <p>
            For any questions about this Privacy Policy or your personal data,
            please contact us:
          </p>
          <div className="info-box">
            <p>
              <strong>Coffee Budget — Privacy Inquiries</strong>
            </p>
            <p>
              Email:{" "}
              <a href="mailto:privacy@coffeebudget.app">
                privacy@coffeebudget.app
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer
        className="px-6 sm:px-10 py-10"
        style={{ backgroundColor: "#1C1210" }}
      >
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-medium no-underline"
            style={{ color: "#8B7D6B" }}
          >
            Coffee Budget
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm no-underline"
              style={{ color: "#C17F4E" }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm no-underline"
              style={{ color: "#8B7D6B" }}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
