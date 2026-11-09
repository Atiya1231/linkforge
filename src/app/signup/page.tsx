"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sign up failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-white text-[#1C1719] font-sans flex flex-col justify-between py-6 px-4 sm:px-8 selection:bg-[#76566F] selection:text-white">
      {/* Top Header / Navigation Bar */}
      <header className="mx-auto w-full max-w-5xl flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <BackButton fallbackHref="/" />
          <Link href="/" className="group flex items-center gap-2">
            <span className="font-serif text-xl sm:text-2xl font-black tracking-tight text-[#1C1719] transition">
              Link<span className="text-[#1C1719]">Forge</span>
            </span>
            <span className="hidden sm:inline-block border-l border-[#1C1719]/30 pl-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#1C1719]">
              URL Architecture
            </span>
          </Link>
        </div>

        <div className="text-xs text-[#1C1719]">
          <span>Already registered? </span>
          <Link
            href="/login"
            className="font-semibold text-[#1C1719] hover:underline underline-offset-2 transition"
          >
            Sign in →
          </Link>
        </div>
      </header>

      {/* Large Centered Authentication Card */}
      <div className="mx-auto w-full max-w-5xl my-auto">
        <div className="relative rounded-3xl border border-[#D8C5DC] bg-white shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
          
          {/* Overlapping Login / Sign In Toggle Positioned Between Both Panels (Desktop) */}
          <div className="hidden lg:flex absolute top-7 left-1/2 -translate-x-1/2 z-30">
            <div className="inline-flex rounded-full bg-white p-1.5 shadow-md border border-[#D8C5DC]">
              <Link
                href="/login"
                className="rounded-full px-6 py-2 text-xs font-semibold text-[#1C1719] hover:text-[#1C1719] transition"
              >
                Sign In
              </Link>
              <span className="rounded-full bg-[#76566F] px-6 py-2 text-xs font-semibold text-white shadow-xs cursor-default">
                Create Account
              </span>
            </div>
          </div>

          {/* Left Half: Colored Welcome Panel (#D9C5DC) with Centered "WELCOME!" */}
          <div className="lg:col-span-6 bg-[#D9C5DC] p-8 sm:p-12 lg:p-16 flex flex-col items-center justify-center text-center relative border-b lg:border-b-0 lg:border-r border-[#D9C5DC]">
            <div className="max-w-xs mx-auto">
              <span className="inline-block font-mono text-[11px] font-bold uppercase tracking-widest text-[#1C1719] mb-3">
                LinkForge Console
              </span>

              <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-[#1C1719]">
                WELCOME!
              </h1>

              <p className="mt-4 text-sm sm:text-base text-[#1C1719] leading-relaxed font-sans font-medium">
                Enter your personal details to begin your journey with precision URL architecture and custom short links on LinkForge.
              </p>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#1C1719]/20 bg-white/50 px-4 py-1.5 text-xs font-mono text-[#1C1719] shadow-2xs">
                <span>⚡ Precision URL Architecture</span>
              </div>
            </div>
          </div>

          {/* Overlapping Login / Sign In Toggle Positioned Between Both Panels (Mobile) */}
          <div className="flex lg:hidden justify-center -my-5 z-30 relative">
            <div className="inline-flex rounded-full bg-white p-1.5 shadow-md border border-[#D8C5DC]">
              <Link
                href="/login"
                className="rounded-full px-6 py-2 text-xs font-semibold text-[#1C1719] hover:text-[#1C1719] transition"
              >
                Sign In
              </Link>
              <span className="rounded-full bg-[#76566F] px-6 py-2 text-xs font-semibold text-white shadow-xs cursor-default">
                Create Account
              </span>
            </div>
          </div>

          {/* Right Half: Pure White Form Panel */}
          <div className="lg:col-span-6 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full pt-4 lg:pt-8">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1719]">
                  Create Account
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-[#1C1719] font-sans">
                  Enter your details to create your permanent LinkForge account.
                </p>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-700 font-sans">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4 font-sans">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1719] uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Smith"
                    className="mt-1.5 w-full rounded-2xl border border-[#D8C5DC] bg-white px-4 py-3 text-sm text-[#1C1719] outline-none placeholder:text-[#1C1719]/50 focus:border-[#76566F] focus:ring-2 focus:ring-[#76566F]/15 transition font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1719] uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-2xl border border-[#D8C5DC] bg-white px-4 py-3 text-sm text-[#1C1719] outline-none placeholder:text-[#1C1719]/50 focus:border-[#76566F] focus:ring-2 focus:ring-[#76566F]/15 transition font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1719] uppercase tracking-wider">
                    Password (min. 8 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 w-full rounded-2xl border border-[#D8C5DC] bg-white px-4 py-3 text-sm text-[#1C1719] outline-none placeholder:text-[#1C1719]/50 focus:border-[#76566F] focus:ring-2 focus:ring-[#76566F]/15 transition font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#76566F] py-3 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:bg-[#5a3f54] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-xs font-sans flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <span className="font-mono text-xs">→</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 border-t border-[#D8C5DC]/60 pt-6 text-center text-xs text-[#1C1719] font-sans">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#1C1719] hover:underline underline-offset-2 transition"
                >
                  Sign in →
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Subtle Meta Bar */}
      <footer className="mx-auto w-full max-w-5xl pt-6 text-center text-[11px] font-mono text-[#1C1719]">
        LinkForge URL Architecture · SSL Secured · PostgreSQL Sovereignty
      </footer>
    </main>
  );
}
