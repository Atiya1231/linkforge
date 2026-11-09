"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CreatedLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title?: string | null;
  expiresAt?: string | null;
  clicks: number;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [title, setTitle] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const [user, setUser] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [recentLinks, setRecentLinks] = useState<CreatedLink[]>([]);

  useEffect(() => {
    let ignore = false;

    // Check if user is logged in
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {});

    // Fetch session / guest links
    fetch("/api/links")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.links) {
          setRecentLinks(data.links.slice(0, 5));
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  async function refreshRecentLinks() {
    try {
      const res = await fetch("/api/links");
      const data = await res.json();
      if (data.links) {
        setRecentLinks(data.links.slice(0, 5));
      }
    } catch {
      // Ignore
    }
  }

  async function handleShorten(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");
    setCreatedLink(null);
    setQrDataUrl(null);
    setCopied(false);

    if (!url.trim()) {
      setError("Please paste a destination URL first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          customAlias: customAlias.trim() || undefined,
          title: title.trim() || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to shorten link");
      }

      setCreatedLink(data.link);
      setUrl("");
      setCustomAlias("");
      setTitle("");
      setExpiresAt("");
      setShowOptions(false);

      // Fetch QR Code for the created link
      fetch(`/api/qr?url=${encodeURIComponent(data.link.shortUrl)}`)
        .then((r) => r.json())
        .then((qr) => {
          if (qr.dataUrl) setQrDataUrl(qr.dataUrl);
        })
        .catch(() => {});

      // Refresh recent links
      refreshRecentLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!createdLink) return;
    navigator.clipboard.writeText(createdLink.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-[#1C1719] font-sans selection:bg-[#403047] selection:text-white">
      {/* 1. Distinctive Editorial Navigation */}
      <header className="sticky top-0 z-40 border-b border-[#d8c7dc] bg-white backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/" className="group flex items-center gap-2">
            <span className="font-serif text-2xl font-black tracking-tight text-[#1C1719] transition">
              Link<span className="text-[#1C1719]">Forge</span>
            </span>
            <span className="hidden sm:inline-block border-l border-[#d8c7dc] pl-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#1C1719]">
              URL Architecture
            </span>
          </Link>

          <nav className="flex items-center gap-6 sm:gap-8">
            <div className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-[#1C1719]">
              <a href="#features" className="transition hover:opacity-75">
                Capabilities
              </a>
              <a href="#how-it-works" className="transition hover:opacity-75">
                Protocol
              </a>
              <a href="#about" className="transition hover:opacity-75">
                Philosophy
              </a>
            </div>

            {user ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full border border-[#403047] bg-[#403047] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#302536]"
              >
                <span>Dashboard</span>
                <span className="font-mono text-[11px] transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-xs font-semibold uppercase tracking-wider text-[#1C1719] transition hover:opacity-75"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#403047] bg-[#403047] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition duration-200 hover:bg-[#302536] hover:border-[#302536] hover:text-white hover:-translate-y-0.5"
                >
                  <span>Get Started</span>
                  <span className="font-mono text-[11px]">→</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* 2. Hero Section: Asymmetric Editorial Composition */}
      <section className="relative w-full bg-white">
        <div className="mx-auto max-w-7xl px-6 pt-10 sm:pt-16 pb-16 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left Column: Headline, Narrative & Tool Interface */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#d8c7dc] bg-[#f8f5f9] px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[#1C1719] shadow-xs">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1C1719]"></span>
              <span>Fast HTTP 307 · Zero Tracking Delay · Base62 Engine</span>
            </div>

            <h1 className="mt-6 font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1C1719] leading-[1.12]">
              Precision link shortening,{" "}
              <span className="italic font-normal text-[#1C1719]">elevated.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#1C1719] leading-relaxed max-w-xl font-sans">
              Transform cluttered, fragile URLs into clean, permanent short links with instant high-resolution QR codes, custom branding, and real-time click telemetry.
            </p>

            {/* Premium Product Interface: URL Shortener */}
            <div className="mt-8 rounded-2xl border border-[#d8c7dc] bg-white p-3 sm:p-4 shadow-xs">
              <form onSubmit={handleShorten} className="flex flex-col gap-2.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-[#d8c7dc] bg-[#f8f5f9] p-1.5 focus-within:border-[#403047] focus-within:ring-2 focus-within:ring-[#403047]/10 transition">
                  <div className="hidden sm:flex items-center pl-3 pr-1 font-mono text-xs font-semibold text-[#1C1719]/60 select-none">
                    https://
                  </div>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError("");
                    }}
                    placeholder="paste your long destination URL..."
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm sm:text-base font-sans text-[#1C1719] outline-none placeholder:text-[#1C1719]/50"
                  />
                  <div className="flex items-center gap-2 pr-1">
                    <button
                      type="button"
                      onClick={() => setShowOptions(!showOptions)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition flex items-center gap-1.5 ${
                        showOptions || customAlias || title || expiresAt
                          ? "bg-[#403047]/10 text-[#1C1719] border border-[#403047]/30"
                          : "border border-[#d8c7dc] bg-white text-[#1C1719] hover:bg-[#f8f5f9]"
                      }`}
                      title="Custom alias, title, and expiration"
                    >
                      <span>Options</span>
                      <span className="font-mono text-[10px]">{showOptions ? "▲" : "▼"}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-[#403047] px-5 py-2.5 text-xs sm:text-sm font-semibold tracking-wide text-white shadow-xs transition hover:bg-[#302536] disabled:opacity-50 shrink-0"
                    >
                      {loading ? "Forging..." : "Shorten URL"}
                    </button>
                  </div>
                </div>

                {/* Optional Controls Drawer */}
                {showOptions && (
                  <div className="mt-2 rounded-xl border border-[#d8c7dc] bg-[#f8f5f9] p-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-left animate-fadeIn">
                    <div>
                      <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#1C1719]">
                        Custom Alias
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. spring-promo"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#d8c7dc] bg-white px-3 py-2 text-xs font-mono text-[#1C1719] outline-none focus:border-[#403047] focus:ring-1 focus:ring-[#403047] placeholder:text-[#1C1719]/50"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#1C1719]">
                        Title / Tag
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Campaign Link"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#d8c7dc] bg-white px-3 py-2 text-xs text-[#1C1719] outline-none focus:border-[#403047] focus:ring-1 focus:ring-[#403047] placeholder:text-[#1C1719]/50"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#1C1719]">
                        Expiration Date
                      </label>
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#d8c7dc] bg-white px-3 py-2 text-xs text-[#1C1719] outline-none focus:border-[#403047] focus:ring-1 focus:ring-[#403047]"
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* Result Card: Displayed right inside the workflow */}
            {createdLink && (
              <div className="mt-5 rounded-2xl border border-[#d8c7dc] bg-[#D9C5DC] p-5 sm:p-6 text-[#1C1719] shadow-xs animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#1C1719]">
                      ✓ Link Ready
                    </span>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <a
                        href={createdLink.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-[#1C1719] hover:underline"
                      >
                        {createdLink.shortUrl}
                      </a>
                      <button
                        onClick={handleCopy}
                        className="rounded-lg bg-white px-3 py-1 font-mono text-xs font-bold text-[#1C1719] transition hover:bg-[#f8f5f9] shadow-xs"
                      >
                        {copied ? "✓ Copied" : "Copy"}
                      </button>
                    </div>

                    <p className="mt-2 truncate font-mono text-xs text-[#1C1719] max-w-md">
                      → {createdLink.originalUrl}
                    </p>

                    {createdLink.expiresAt && (
                      <p className="mt-1 text-[11px] text-[#1C1719]">
                        Expires on {new Date(createdLink.expiresAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* QR Presentation */}
                  <div className="flex flex-col items-center gap-1.5 border-t border-[#1C1719]/15 pt-3 sm:border-t-0 sm:border-l sm:border-[#1C1719]/15 sm:pl-5 sm:pt-0">
                    {qrDataUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="h-24 w-24 rounded-lg bg-white p-1.5 shadow-xs"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-white/60 text-[10px] text-[#1C1719]">
                        Generating...
                      </div>
                    )}
                    {qrDataUrl && (
                      <a
                        href={qrDataUrl}
                        download={`qr-${createdLink.shortCode}.png`}
                        className="font-mono text-[10px] font-bold text-[#1C1719] hover:underline"
                      >
                        Download QR ↓
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Editorial Micro-Trust Note */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-[#1C1719]">
              <span className="flex items-center gap-1.5">
                <span className="text-[#1C1719]">✓</span> No account required
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#1C1719]">✓</span> Permanent by default
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#1C1719]">✓</span> Low-latency redirects
              </span>
            </div>
          </div>

          {/* Right Column: Custom Editorial Visual — Long URL to Short URL Transformation */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex flex-col space-y-3 sm:space-y-4">
            
            {/* BOX 1 — RAW SOURCE URL (Soft Lavender #E8DDEC) */}
            <div className="rounded-2xl border border-[#d2bed7] bg-[#e8ddec] p-5 shadow-sm text-[#1C1719]">
              <div className="flex items-center justify-between border-b border-[#d2bed7] pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1C1719]/30"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1C1719]/60"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1C1719]"></span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#1C1719]">
                  Raw Source URL · 112 Chars
                </span>
              </div>

              <div className="mt-3.5 rounded-xl border border-[#d2bed7] bg-[#f5eff6] p-3.5 font-mono text-xs leading-relaxed text-[#1C1719] break-all select-none">
                <span className="font-semibold text-[#1C1719]">https://acme.org/products/</span>
                <span className="mx-0.5 rounded bg-[#d2bed7] px-1.5 py-0.5 font-semibold text-[#1C1719]">autumn-release</span>
                <span className="text-[#1C1719]">?utm_source=email&amp;utm_campaign=q4&amp;ref=partner_8921&amp;token=xyz78</span>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-[#d2bed7] bg-[#f5eff6] px-2.5 py-1 font-mono text-[10px] font-medium text-[#1C1719]">
                  ⚠ Cluttered in Print
                </span>
                <span className="rounded-md border border-[#d2bed7] bg-[#f5eff6] px-2.5 py-1 font-mono text-[10px] font-medium text-[#1C1719]">
                  ⚠ Fragile in SMS
                </span>
              </div>
            </div>

            {/* Transformation Flow / Engine Indicator (Light Plum #D9C5DC) */}
            <div className="relative my-1 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-dashed border-[#d2bed7]" />
              </div>
              <div className="relative flex items-center gap-2 rounded-full border border-[#C8ADCE] bg-[#D9C5DC] px-4 py-1.5 text-[11px] font-mono text-[#1C1719] shadow-md">
                <span className="text-[#1C1719]">⚡</span>
                <span className="font-bold tracking-wide">LinkForge Base62 Hash &amp; Redirect Engine</span>
                <span className="text-xs text-[#1C1719] font-mono">↓</span>
              </div>
            </div>

            {/* BOX 2 — BRANDED SHORT LINK (Pale Rose Lavender #F3EAF0) */}
            <div className="rounded-2xl border border-[#d2bed7] bg-[#f3eaf0] p-5 shadow-sm text-[#1C1719]">
              <div className="flex items-center justify-between border-b border-[#d2bed7] pb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#1C1719]">
                    Branded Short Link
                  </span>
                </div>
                <span className="rounded-full border border-[#d2bed7] bg-[#e8ddec] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#1C1719]">
                  -79% Chars
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#d2bed7] bg-white p-3.5 shadow-xs">
                <div className="font-mono text-base sm:text-lg font-bold text-[#1C1719]">
                  linkforge.io/autumn
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px] text-[#1C1719]">
                  <span>⚡ 18ms</span>
                </div>
              </div>

              {/* Telemetry Preview HUD */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded-xl border border-[#d2bed7] bg-white p-2.5 shadow-xs">
                  <p className="text-[10px] uppercase text-[#1C1719]">Total Clicks</p>
                  <p className="mt-0.5 font-serif text-lg font-bold text-[#1C1719]">1,482</p>
                </div>
                <div className="rounded-xl border border-[#d2bed7] bg-white p-2.5 shadow-xs">
                  <p className="text-[10px] uppercase text-[#1C1719]">Top Device</p>
                  <p className="mt-0.5 font-sans text-xs font-bold text-[#1C1719]">Mobile (68%)</p>
                </div>
                <div className="rounded-xl border border-[#d2bed7] bg-white p-2.5 shadow-xs">
                  <p className="text-[10px] uppercase text-[#1C1719]">Protocol</p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-[#1C1719]">HTTP 307</p>
                </div>
              </div>

              {/* Integrated Mini QR Code Teaser */}
              <div className="mt-4 flex items-center justify-between border-t border-[#d2bed7] pt-3 text-xs text-[#1C1719]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base text-[#1C1719]">▦</span>
                  <span className="font-sans text-xs font-semibold text-[#1C1719]">Vector QR Code ready</span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#1C1719]">
                  PNG Download
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* 3. Session Recent Links Drawer (Preserved Feature) */}
        {recentLinks.length > 0 && (
          <div className="mt-12 rounded-2xl border border-[#d8c7dc] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#d8c7dc] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1C1719]">
                  Recent Session Links
                </span>
                <span className="rounded-full bg-[#e8ddec] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1C1719]">
                  {recentLinks.length}
                </span>
              </div>
              <Link href="/dashboard" className="text-xs font-semibold text-[#1C1719] hover:underline font-sans">
                Open Dashboard →
              </Link>
            </div>

            <div className="mt-3 divide-y divide-[#d8c7dc]/60">
              {recentLinks.map((link) => (
                <div key={link.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#1C1719]">/{link.shortCode}</span>
                    <span className="truncate font-mono text-xs text-[#1C1719] max-w-xs sm:max-w-md">
                      {link.originalUrl}
                    </span>
                    <span className="font-mono text-[11px] text-[#1C1719]">
                      ({link.clicks} clicks)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(link.shortUrl);
                        alert("Copied short URL to clipboard!");
                      }}
                      className="rounded border border-[#d8c7dc] bg-white px-2.5 py-1 font-mono text-xs font-medium text-[#1C1719] hover:bg-[#f8f5f9] transition"
                    >
                      Copy
                    </button>
                    <Link
                      href={`/dashboard/analytics/${link.id}`}
                      className="rounded border border-[#d8c7dc] bg-white px-2.5 py-1 font-mono text-xs font-medium text-[#1C1719] hover:bg-[#f8f5f9] transition"
                    >
                      Stats
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </section>

      {/* 4. Below-The-Fold: Distinctive Editorial Capabilities (No generic card grids) */}
      <section id="features" className="border-t border-[#d8c7dc] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          
          {/* Section Header with Editorial Meta */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d8c7dc] pb-6">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#1C1719]">
                01 / Capabilities
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1C1719]">
                Architected for permanence, clarity &amp; speed.
              </h2>
            </div>
            <p className="max-w-md text-sm text-[#1C1719] leading-relaxed">
              Every short link is backed by distributed Postgres infrastructure and collision-safe encoding algorithms.
            </p>
          </div>

          {/* Editorial Asymmetric Layout (Hero Feature + Dual Cards) */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Feature Spotlight: Fast 307 Redirection (Large Span) */}
            <div className="lg:col-span-7 rounded-3xl border border-[#A88EAA] bg-[#76577A] p-8 sm:p-10 flex flex-col justify-between shadow-xs">
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                  Primary Protocol
                </span>
                <h3 className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-white">
                  Global Low-Latency HTTP 307 Temporary Redirects
                </h3>
                <p className="mt-4 text-sm sm:text-base text-white leading-relaxed">
                  Unlike legacy link shorteners that force visitors through intrusive interstitial ads or JavaScript tracking delays, LinkForge issues instantaneous HTTP 307 redirects directly to your final destination URL.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[#A88EAA] grid grid-cols-3 gap-4 font-mono text-xs">
                <div>
                  <p className="text-[10px] uppercase text-white">Latency</p>
                  <p className="font-serif text-xl font-bold text-white">&lt; 20ms</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-white">Method</p>
                  <p className="font-serif text-xl font-bold text-white">HTTP 307</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-white">Ad Screens</p>
                  <p className="font-serif text-xl font-bold text-white">Zero</p>
                </div>
              </div>
            </div>

            {/* Side Column: Dual Features */}
            <div className="lg:col-span-5 flex flex-col gap-8 justify-between">
              
              {/* Feature 2: Custom Branded Aliases */}
              <div className="rounded-3xl border border-[#A88EAA] bg-[#76577A] p-7 shadow-xs">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                  Custom Branding
                </span>
                <h3 className="mt-2 font-serif text-xl font-bold text-white">
                  Bespoke Short Aliases
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-white leading-relaxed">
                  Craft memorable short links for marketing campaigns, newsletters, and social channels with built-in collision prevention.
                </p>
              </div>

              {/* Feature 3: Vector QR Code Generation */}
              <div className="rounded-3xl border border-[#A88EAA] bg-[#76577A] p-7 shadow-xs">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                  Print &amp; Physical Media
                </span>
                <h3 className="mt-2 font-serif text-xl font-bold text-white">
                  Instant High-Res QR Engine
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-white leading-relaxed">
                  Every shortened link automatically synthesizes a high-contrast vector QR code ready for direct PNG download.
                </p>
              </div>

            </div>
          </div>

          {/* Tertiary Row: 3 Editorial Data Strips */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#d8c7dc] p-6 bg-[#DCC8DF] shadow-xs">
              <span className="font-mono text-xs font-bold text-[#1C1719]">01 / Telemetry</span>
              <h4 className="mt-2 font-serif text-lg font-bold text-[#1C1719]">Real-Time Analytics</h4>
              <p className="mt-1 text-xs text-[#1C1719] leading-relaxed">
                Log click events atomically with device classification and referrer telemetry.
              </p>
            </div>

            <div className="rounded-2xl border border-[#d8c7dc] p-6 bg-[#DCC8DF] shadow-xs">
              <span className="font-mono text-xs font-bold text-[#1C1719]">02 / Lifecycle</span>
              <h4 className="mt-2 font-serif text-lg font-bold text-[#1C1719]">Automated Expiration</h4>
              <p className="mt-1 text-xs text-[#1C1719] leading-relaxed">
                Set time-sensitive expirations or pause links with one click whenever needed.
              </p>
            </div>

            <div className="rounded-2xl border border-[#d8c7dc] p-6 bg-[#DCC8DF] shadow-xs">
              <span className="font-mono text-xs font-bold text-[#1C1719]">03 / Privacy</span>
              <h4 className="mt-2 font-serif text-lg font-bold text-[#1C1719]">Multi-Tenant Isolation</h4>
              <p className="mt-1 text-xs text-[#1C1719] leading-relaxed">
                Complete authorization enforcement ensures only verified creators manage their links.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Below-The-Fold: Stepped Protocol / How LinkForge Works */}
      <section id="how-it-works" className="border-t border-[#d8c7dc] bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8c7dc] bg-[#F8F3F8] px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[#1C1719]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1C1719]" />
              <span>02 / Protocol</span>
            </div>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1C1719] leading-[1.18]">
              Three deterministic steps from URL to destination.
            </h2>
          </div>

          <div className="relative mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            
            {/* Step 1 Card */}
            <div className="relative z-10 flex flex-col justify-between rounded-3xl border border-[#d8c7dc] bg-[#D9C5DC] p-7 sm:p-8 shadow-xs hover:border-[#76577A]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#d8c7dc] text-[#1C1719] shadow-xs">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  </div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1C1719] bg-white border border-[#d8c7dc] rounded-full px-3 py-1">
                    01
                  </span>
                </div>

                <h3 className="mt-6 font-serif text-xl sm:text-2xl font-bold text-[#1C1719]">
                  Destination Ingestion
                </h3>
                <p className="mt-3 text-sm text-[#1C1719] leading-relaxed font-sans">
                  Paste any valid web destination. Optionally customize your alias, note campaigns, or specify precise expiration timestamps.
                </p>
              </div>

              {/* Connecting arrow indicator on desktop */}
              <div className="hidden md:flex absolute -right-3.5 lg:-right-4.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 items-center justify-center rounded-full bg-white border border-[#d8c7dc] text-[#1C1719] shadow-xs">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>

            {/* Step 2 Card */}
            <div className="relative z-10 flex flex-col justify-between rounded-3xl border border-[#d8c7dc] bg-[#D9C5DC] p-7 sm:p-8 shadow-xs hover:border-[#76577A]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#d8c7dc] text-[#1C1719] shadow-xs">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1C1719] bg-white border border-[#d8c7dc] rounded-full px-3 py-1">
                    02
                  </span>
                </div>

                <h3 className="mt-6 font-serif text-xl sm:text-2xl font-bold text-[#1C1719]">
                  Encoding &amp; Synthesis
                </h3>
                <p className="mt-3 text-sm text-[#1C1719] leading-relaxed font-sans">
                  LinkForge applies Base62 encoding and registers the pointer in our transactional Postgres store while rendering a high-res QR matrix.
                </p>
              </div>

              {/* Connecting arrow indicator on desktop */}
              <div className="hidden md:flex absolute -right-3.5 lg:-right-4.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 items-center justify-center rounded-full bg-white border border-[#d8c7dc] text-[#1C1719] shadow-xs">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>

            {/* Step 3 Card */}
            <div className="relative z-10 flex flex-col justify-between rounded-3xl border border-[#d8c7dc] bg-[#D9C5DC] p-7 sm:p-8 shadow-xs hover:border-[#76577A]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#d8c7dc] text-[#1C1719] shadow-xs">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1C1719] bg-white border border-[#d8c7dc] rounded-full px-3 py-1">
                    03
                  </span>
                </div>

                <h3 className="mt-6 font-serif text-xl sm:text-2xl font-bold text-[#1C1719]">
                  Telemetry &amp; Routing
                </h3>
                <p className="mt-3 text-sm text-[#1C1719] leading-relaxed font-sans">
                  Incoming requests trigger atomic click logging and execute a 307 temporary redirect in milliseconds, updating your dashboard in real time.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. Below-The-Fold: Philosophy & Guarantees */}
      <section id="about" className="border-t border-[#d8c7dc] bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            
            {/* Left Column: Heading */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d8c7dc] bg-[#F8F3F8] px-3.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[#1C1719]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1C1719]" />
                <span>03 / Philosophy</span>
              </div>
              <h2 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1C1719] leading-[1.18]">
                The web deserves clean, permanent links.
              </h2>
            </div>

            {/* Right Column: Description, Lavender Divider, and Feature Badges */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <p className="text-base sm:text-lg text-[#1C1719] leading-relaxed font-sans">
                Shortened URLs should be reliable infrastructure, not an advertising channel. LinkForge is engineered with no intermediary redirect walls, no third-party ad injection, and no arbitrary link expiration.
              </p>
              
              {/* Subtle lavender divider */}
              <div className="my-8 h-px w-full bg-[#d8c7dc]" />

              {/* Feature Badges with soft lavender backgrounds and plum icons/text */}
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d8c7dc] bg-[#F8F3F8] px-4 py-2 font-mono text-xs font-semibold text-[#1C1719] shadow-2xs transition hover:border-[#76577A]/50">
                  <svg className="h-3.5 w-3.5 text-[#1C1719]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <span>100% Direct Redirects</span>
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-[#d8c7dc] bg-[#F8F3F8] px-4 py-2 font-mono text-xs font-semibold text-[#1C1719] shadow-2xs transition hover:border-[#76577A]/50">
                  <svg className="h-3.5 w-3.5 text-[#1C1719]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Zero Interstitial Ads</span>
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-[#d8c7dc] bg-[#F8F3F8] px-4 py-2 font-mono text-xs font-semibold text-[#1C1719] shadow-2xs transition hover:border-[#76577A]/50">
                  <svg className="h-3.5 w-3.5 text-[#1C1719]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                  <span>PostgreSQL Data Sovereignty</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. Sophisticated Editorial Footer */}
      <footer className="border-t border-[#e8ddec] bg-white py-12 px-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#e8ddec]">
            
            <div className="md:col-span-2">
              <Link href="/" className="font-serif text-xl font-black text-[#1C1719]">
                Link<span className="text-[#1C1719]">Forge</span>
              </Link>
              <p className="mt-2 text-xs text-[#1C1719] max-w-sm leading-relaxed">
                Architectural URL shortening, QR code synthesis, and real-time redirect telemetry on Neon PostgreSQL.
              </p>
              <p className="mt-4 font-mono text-[11px] text-[#1C1719]">
                System Operational · SSL Verified · Node.js / Next.js
              </p>
            </div>

            <div>
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#1C1719]">
                Platform
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-[#1C1719]">
                <li><a href="#features" className="hover:opacity-75 transition">Capabilities</a></li>
                <li><a href="#how-it-works" className="hover:opacity-75 transition">Protocol Flow</a></li>
                <li><a href="#about" className="hover:opacity-75 transition">Philosophy</a></li>
                <li><Link href="/dashboard" className="hover:opacity-75 transition">Console / Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#1C1719]">
                Account
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-[#1C1719]">
                <li><Link href="/login" className="hover:opacity-75 transition">Sign In</Link></li>
                <li><Link href="/signup" className="hover:opacity-75 transition">Create Account</Link></li>
                <li><Link href="/dashboard" className="hover:opacity-75 transition">Guest Sync</Link></li>
              </ul>
            </div>

          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#1C1719]">
            <p>© 2026 LinkForge. Precision URL Architecture.</p>
            <p className="mt-2 sm:mt-0 font-mono text-[11px]">Plum (#403047) &amp; White (#FFFFFF)</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
