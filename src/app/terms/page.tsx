"use client";

import Link from "next/link";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import { ArrowLeft, FileText } from "lucide-react";

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

export default function TermsOfService() {
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
              <FileText className="w-5 h-5" style={{ color: "#C17F4E" }} />
            </div>
            <h1
              className="text-3xl sm:text-4xl"
              style={{
                fontFamily: "var(--font-serif), serif",
                color: "#F5F0EB",
              }}
            >
              Terms of Service
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
            Welcome to Coffee Budget. By accessing or using our service, you
            agree to be bound by these Terms of Service. Please read them
            carefully before using the application.
          </p>

          {/* ── 1. Description of Service ──────────────── */}
          <h2>1. Description of Service</h2>
          <p>
            Coffee Budget is a personal finance application designed to help you
            track income and expenses, manage budgets through virtual envelopes,
            and gain insights into your spending habits. The service includes:
          </p>
          <ul>
            <li>Manual and automatic transaction tracking</li>
            <li>Expense plan management with envelope budgeting</li>
            <li>Income planning and distribution</li>
            <li>AI-powered transaction categorization</li>
            <li>
              Bank account synchronization via Open Banking (GoCardless)
            </li>
            <li>CSV import and export of financial data</li>
          </ul>
          <p>
            Coffee Budget is intended for <strong>personal use only</strong> by
            natural persons to manage their personal finances. It is not a
            financial institution, does not provide financial advice, and should
            not be used as a substitute for professional financial planning.
          </p>

          {/* ── 2. Account ─────────────────────────────── */}
          <h2>2. Account Registration</h2>
          <p>
            To use Coffee Budget, you must create an account through our
            authentication provider (Auth0). By registering, you agree to:
          </p>
          <ul>
            <li>Provide accurate and up-to-date information</li>
            <li>
              Maintain the security of your account credentials
            </li>
            <li>
              Notify us immediately of any unauthorized access to your account
            </li>
            <li>
              Accept responsibility for all activity that occurs under your
              account
            </li>
          </ul>
          <p>
            You must be at least <strong>16 years old</strong> to use Coffee
            Budget. By creating an account, you confirm that you meet this age
            requirement.
          </p>

          {/* ── 3. Use of Service ──────────────────────── */}
          <h2>3. Acceptable Use</h2>
          <p>You agree to use Coffee Budget only for lawful purposes. You must not:</p>
          <ul>
            <li>
              Use the service for any illegal activity, including money
              laundering or fraud
            </li>
            <li>
              Attempt to gain unauthorized access to the service, other
              accounts, or our systems
            </li>
            <li>
              Interfere with or disrupt the service or its infrastructure
            </li>
            <li>
              Reverse-engineer, decompile, or attempt to extract the source code
              of the application
            </li>
            <li>
              Use automated tools (bots, scrapers) to access the service without
              our prior written consent
            </li>
            <li>
              Upload malicious content, viruses, or harmful code
            </li>
          </ul>

          {/* ── 4. Bank Connection ─────────────────────── */}
          <h2>4. Bank Connection</h2>
          <p>
            Coffee Budget offers optional bank account synchronization through
            GoCardless, a licensed Account Information Service Provider (AISP)
            regulated by the Financial Conduct Authority (FCA).
          </p>
          <ul>
            <li>
              Bank connections are entirely <strong>optional</strong> — the
              service is fully functional without them
            </li>
            <li>
              We access your bank accounts in <strong>read-only mode</strong>{" "}
              only — we cannot initiate payments, transfers, or modify your
              accounts in any way
            </li>
            <li>
              By connecting your bank, you authorize GoCardless to retrieve your
              transaction data on our behalf, subject to GoCardless&apos;s own{" "}
              <a
                href="https://gocardless.com/legal/"
                target="_blank"
                rel="noopener noreferrer"
              >
                terms and conditions
              </a>
            </li>
            <li>
              You can disconnect your bank account at any time, which will
              immediately stop data synchronization and delete stored connection
              identifiers
            </li>
            <li>
              Bank connection tokens have a <strong>90-day validity</strong> and
              must be re-authorized by you to continue synchronization
            </li>
          </ul>
          <p>
            Coffee Budget is not responsible for outages, errors, or delays in
            the bank synchronization service provided by GoCardless or your
            financial institution.
          </p>

          {/* ── 5. AI Features ─────────────────────────── */}
          <h2>5. AI-Powered Features</h2>
          <p>
            Coffee Budget uses artificial intelligence to provide transaction
            categorization suggestions and expense plan recommendations. These
            features are powered by OpenAI.
          </p>
          <ul>
            <li>
              AI features are <strong>optional</strong> and can be disabled
            </li>
            <li>
              AI suggestions are provided as-is and may not always be accurate —
              you should review and confirm categorizations
            </li>
            <li>
              Only transaction descriptions are sent to the AI provider — no
              amounts, account numbers, or personal identifiers
            </li>
            <li>
              AI-generated suggestions do not constitute financial advice
            </li>
          </ul>

          {/* ── 6. Your Data ───────────────────────────── */}
          <h2>6. Your Content &amp; Data</h2>
          <p>
            You retain full ownership of all data you enter into Coffee Budget,
            including transactions, categories, tags, expense plans, and any
            other content you create.
          </p>
          <ul>
            <li>
              You can export your data at any time in standard formats (JSON,
              CSV)
            </li>
            <li>
              You can request deletion of all your data by deleting your account
            </li>
            <li>
              We do not claim any ownership or license over your financial data
            </li>
          </ul>
          <p>
            For details on how we process your personal data, please refer to
            our{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>

          {/* ── 7. Intellectual Property ───────────────── */}
          <h2>7. Intellectual Property</h2>
          <p>
            All rights, title, and interest in Coffee Budget — including the
            application code, design, logos, and documentation — are owned by
            the operator of Coffee Budget. You may not:
          </p>
          <ul>
            <li>
              Copy, modify, or create derivative works based on the application
            </li>
            <li>
              Use our name, logo, or branding without prior written permission
            </li>
            <li>
              Remove or alter any proprietary notices in the application
            </li>
          </ul>

          {/* ── 8. Service Availability ────────────────── */}
          <h2>8. Service Availability</h2>
          <p>
            We strive to keep Coffee Budget available at all times, but we do
            not guarantee uninterrupted access. The service may be temporarily
            unavailable due to:
          </p>
          <ul>
            <li>Scheduled or emergency maintenance</li>
            <li>Infrastructure provider outages</li>
            <li>Force majeure events beyond our control</li>
          </ul>
          <p>
            The service is provided <strong>&ldquo;as is&rdquo;</strong> and{" "}
            <strong>&ldquo;as available&rdquo;</strong> without warranties of
            any kind, express or implied, including but not limited to
            warranties of merchantability, fitness for a particular purpose, or
            non-infringement.
          </p>

          {/* ── 9. Limitation of Liability ─────────────── */}
          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Coffee Budget and
            its operator shall not be liable for:
          </p>
          <ul>
            <li>
              Any indirect, incidental, special, consequential, or punitive
              damages
            </li>
            <li>
              Loss of profits, data, or business opportunities arising from your
              use of the service
            </li>
            <li>
              Errors or inaccuracies in transaction data, categorization, or
              budget calculations
            </li>
            <li>
              Actions taken based on information provided by the service —
              Coffee Budget is not a financial advisor
            </li>
            <li>
              Third-party service interruptions (GoCardless, Auth0, OpenAI)
            </li>
          </ul>
          <p>
            Nothing in these terms excludes or limits liability that cannot be
            excluded under applicable law, including liability for fraud or
            gross negligence.
          </p>

          {/* ── 10. Termination ────────────────────────── */}
          <h2>10. Termination</h2>
          <p>
            You may terminate your account at any time by requesting account
            deletion. Upon termination:
          </p>
          <ul>
            <li>
              All your personal data, transactions, and associated content will
              be permanently deleted within 30 days
            </li>
            <li>
              Any active bank connections will be disconnected immediately
            </li>
            <li>
              This action is irreversible — we cannot recover deleted data
            </li>
          </ul>
          <p>
            We reserve the right to suspend or terminate your account if you
            violate these Terms, engage in fraudulent activity, or if required by
            law. In such cases, we will notify you in advance whenever possible.
          </p>

          {/* ── 11. Changes ────────────────────────────── */}
          <h2>11. Changes to These Terms</h2>
          <p>
            We may modify these Terms of Service from time to time. When we make
            material changes, we will notify you through the application or by
            email at least <strong>30 days before</strong> the changes take
            effect. Your continued use of the service after the effective date
            constitutes acceptance of the updated terms.
          </p>
          <p>
            If you do not agree to the updated terms, you may terminate your
            account before the changes take effect.
          </p>

          {/* ── 12. Governing Law ──────────────────────── */}
          <h2>12. Governing Law &amp; Jurisdiction</h2>
          <p>
            These Terms are governed by and construed in accordance with the
            laws of <strong>Italy</strong> and the European Union, without
            regard to conflict of law principles.
          </p>
          <p>
            Any disputes arising from these Terms or your use of Coffee Budget
            shall be subject to the exclusive jurisdiction of the competent
            courts in Italy. If you are a consumer residing in the EU, you
            retain any mandatory consumer protection rights afforded by the laws
            of your country of residence.
          </p>
          <p>
            You may also use the European Commission&apos;s Online Dispute
            Resolution (ODR) platform at{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>

          {/* ── 13. Severability ───────────────────────── */}
          <h2>13. Severability</h2>
          <p>
            If any provision of these Terms is found to be invalid or
            unenforceable, the remaining provisions shall continue in full force
            and effect. The invalid provision shall be replaced with a valid one
            that most closely reflects the original intent.
          </p>

          {/* ── 14. Contact ────────────────────────────── */}
          <h2>14. Contact</h2>
          <p>
            For any questions about these Terms of Service, please contact us:
          </p>
          <div className="info-box">
            <p>
              <strong>Coffee Budget</strong>
            </p>
            <p>
              Email:{" "}
              <a href="mailto:support@coffeebudget.app">
                support@coffeebudget.app
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
              style={{ color: "#8B7D6B" }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm no-underline"
              style={{ color: "#C17F4E" }}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
