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
    <main className="min-h-screen w-full overflow-x-clip bg-white text-[#1C1719] font-sans selection:bg-[#403047] selection:text-white">
      {/* 1. Distinctive Editorial Navigation on Pure White matching reference */}
      <header className="sticky top-0 z-40 h-14 border-b border-[#D8C7DC]/60 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-full w-full max-w-[1400px] items-center justify-between px-6 sm:px-8 lg:px-10">
          {/* Logo & URL Architecture Label */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[#59171B] text-white shadow-2xs">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <Link href="/" className="font-sans text-xl sm:text-2xl font-black tracking-tight text-[#1C1719] hover:opacity-90 transition">
              LinkForge
            </Link>
            <span className="text-[#D8C7DC] text-base font-light select-none">|</span>
            <div className="flex flex-col font-mono text-[9px] sm:text-[10px] font-bold tracking-widest uppercase leading-[1.05] text-[#1C1719]">
              <span>URL</span>
              <span>ARCHITECTURE</span>
            </div>
          </div>

          {/* Navigation Links & Auth Actions */}
          <div className="flex items-center gap-7">
            <nav className="hidden md:flex items-center gap-7 font-mono text-xs font-semibold tracking-wider text-[#1C1719]">
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  window.history.pushState(null, "", "#features");
                }}
                className="hover:text-[#59171B] transition"
              >
                CAPABILITIES
              </a>
              <a
                href="#protocol"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("protocol")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  window.history.pushState(null, "", "#protocol");
                }}
                className="hover:text-[#59171B] transition"
              >
                PROTOCOL
              </a>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("about")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  window.history.pushState(null, "", "#about");
                }}
                className="hover:text-[#59171B] transition"
              >
                PHILOSOPHY
              </a>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  window.history.pushState(null, "", "#features");
                }}
                className="hover:text-[#59171B] transition"
              >
                RESOURCES
              </a>
            </nav>

            <div>
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#302024] px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition duration-150 hover:bg-[#4a1c32]"
                >
                  <span>Dashboard</span>
                  <span className="font-mono text-[11px]">→</span>
                </Link>
              ) : (
                <div className="flex items-center gap-6">
                  <Link
                    href="/login"
                    className="font-mono text-xs font-semibold uppercase tracking-wider text-[#1C1719] hover:text-[#59171B] transition inline-flex items-center gap-1"
                  >
                    <span>LOG IN</span>
                    <span className="font-mono text-xs">↗</span>
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#302024] px-5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition duration-150 hover:bg-[#4a1c32]"
                  >
                    <span>GET STARTED</span>
                    <span className="font-mono text-xs">↗</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Precision Link Shortening matching reference visual & layout */}
      <section className="relative w-full bg-white overflow-hidden flex flex-col justify-center min-h-[calc(100svh-3.5rem)] lg:h-[calc(100vh-3.5rem)] lg:min-h-[580px] lg:max-h-[820px] py-4 lg:py-0">
        <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-8 lg:px-10 grid grid-cols-1 lg:grid-cols-[48fr_52fr] gap-8 lg:gap-6 xl:gap-10 items-center">
          
          {/* Left Column (~48% width): Editorial Headline & URL Shortener */}
          <div className="flex flex-col z-10 w-full max-w-2xl lg:max-w-none justify-center">
            {/* Eyebrow Label with Technical Star Glyph */}
            <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#1C1719]">
              <span className="text-base text-[#59171B] leading-none">✳</span>
              <span>FAST HTTP 307 · ZERO TRACKING DELAY · BASE62 ENGINE</span>
            </div>

            {/* Oversized Bold Condensed Display Headline - Enlarged & Visually Dominant */}
            <h1 className="mt-3 sm:mt-3.5 font-sans text-5xl sm:text-6xl md:text-7xl lg:text-[56px] xl:text-[68px] 2xl:text-[76px] font-[900] tracking-[-0.035em] uppercase text-[#1C1719] leading-[0.88] sm:leading-[0.90] select-none">
              PRECISION LINK<br />
              SHORTENING,<br />
              <span className="relative inline-block mt-1 sm:mt-1.5">
                <span className="absolute inset-0 -inset-x-3.5 sm:-inset-x-4 -inset-y-0.5 sm:-inset-y-1 bg-[#FED7B8] rounded-md sm:rounded-lg -z-10" />
                <span className="text-[#302024] px-0.5">ELEVATED.</span>
              </span>
            </h1>

            {/* Supporting Paragraph with Technical Vertical Accent Line - Comfortable Readability */}
            <div className="mt-3.5 sm:mt-4 pl-3.5 border-l-2 border-[#59171B]/60">
              <p className="text-base sm:text-[17px] lg:text-[16px] xl:text-[17.5px] text-[#1C1719]/80 leading-relaxed font-sans font-normal max-w-xl">
                Transform cluttered, fragile URLs into clean, permanent short links with instant high-resolution QR codes, custom branding, and real-time click telemetry.
              </p>
            </div>

            {/* URL Shortener Interface - Full Placeholder Visibility & Responsive Flex */}
            <div className="mt-4 sm:mt-5 rounded-2xl border border-[#DCC8E2] bg-white p-1 sm:p-1.5 shadow-xs w-full max-w-2xl">
              <form onSubmit={handleShorten} className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 rounded-xl bg-transparent p-0.5 sm:p-1 focus-within:ring-2 focus-within:ring-[#302024]/15">
                  <div className="hidden sm:flex items-center justify-center h-7 w-7 rounded-lg bg-[#EADCEB] text-[#59171B] shrink-0 ml-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline-block font-mono text-xs text-[#1C1719]/45 select-none pl-1 shrink-0">https://</span>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError("");
                    }}
                    placeholder="Paste your long destination URL..."
                    className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm sm:text-[14px] font-sans text-[#1C1719] outline-none placeholder:text-[#1C1719]/45"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="hidden sm:inline-block text-[#DCC8E2] font-light select-none px-0.5">|</span>
                    <button
                      type="button"
                      onClick={() => setShowOptions(!showOptions)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition flex items-center gap-1 shrink-0 whitespace-nowrap ${
                        showOptions || customAlias || title || expiresAt
                          ? "bg-[#302024]/10 text-[#1C1719] border border-[#302024]/30"
                          : "border border-[#D8C7DC] bg-white text-[#1C1719] hover:bg-[#F8F5F9]"
                      }`}
                      title="Custom alias, title, and expiration"
                    >
                      <span>Options</span>
                      <span className="font-mono text-[9px]">{showOptions ? "▲" : "▼"}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-xl bg-[#302024] px-4 py-2 sm:px-4.5 text-xs sm:text-[13px] font-semibold tracking-wide text-white shadow-xs transition duration-150 hover:bg-[#4a1c32] disabled:opacity-50 shrink-0 inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>{loading ? "Forging..." : "Shorten URL"}</span>
                      <span className="font-mono text-xs">↗</span>
                    </button>
                  </div>
                </div>

                {/* Optional Controls Drawer */}
                {showOptions && (
                  <div className="mt-2 rounded-xl border border-[#d8c7dc] bg-[#f8f5f9] p-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-left animate-fadeIn">
                    <div>
                      <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#1C1719]">
                        Custom Alias
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. spring-promo"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#d8c7dc] bg-white px-2.5 py-1.5 text-xs font-mono text-[#1C1719] outline-none focus:border-[#302024] focus:ring-1 focus:ring-[#302024] placeholder:text-[#1C1719]/50"
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
                        className="mt-1 w-full rounded-lg border border-[#d8c7dc] bg-white px-2.5 py-1.5 text-xs text-[#1C1719] outline-none focus:border-[#302024] focus:ring-1 focus:ring-[#302024] placeholder:text-[#1C1719]/50"
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
                        className="mt-1 w-full rounded-lg border border-[#d8c7dc] bg-white px-2.5 py-1.5 text-xs text-[#1C1719] outline-none focus:border-[#302024] focus:ring-1 focus:ring-[#302024]"
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700 w-full max-w-2xl">
                {error}
              </div>
            )}

            {/* Result Card: Displayed directly on white in Light Plum #D9C5DC */}
            {createdLink && (
              <div className="mt-3 rounded-2xl border border-[#d8c7dc] bg-[#D9C5DC] p-4 text-[#1C1719] shadow-xs animate-fadeIn w-full max-w-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#1C1719]">
                      ✓ Link Ready
                    </span>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                      <a
                        href={createdLink.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-lg sm:text-xl font-bold tracking-tight text-[#1C1719] hover:underline"
                      >
                        {createdLink.shortUrl}
                      </a>
                      <button
                        onClick={handleCopy}
                        className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#1C1719] transition hover:bg-[#f8f5f9] shadow-xs"
                      >
                        {copied ? "✓ Copied" : "Copy"}
                      </button>
                    </div>

                    <p className="mt-1 truncate font-mono text-xs text-[#1C1719] max-w-md">
                      → {createdLink.originalUrl}
                    </p>

                    {createdLink.expiresAt && (
                      <p className="mt-0.5 text-[10.5px] text-[#1C1719]">
                        Expires on {new Date(createdLink.expiresAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* QR Presentation */}
                  <div className="flex flex-col items-center gap-1 border-t border-[#1C1719]/15 pt-2 sm:border-t-0 sm:border-l sm:border-[#1C1719]/15 sm:pl-4 sm:pt-0">
                    {qrDataUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="h-20 w-20 rounded-lg bg-white p-1 shadow-xs"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/60 text-[10px] text-[#1C1719]">
                        Generating...
                      </div>
                    )}
                    {qrDataUrl && (
                      <a
                        href={qrDataUrl}
                        download={`qr-${createdLink.shortCode}.png`}
                        className="font-mono text-[9.5px] font-bold text-[#1C1719] hover:underline"
                      >
                        Download QR ↓
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Benefit Badges Row */}
            <div className="mt-3.5 sm:mt-4 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-[13px] font-medium text-[#1C1719]">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[#302024] font-bold">✓</span> No account required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[#302024] font-bold">✓</span> Permanent by default
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[#302024] font-bold">✓</span> Low-latency redirects
              </span>
            </div>
          </div>

          {/* Right Column (~52% width): Layered 3D URL/Link Architecture Illustration - Substantially Enlarged */}
          <div className="relative flex items-center justify-center w-full py-2 lg:py-0">
            <div className="w-full max-w-[540px] sm:max-w-[580px] lg:max-w-none xl:max-w-[700px] 2xl:max-w-[740px] mx-auto select-none relative flex items-center justify-center">
              <svg
                className="w-full h-auto max-h-[420px] sm:max-h-[460px] lg:max-h-[490px] xl:max-h-[540px] 2xl:max-h-[580px] block select-none mx-auto drop-shadow-sm"
                viewBox="0 0 660 480"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Volumetric Ground Shadow Filter */}
                  <filter id="archGroundGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="30" />
                  </filter>

                  {/* Layer Drop Shadows */}
                  <filter id="tierShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="18" stdDeviation="14" floodColor="#240A1D" floodOpacity="0.36" />
                  </filter>
                  <filter id="topSlabShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="15" stdDeviation="12" floodColor="#270D21" floodOpacity="0.26" />
                  </filter>

                  {/* Slab Gradients in LinkForge Plum Palette */}
                  {/* Tier 1: Pearl White Top Face */}
                  <linearGradient id="topFacePearl" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="65%" stopColor="#FAF4FA" />
                    <stop offset="100%" stopColor="#F0E3F0" />
                  </linearGradient>

                  {/* Tier 1: Bevel Extrusion Side Wall */}
                  <linearGradient id="topSideWall" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#D8C8D9" />
                    <stop offset="45%" stopColor="#C4ADC5" />
                    <stop offset="100%" stopColor="#DFD0E1" />
                  </linearGradient>

                  {/* Tier 2: Obsidian Deep Plum Redirect Engine Face */}
                  <linearGradient id="midFaceObsidian" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3E1D32" />
                    <stop offset="55%" stopColor="#2A1021" />
                    <stop offset="100%" stopColor="#1B0714" />
                  </linearGradient>

                  {/* Tier 2: Extrusion Wall with Chamfer Reflection */}
                  <linearGradient id="midSideWall" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#180713" />
                    <stop offset="40%" stopColor="#2A1021" />
                    <stop offset="85%" stopColor="#6C2653" />
                    <stop offset="100%" stopColor="#3A152C" />
                  </linearGradient>

                  {/* Tier 3: Soft Lilac / Lavender Output Face */}
                  <linearGradient id="botFaceLilac" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F5EBF7" />
                    <stop offset="50%" stopColor="#E2CCE6" />
                    <stop offset="100%" stopColor="#CEB4D3" />
                  </linearGradient>

                  {/* Tier 3: Extrusion Side Wall */}
                  <linearGradient id="botSideWall" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9C80A3" />
                    <stop offset="40%" stopColor="#B497BB" />
                    <stop offset="80%" stopColor="#C5ABC9" />
                    <stop offset="100%" stopColor="#AC8FB3" />
                  </linearGradient>

                  {/* Base Foundation Plate Gradients */}
                  <linearGradient id="baseFacePlate" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2D1224" />
                    <stop offset="100%" stopColor="#190612" />
                  </linearGradient>
                  <linearGradient id="baseSidePlate" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#13040D" />
                    <stop offset="100%" stopColor="#240B1C" />
                  </linearGradient>

                  {/* Floating Prisms Gradients */}
                  <linearGradient id="prismLilac" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E9DDED" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#E9DDED" stopOpacity="0.15" />
                  </linearGradient>
                  <linearGradient id="prismPeach" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FED7B8" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#FED7B8" stopOpacity="0.15" />
                  </linearGradient>

                  {/* Vertical Light Pillar Gradient */}
                  <linearGradient id="pillarGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E2CCE6" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#CEB4D3" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#59171B" stopOpacity="0" />
                  </linearGradient>

                  {/* Technical Coordinate Grid */}
                  <pattern id="archGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#F4EAF3" strokeWidth="0.8" />
                  </pattern>
                </defs>

                {/* 1. Coordinate Grid Background */}
                <rect x="25" y="20" width="610" height="440" fill="url(#archGrid)" opacity="0.85" />

                {/* 2. Four Precision Corner Crosshairs (+) */}
                <g stroke="#8A6382" strokeWidth="1.4">
                  <path d="M 25 32 L 39 32 M 32 25 L 32 39" />
                  <path d="M 621 32 L 635 32 M 628 25 L 628 39" />
                  <path d="M 25 448 L 39 448 M 32 441 L 32 455" />
                  <path d="M 621 448 L 635 448 M 628 441 L 628 455" />
                </g>

                {/* 3. Sweeping Swept Orbit Ellipse */}
                <ellipse cx="338" cy="265" rx="255" ry="142" stroke="#DFCDE2" strokeWidth="1.35" fill="none" opacity="0.75" />

                {/* 4. Ground Volumetric Diffuse Plum Shadows on Floor */}
                <ellipse cx="338" cy="428" rx="195" ry="56" fill="#4A1435" fillOpacity="0.22" filter="url(#archGroundGlow)" />
                <ellipse cx="338" cy="418" rx="140" ry="36" fill="#240D1D" fillOpacity="0.28" filter="url(#archGroundGlow)" />

                {/* Vertical Light Columns beneath Bottom Slab */}
                <g opacity="0.85">
                  <rect x="312" y="342" width="9" height="78" rx="2.5" fill="url(#pillarGlow)" />
                  <rect x="354" y="342" width="9" height="78" rx="2.5" fill="url(#pillarGlow)" />
                </g>

                {/* 5. Floating Glass Prisms Accents */}
                <polygon points="495,78 565,92 542,108 472,94" fill="url(#prismLilac)" />
                <polygon points="80,225 145,239 128,255 63,241" fill="url(#prismLilac)" />
                <polygon points="90,345 155,359 138,375 73,361" fill="url(#prismPeach)" />
                <polygon points="535,185 588,197 572,210 519,198" fill="url(#prismPeach)" />

                {/* 6. Hatched Telemetry Marks (IIIIII on left, IIIIIIIIIIII on floor) */}
                <g transform="translate(130, 162)">
                  <line x1="0" y1="0" x2="-6" y2="17" stroke="#59171B" strokeWidth="3" strokeLinecap="round" />
                  <line x1="8" y1="0" x2="2" y2="17" stroke="#59171B" strokeWidth="3" strokeLinecap="round" />
                  <line x1="16" y1="0" x2="10" y2="17" stroke="#59171B" strokeWidth="3" strokeLinecap="round" />
                  <line x1="24" y1="0" x2="18" y2="17" stroke="#59171B" strokeWidth="3" strokeLinecap="round" />
                  <line x1="32" y1="0" x2="26" y2="17" stroke="#59171B" strokeWidth="3" strokeLinecap="round" />
                  <line x1="40" y1="0" x2="34" y2="17" stroke="#59171B" strokeWidth="3" strokeLinecap="round" />
                </g>
                <g transform="translate(490, 428)">
                  <line x1="0" y1="0" x2="0" y2="13" stroke="#59171B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="6" y1="0" x2="6" y2="13" stroke="#59171B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="12" y1="0" x2="12" y2="13" stroke="#59171B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="18" y1="0" x2="18" y2="13" stroke="#59171B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="24" y1="0" x2="24" y2="13" stroke="#59171B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="30" y1="0" x2="30" y2="13" stroke="#59171B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="36" y1="0" x2="36" y2="13" stroke="#59171B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="42" y1="0" x2="42" y2="13" stroke="#59171B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="48" y1="0" x2="48" y2="13" stroke="#59171B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="54" y1="0" x2="54" y2="13" stroke="#59171B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="60" y1="0" x2="60" y2="13" stroke="#59171B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="66" y1="0" x2="66" y2="13" stroke="#59171B" strokeWidth="2.2" strokeLinecap="round" />
                </g>

                {/* ==================== THE ENLARGED ISOMETRIC STACK ==================== */}

                {/* BASE FOUNDATION PLATE */}
                <g id="baseFoundation">
                  {[...Array(9)].map((_, i) => (
                    <g key={i} transform={`translate(338, ${385 + (9 - i) * 1.6}) scale(1, 0.58) rotate(45)`}>
                      <rect x="-105" y="-105" width="210" height="210" rx="42" fill="url(#baseSidePlate)" />
                    </g>
                  ))}
                  <g transform="translate(338, 385) scale(1, 0.58) rotate(45)">
                    <rect x="-105" y="-105" width="210" height="210" rx="42" fill="url(#baseFacePlate)" stroke="#3E1D31" strokeWidth="1.5" />
                  </g>
                </g>

                {/* LAYER 3: BOTTOM SLAB (Lavender / Lilac Output) - Substantially Enlarged */}
                <g id="layer3Bottom" filter="url(#tierShadow)">
                  {[...Array(18)].map((_, i) => (
                    <g key={i} transform={`translate(338, ${330 + (18 - i) * 1.65}) scale(1, 0.58) rotate(45)`}>
                      <rect x="-102" y="-102" width="204" height="204" rx="40" fill="url(#botSideWall)" />
                    </g>
                  ))}
                  <g transform="translate(338, 330) scale(1, 0.58) rotate(45)">
                    <rect x="-102" y="-102" width="204" height="204" rx="40" fill="url(#botFaceLilac)" stroke="#FFFFFF" strokeWidth="2" />
                  </g>
                </g>

                {/* LAYER 2: MIDDLE SLAB (Deep Obsidian Plum Redirect Engine) - Substantially Enlarged */}
                <g id="layer2Middle" filter="url(#tierShadow)">
                  {[...Array(22)].map((_, i) => (
                    <g key={i} transform={`translate(338, ${238 + (22 - i) * 1.65}) scale(1, 0.58) rotate(45)`}>
                      <rect x="-97" y="-97" width="194" height="194" rx="38" fill="url(#midSideWall)" />
                    </g>
                  ))}
                  <g transform="translate(338, 238) scale(1, 0.58) rotate(45)">
                    <rect x="-97" y="-97" width="194" height="194" rx="38" fill="url(#midFaceObsidian)" stroke="#6C2653" strokeWidth="1.75" />
                    <path d="M -84 97 L 97 97" stroke="#BA5B9E" strokeWidth="2.8" strokeLinecap="round" opacity="0.85" />
                    <rect x="42" y="84" width="20" height="11" rx="2.5" fill="#E9DDED" opacity="0.9" />
                  </g>
                </g>

                {/* LAYER 1: TOP SLAB (Pearl White Input Tier with Central Chain-Link Icon) - Substantially Enlarged */}
                <g id="layer1Top" filter="url(#topSlabShadow)">
                  {[...Array(15)].map((_, i) => (
                    <g key={i} transform={`translate(338, ${146 + (15 - i) * 1.55}) scale(1, 0.58) rotate(45)`}>
                      <rect x="-92" y="-92" width="184" height="184" rx="36" fill="url(#topSideWall)" />
                    </g>
                  ))}
                  <g transform="translate(338, 146) scale(1, 0.58) rotate(45)">
                    <rect x="-92" y="-92" width="184" height="184" rx="36" fill="url(#topFacePearl)" stroke="#FFFFFF" strokeWidth="2.2" />
                    
                    {/* Central Embossed Dark Plum Chain Link Icon - Scaled Up */}
                    <g transform="rotate(-45) scale(1.18)">
                      <path d="M -8 -16 L -24 -16 C -34 -16 -42 -8 -42 2 C -42 12 -34 20 -24 20 L -8 20 C 2 20 10 12 10 2 C 10 -8 2 -16 -8 -16 Z" 
                            fill="none" stroke="#302024" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 8 -20 L 24 -20 C 34 -20 42 -12 42 -2 C 42 8 34 16 24 16 L 8 16 C -2 16 -10 8 -10 -2 C -10 -12 -2 -20 8 -20 Z" 
                            fill="none" stroke="#302024" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M -4 20 L 8 20" stroke="#FFFFFF" strokeWidth="13" strokeLinecap="round" />
                      <path d="M -8 20 L 8 20" fill="none" stroke="#302024" strokeWidth="9.5" strokeLinecap="round" />
                    </g>
                  </g>
                </g>

                {/* ==================== CALLOUT BADGES & CONNECTORS ==================== */}

                {/* CALLOUT 1: [01] LONG URL (INPUT) */}
                <g id="calloutLongUrl">
                  <circle cx="320" cy="142" r="4" fill="#302024" />
                  <circle cx="320" cy="142" r="6" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
                  <path d="M 320 142 L 235 82 L 210 82" stroke="#302024" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                  <rect x="42" y="68" width="168" height="28" rx="6" fill="#FFFFFF" stroke="#302024" strokeWidth="1.3" />
                  <text x="126" y="86" textAnchor="middle" fontFamily="monospace" fontSize="9.5" fontWeight="bold" fill="#302024" letterSpacing="0.04em">
                    [01] LONG URL (INPUT)
                  </text>
                </g>

                {/* CALLOUT 2: [02] REDIRECT ENGINE */}
                <g id="calloutRedirectEngine">
                  <circle cx="432" cy="238" r="4" fill="#302024" />
                  <circle cx="432" cy="238" r="6" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
                  <path d="M 432 238 L 485 238" stroke="#302024" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                  <rect x="485" y="224" width="162" height="28" rx="6" fill="#FFFFFF" stroke="#302024" strokeWidth="1.3" />
                  <circle cx="499" cy="238" r="2.2" fill="#302024" />
                  <text x="571" y="242" textAnchor="middle" fontFamily="monospace" fontSize="9.5" fontWeight="bold" fill="#302024" letterSpacing="0.04em">
                    [02] REDIRECT ENGINE
                  </text>
                </g>

                {/* CALLOUT 3: [03] SHORT LINK (OUTPUT) */}
                <g id="calloutShortLink">
                  <circle cx="438" cy="336" r="4" fill="#302024" />
                  <circle cx="438" cy="336" r="6" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
                  <path d="M 438 336 L 472 386 L 478 386" stroke="#302024" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                  <rect x="478" y="372" width="174" height="28" rx="6" fill="#FFFFFF" stroke="#302024" strokeWidth="1.3" />
                  <path d="M 490 386 L 493 381 L 496 386 L 493 391 Z" fill="#302024" />
                  <text x="570" y="390" textAnchor="middle" fontFamily="monospace" fontSize="9.5" fontWeight="bold" fill="#302024" letterSpacing="0.04em">
                    [03] SHORT LINK (OUTPUT)
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Session Recent Links Drawer (Styled in deeper visible Light Plum #EDE2F0) */}
      {recentLinks.length > 0 && (
        <div className="mx-auto max-w-7xl px-6 sm:px-8 py-6">
          <div className="rounded-2xl border border-[#DCC8E2] bg-[#EDE2F0] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#DCC8E2] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#302024]">
                  Recent Session Links
                </span>
                <span className="rounded-full bg-[#DCC8E2] px-2 py-0.5 font-mono text-[10px] font-bold text-[#302024]">
                  {recentLinks.length}
                </span>
              </div>
              <Link href="/dashboard" className="text-xs font-semibold text-[#59171B] hover:text-[#302024] hover:underline font-sans transition">
                Open Dashboard →
              </Link>
            </div>

            <div className="mt-3 divide-y divide-[#DCC8E2]">
              {recentLinks.map((link) => (
                <div key={link.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#302024]">/{link.shortCode}</span>
                    <span className="truncate font-mono text-xs text-[#302024]/80 max-w-xs sm:max-w-md">
                      {link.originalUrl}
                    </span>
                    <span className="font-mono text-[11px] text-[#59171B] shrink-0 font-medium">
                      ({link.clicks} {link.clicks === 1 ? "click" : "clicks"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(link.shortUrl);
                        alert("Copied short URL to clipboard!");
                      }}
                      className="rounded-lg border border-[#DCC8E2] bg-[#F8F2FA] px-3 py-1 font-mono text-xs font-semibold text-[#59171B] hover:bg-white transition shadow-2xs"
                    >
                      Copy
                    </button>
                    <Link
                      href={`/dashboard/analytics/${link.id}`}
                      className="rounded-lg border border-[#DCC8E2] bg-[#F8F2FA] px-3 py-1 font-mono text-xs font-semibold text-[#59171B] hover:bg-white transition shadow-2xs"
                    >
                      Stats
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Below-The-Fold: Distinctive Editorial Capabilities (No generic card grids) */}
      <section id="features" className="scroll-mt-14 border-t border-[#d8c7dc] bg-white py-16 sm:py-24">
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
      <section id="protocol" className="scroll-mt-14 border-t border-[#d8c7dc] bg-white py-20 sm:py-28">
        <span id="how-it-works" className="-mt-14 block" />
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
      <section id="about" className="scroll-mt-14 border-t border-[#d8c7dc] bg-white py-20 sm:py-28">
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
                <li><a href="#protocol" className="hover:opacity-75 transition">Protocol Flow</a></li>
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
