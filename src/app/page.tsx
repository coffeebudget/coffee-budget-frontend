"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import {
  Wallet,
  Tag,
  Building2,
  Calculator,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  LogIn,
  ChevronDown,
} from "lucide-react";

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

const FEATURES = [
  {
    icon: Wallet,
    title: "Envelope Budgeting",
    desc: "Allocate money into virtual envelopes for bills, savings, and spending. See exactly where every euro goes.",
  },
  {
    icon: Tag,
    title: "Smart Categorization",
    desc: "AI-powered merchant recognition with keyword rules as fallback. Transactions categorize themselves — learning as you go.",
  },
  {
    icon: Building2,
    title: "Open Banking",
    desc: "Connect your bank accounts via GoCardless. Transactions sync automatically — no manual entry needed.",
  },
  {
    icon: Calculator,
    title: "Free to Spend",
    desc: "After bills and budgets are covered, see exactly what you can spend freely. Updated in real time.",
  },
  {
    icon: Sparkles,
    title: "AI Suggestions",
    desc: "Get intelligent expense plan recommendations based on your spending patterns and transaction history.",
  },
  {
    icon: ShieldCheck,
    title: "Duplicate Detection",
    desc: "Weighted similarity matching catches duplicate imports before they mess up your numbers.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Connect",
    desc: "Link your bank accounts or import transactions from CSV. Everything lands in one place.",
  },
  {
    num: "02",
    title: "Organize",
    desc: "Categories, tags, and smart keyword rules sort your transactions automatically.",
  },
  {
    num: "03",
    title: "Budget",
    desc: "Create envelopes, set spending limits, and watch your financial picture come together.",
  },
];

export default function Home() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <div
      className={`${sans.variable} ${serif.variable}`}
      style={{ fontFamily: "var(--font-sans), sans-serif" }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .anim-1 { animation: fadeInUp 0.8s ease-out 0.1s both; }
        .anim-2 { animation: fadeInUp 0.8s ease-out 0.25s both; }
        .anim-3 { animation: fadeInUp 0.8s ease-out 0.4s both; }
        .anim-4 { animation: fadeInUp 0.8s ease-out 0.55s both; }
        .anim-5 { animation: fadeInUp 0.8s ease-out 0.7s both; }
        .anim-6 { animation: fadeInUp 0.8s ease-out 0.85s both; }
        .anim-fade { animation: fadeIn 1s ease-out 1s both; }
        .scroll-bounce { animation: float 2.5s ease-in-out infinite; }

        .feature-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(28, 18, 16, 0.08);
        }

        .copper-btn {
          background: linear-gradient(135deg, #C17F4E, #A86B3D);
          transition: all 0.3s ease;
        }
        .copper-btn:hover {
          background: linear-gradient(135deg, #D18F5E, #B87B4D);
          box-shadow: 0 8px 30px rgba(193, 127, 78, 0.35);
          transform: translateY(-1px);
        }

        .ghost-btn {
          transition: all 0.3s ease;
          border: 1px solid rgba(193, 127, 78, 0.3);
        }
        .ghost-btn:hover {
          border-color: rgba(193, 127, 78, 0.6);
          background: rgba(193, 127, 78, 0.08);
        }

        .step-card {
          position: relative;
        }
        .step-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: #C17F4E;
          transition: width 0.4s ease;
        }
        .step-card:hover::after {
          width: 60%;
        }

        .pill-tag {
          transition: all 0.3s ease;
        }
        .pill-tag:hover {
          background: rgba(193, 127, 78, 0.15);
          border-color: rgba(193, 127, 78, 0.3);
        }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ backgroundColor: "#1C1210" }}
      >
        {/* Subtle radial glow */}
        <div
          className="absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(193,127,78,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(193,127,78,0.04) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-20 w-full">
          {/* Coffee icon */}
          <div className="anim-1 mb-10">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "rgba(193, 127, 78, 0.12)",
                border: "1px solid rgba(193, 127, 78, 0.2)",
              }}
            >
              <span className="text-2xl" role="img" aria-label="coffee">
                ☕
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1
            className="anim-2 text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight"
            style={{
              fontFamily: "var(--font-serif), serif",
              color: "#F5F0EB",
            }}
          >
            Coffee
            <br />
            Budget
          </h1>

          {/* Copper accent line */}
          <div
            className="anim-3 w-16 h-[2px] my-8"
            style={{ backgroundColor: "#C17F4E" }}
          />

          {/* Tagline */}
          <p
            className="anim-3 text-xl sm:text-2xl md:text-[1.65rem] max-w-lg leading-relaxed"
            style={{
              fontFamily: "var(--font-serif), serif",
              color: "#C9B9A8",
            }}
          >
            Your finances, brewed to perfection.
          </p>

          <p
            className="anim-4 text-base sm:text-lg mt-5 max-w-md leading-relaxed"
            style={{ color: "#8B7D6B" }}
          >
            Envelope budgeting, automatic bank sync, and AI&#8209;powered
            insights — in a tool that feels as good as your morning
            pour&#8209;over.
          </p>

          {/* CTA */}
          <div className="anim-5 mt-10 flex flex-col sm:flex-row gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="copper-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-white font-semibold text-base no-underline"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => signIn("auth0")}
                  className="copper-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-white font-semibold text-base cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <a
                  href="#features"
                  className="ghost-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-medium text-base no-underline"
                  style={{ color: "#C9B9A8" }}
                >
                  See what&rsquo;s inside
                  <ChevronDown className="w-4 h-4" />
                </a>
              </>
            )}
          </div>

          {/* Feature pills */}
          <div className="anim-6 mt-16 flex flex-wrap gap-3">
            {[
              "Envelope budgeting",
              "Open Banking sync",
              "AI suggestions",
              "1,350+ tests",
            ].map((label) => (
              <span
                key={label}
                className="pill-tag px-4 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: "rgba(193, 127, 78, 0.08)",
                  color: "#A89078",
                  border: "1px solid rgba(193, 127, 78, 0.15)",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#features"
          className="anim-fade scroll-bounce absolute bottom-10 left-1/2 -translate-x-1/2"
          aria-label="Scroll to features"
        >
          <ChevronDown className="w-6 h-6" style={{ color: "#5A4A3A" }} />
        </a>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section
        id="features"
        className="py-24 sm:py-32 px-6 sm:px-10"
        style={{ backgroundColor: "#F5F0EB" }}
      >
        <div className="max-w-5xl mx-auto">
          <p
            className="text-sm font-semibold tracking-[0.2em] uppercase mb-4"
            style={{ color: "#C17F4E" }}
          >
            Features
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl mb-6"
            style={{
              fontFamily: "var(--font-serif), serif",
              color: "#2C1810",
            }}
          >
            What&rsquo;s brewing inside
          </h2>
          <p
            className="text-lg mb-16 max-w-xl leading-relaxed"
            style={{ color: "#6B5D52" }}
          >
            Everything you need to understand, organize, and control your
            money — without the complexity of traditional finance apps.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="feature-card rounded-xl p-7"
                  style={{
                    backgroundColor: "#FFFDF9",
                    border: "1px solid rgba(44, 24, 16, 0.06)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center mb-5"
                    style={{ backgroundColor: "rgba(193, 127, 78, 0.1)" }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: "#C17F4E" }}
                    />
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: "#2C1810" }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-[0.94rem] leading-relaxed"
                    style={{ color: "#6B5D52" }}
                  >
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section
        className="py-24 sm:py-32 px-6 sm:px-10"
        style={{ backgroundColor: "#FAF7F4" }}
      >
        <div className="max-w-5xl mx-auto">
          <p
            className="text-sm font-semibold tracking-[0.2em] uppercase mb-4"
            style={{ color: "#C17F4E" }}
          >
            How it works
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl mb-16"
            style={{
              fontFamily: "var(--font-serif), serif",
              color: "#2C1810",
            }}
          >
            Three sips to clarity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {STEPS.map((step) => (
              <div key={step.num} className="step-card text-center pb-6">
                <span
                  className="text-5xl block mb-4"
                  style={{
                    fontFamily: "var(--font-serif), serif",
                    color: "rgba(193, 127, 78, 0.25)",
                  }}
                >
                  {step.num}
                </span>
                <h3
                  className="text-xl font-semibold mb-3"
                  style={{ color: "#2C1810" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-[0.94rem] leading-relaxed"
                  style={{ color: "#6B5D52" }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section
        className="relative py-24 sm:py-32 px-6 sm:px-10 overflow-hidden"
        style={{ backgroundColor: "#1C1210" }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(193,127,78,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl mb-6"
            style={{
              fontFamily: "var(--font-serif), serif",
              color: "#F5F0EB",
            }}
          >
            Start brewing your budget
          </h2>
          <p
            className="text-lg mb-10 max-w-md mx-auto leading-relaxed"
            style={{ color: "#8B7D6B" }}
          >
            Take control of your finances today.
            <br />
            Free to use. Set up in minutes.
          </p>

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="copper-btn inline-flex items-center gap-2 px-10 py-4 rounded-lg text-white font-semibold text-lg no-underline"
            >
              Open Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <button
              onClick={() => signIn("auth0")}
              className="copper-btn inline-flex items-center gap-2 px-10 py-4 rounded-lg text-white font-semibold text-lg cursor-pointer"
            >
              <LogIn className="w-5 h-5" />
              Get Started
            </button>
          )}

          <p className="mt-16 text-sm" style={{ color: "#5A4A3A" }}>
            Built with Next.js, NestJS &amp; PostgreSQL
          </p>
        </div>
      </section>
    </div>
  );
}
