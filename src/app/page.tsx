"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
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
    <div>
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

        .float-card-1 { animation: fadeInUp 0.8s ease-out 0.5s both, floatCard1 3s ease-in-out 1.3s infinite; }
        .float-card-2 { animation: fadeInUp 0.8s ease-out 0.7s both, floatCard2 3.5s ease-in-out 1.5s infinite; }
        .float-card-3 { animation: fadeInUp 0.8s ease-out 0.9s both, floatCard3 4s ease-in-out 1.7s infinite; }

        @keyframes floatCard1 {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(-2deg); }
        }
        @keyframes floatCard2 {
          0%, 100% { transform: translateY(0) rotate(1deg); }
          50% { transform: translateY(-5px) rotate(1deg); }
        }
        @keyframes floatCard3 {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-4px) rotate(-1deg); }
        }

        .feature-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px var(--coffee-900-alpha-8);
        }

        .copper-btn {
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          transition: all 0.3s ease;
        }
        .copper-btn:hover {
          background: linear-gradient(135deg, var(--primary-light), var(--primary-mid));
          box-shadow: 0 8px 30px var(--primary-alpha-35);
          transform: translateY(-1px);
        }

        .ghost-btn {
          transition: all 0.3s ease;
          border: 1px solid var(--primary-alpha-30);
        }
        .ghost-btn:hover {
          border-color: var(--primary-alpha-60);
          background: var(--primary-alpha-8);
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
          background: var(--primary);
          transition: width 0.4s ease;
        }
        .step-card:hover::after {
          width: 60%;
        }

        .pill-tag {
          transition: all 0.3s ease;
        }
        .pill-tag:hover {
          background: var(--primary-alpha-15);
          border-color: var(--primary-alpha-30);
        }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ backgroundColor: "var(--coffee-900)" }}
      >
        {/* Subtle radial glow */}
        <div
          className="absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, var(--primary-alpha-8) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, var(--primary-alpha-4) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-20 w-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-center">
          <div>
          {/* Coffee icon */}
          <div className="anim-1 mb-10">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "var(--primary-alpha-12)",
                border: "1px solid var(--primary-alpha-20)",
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
            style={{ color: "var(--coffee-100)" }}
          >
            Coffee
            <br />
            Budget
          </h1>

          {/* Copper accent line */}
          <div
            className="anim-3 w-16 h-[2px] my-8"
            style={{ backgroundColor: "hsl(var(--primary))" }}
          />

          {/* Tagline */}
          <p
            className="anim-3 font-serif text-xl sm:text-2xl md:text-[1.65rem] max-w-lg leading-relaxed"
            style={{ color: "var(--coffee-150)" }}
          >
            Your finances, brewed to perfection.
          </p>

          <p
            className="anim-4 text-base sm:text-lg mt-5 max-w-md leading-relaxed"
            style={{ color: "var(--coffee-300)" }}
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
                  style={{ color: "var(--coffee-150)" }}
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
                  backgroundColor: "var(--primary-alpha-8)",
                  color: "var(--coffee-200)",
                  border: "1px solid var(--primary-alpha-15)",
                }}
              >
                {label}
              </span>
            ))}
          </div>
          </div>

          {/* Floating cards - visible on lg+ */}
          <div className="hidden lg:flex relative h-[500px]">
            {/* Card 1: Free to Spend */}
            <div
              className="float-card-1 absolute top-4 left-8 w-56 rounded-xl p-5"
              style={{
                backgroundColor: "var(--coffee-800)",
                border: "1px solid var(--primary-alpha-15)",
                boxShadow: "0 8px 32px rgba(28, 18, 16, 0.3)",
                transform: "rotate(-2deg)",
              }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: "var(--coffee-300)" }}>
                Free to Spend
              </p>
              <p className="text-2xl font-bold mb-3" style={{ color: "var(--coffee-100)" }}>
                €1,245
              </p>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--primary-alpha-10)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: "68%", backgroundColor: "var(--success)" }}
                />
              </div>
            </div>

            {/* Card 2: Envelope Budget */}
            <div
              className="float-card-2 absolute top-36 left-20 w-56 rounded-xl p-5"
              style={{
                backgroundColor: "var(--coffee-800)",
                border: "1px solid var(--primary-alpha-15)",
                boxShadow: "0 8px 32px rgba(28, 18, 16, 0.3)",
                transform: "rotate(1deg)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🛒</span>
                <p className="text-xs font-medium" style={{ color: "var(--coffee-300)" }}>
                  Groceries
                </p>
              </div>
              <p className="text-lg font-bold mb-3" style={{ color: "var(--coffee-100)" }}>
                €245{" "}
                <span className="text-sm font-normal" style={{ color: "var(--coffee-300)" }}>
                  / €400
                </span>
              </p>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--primary-alpha-10)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: "61%", backgroundColor: "hsl(var(--primary))" }}
                />
              </div>
            </div>

            {/* Card 3: Savings Goal */}
            <div
              className="float-card-3 absolute top-72 left-4 w-56 rounded-xl p-5"
              style={{
                backgroundColor: "var(--coffee-800)",
                border: "1px solid var(--primary-alpha-15)",
                boxShadow: "0 8px 32px rgba(28, 18, 16, 0.3)",
                transform: "rotate(-1deg)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🏖️</span>
                <p className="text-xs font-medium" style={{ color: "var(--coffee-300)" }}>
                  Vacation Fund
                </p>
              </div>
              <p className="text-lg font-bold mb-3" style={{ color: "var(--coffee-100)" }}>
                €1,800{" "}
                <span className="text-sm font-normal" style={{ color: "var(--coffee-300)" }}>
                  / €3,000
                </span>
              </p>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--primary-alpha-10)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: "60%", backgroundColor: "hsl(var(--primary))" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#features"
          className="anim-fade scroll-bounce absolute bottom-10 left-1/2 -translate-x-1/2"
          aria-label="Scroll to features"
        >
          <ChevronDown className="w-6 h-6" style={{ color: "var(--coffee-500)" }} />
        </a>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section
        id="features"
        className="py-24 sm:py-32 px-6 sm:px-10"
        style={{ backgroundColor: "var(--coffee-100)" }}
      >
        <div className="max-w-5xl mx-auto">
          <p
            className="text-sm font-semibold tracking-[0.2em] uppercase mb-4"
            style={{ color: "hsl(var(--primary))" }}
          >
            Features
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl mb-6"
            style={{ color: "var(--coffee-800)" }}
          >
            What&rsquo;s brewing inside
          </h2>
          <p
            className="text-lg mb-16 max-w-xl leading-relaxed"
            style={{ color: "var(--coffee-400)" }}
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
                    backgroundColor: "var(--coffee-25)",
                    border: "1px solid var(--coffee-900-alpha-6)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center mb-5"
                    style={{ backgroundColor: "var(--primary-alpha-10)" }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: "hsl(var(--primary))" }}
                    />
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: "var(--coffee-800)" }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-[0.94rem] leading-relaxed"
                    style={{ color: "var(--coffee-400)" }}
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
        style={{ backgroundColor: "var(--coffee-50)" }}
      >
        <div className="max-w-5xl mx-auto">
          <p
            className="text-sm font-semibold tracking-[0.2em] uppercase mb-4"
            style={{ color: "hsl(var(--primary))" }}
          >
            How it works
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl mb-16"
            style={{ color: "var(--coffee-800)" }}
          >
            Three sips to clarity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {STEPS.map((step) => (
              <div key={step.num} className="step-card text-center pb-6">
                <span
                  className="text-5xl font-serif block mb-4"
                  style={{ color: "var(--primary-alpha-25)" }}
                >
                  {step.num}
                </span>
                <h3
                  className="text-xl font-semibold mb-3"
                  style={{ color: "var(--coffee-800)" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-[0.94rem] leading-relaxed"
                  style={{ color: "var(--coffee-400)" }}
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
        style={{ backgroundColor: "var(--coffee-900)" }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, var(--primary-alpha-8) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl mb-6"
            style={{ color: "var(--coffee-100)" }}
          >
            Start brewing your budget
          </h2>
          <p
            className="text-lg mb-10 max-w-md mx-auto leading-relaxed"
            style={{ color: "var(--coffee-300)" }}
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

          <p className="mt-16 text-sm" style={{ color: "var(--coffee-500)" }}>
            Built with Next.js, NestJS &amp; PostgreSQL
          </p>

          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/privacy"
              className="text-sm no-underline"
              style={{ color: "var(--coffee-500)" }}
            >
              Privacy Policy
            </Link>
            <span style={{ color: "var(--coffee-700)" }}>·</span>
            <Link
              href="/terms"
              className="text-sm no-underline"
              style={{ color: "var(--coffee-500)" }}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
