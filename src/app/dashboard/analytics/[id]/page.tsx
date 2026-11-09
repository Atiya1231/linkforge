"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

interface ClickItem {
  id: string;
  clickedAt: string;
  referrer: string | null;
  userAgent: string | null;
  country: string | null;
  deviceType: string | null;
}

interface AnalyticsData {
  link: {
    id: string;
    originalUrl: string;
    shortCode: string;
    shortUrl: string;
    title: string | null;
    expiresAt: string | null;
    disabledAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  analytics: {
    totalClicks: number;
    recentClicks: ClickItem[];
    deviceCounts: Record<string, number>;
    referrerCounts: Record<string, number>;
    countryCounts: Record<string, number>;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AnalyticsPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let ignore = false;

    fetch(`/api/links/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load analytics");
        }
        return res.json();
      })
      .then((json) => {
        if (!ignore) setData(json);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  function copyShortUrl() {
    if (!data?.link.shortUrl) return;
    navigator.clipboard.writeText(data.link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-8 text-[#1C1719] font-sans">
        <div className="mx-auto max-w-5xl text-center text-sm font-medium text-[#1C1719]">Loading analytics...</div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-white p-6 text-[#1C1719] font-sans">
        <header className="absolute top-6 left-6">
          <BackButton fallbackHref="/dashboard" label="Back to Dashboard" />
        </header>
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xs">
          <p className="text-red-700 font-semibold">{error || "Analytics not available"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 rounded-xl bg-[#403047] px-4 py-2 text-xs font-semibold text-white hover:bg-[#302536] transition shadow-xs font-sans"
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const { link, analytics } = data;
  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
  const isDisabled = !!link.disabledAt;

  return (
    <main className="min-h-screen bg-white text-[#1C1719] font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-[#d8c7dc] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <BackButton fallbackHref="/dashboard" label="Back to Dashboard" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#1C1719] font-bold">/{link.shortCode}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {/* Link Header Card */}
        <div className="rounded-3xl border border-[#d8c7dc] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1719] tracking-tight">
                  {link.title || `/${link.shortCode}`}
                </h1>
                {isDisabled ? (
                  <span className="rounded-full bg-[#f8f5f9] border border-[#d8c7dc] px-3 py-0.5 text-xs font-medium text-[#1C1719] font-sans">
                    Paused
                  </span>
                ) : isExpired ? (
                  <span className="rounded-full border border-red-200 bg-red-50 px-3 py-0.5 text-xs font-medium text-red-700 font-sans">
                    Expired
                  </span>
                ) : (
                  <span className="rounded-full bg-[#e8ddec] px-3 py-0.5 text-xs font-semibold text-[#1C1719] font-sans">
                    Active
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-[#1C1719] break-all font-sans">
                Destination:{" "}
                <a
                  href={link.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[#1C1719] hover:underline"
                >
                  {link.originalUrl}
                </a>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={copyShortUrl}
                className="rounded-xl bg-[#403047] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#302536] transition font-sans"
              >
                {copied ? "✓ Copied to Clipboard" : "Copy Short URL"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-[#d8c7dc] bg-white p-6 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1C1719] font-sans">Total Clicks</p>
            <p className="mt-2 font-serif text-4xl font-bold text-[#1C1719]">{analytics.totalClicks}</p>
          </div>
          <div className="rounded-3xl border border-[#d8c7dc] bg-white p-6 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1C1719] font-sans">Created Date</p>
            <p className="mt-2 font-mono text-base font-bold text-[#1C1719]">
              {new Date(link.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="rounded-3xl border border-[#d8c7dc] bg-white p-6 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1C1719] font-sans">Expiration</p>
            <p className="mt-2 font-mono text-base font-bold text-[#1C1719]">
              {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "Never"}
            </p>
          </div>
          <div className="rounded-3xl border border-[#d8c7dc] bg-white p-6 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1C1719] font-sans">Top Device</p>
            <p className="mt-2 font-sans text-base font-bold text-[#1C1719]">
              {Object.keys(analytics.deviceCounts)[0] || "None yet"}
            </p>
          </div>
        </div>

        {/* Breakdown Sections */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Device Breakdown */}
          <div className="rounded-3xl border border-[#d8c7dc] bg-white p-6 sm:p-7 shadow-xs">
            <h3 className="font-serif text-base font-bold tracking-tight text-[#1C1719]">Device Breakdown</h3>
            {Object.keys(analytics.deviceCounts).length === 0 ? (
              <p className="mt-4 text-xs text-[#1C1719] font-sans">No clicks recorded yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {Object.entries(analytics.deviceCounts).map(([device, count]) => {
                  const pct = Math.round((count / (analytics.totalClicks || 1)) * 100);
                  return (
                    <div key={device}>
                      <div className="flex justify-between text-xs font-sans">
                        <span className="font-semibold text-[#1C1719]">{device}</span>
                        <span className="font-mono text-[#1C1719]">{count} ({pct}%)</span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full rounded-full bg-[#f8f5f9] border border-[#d8c7dc]/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#403047]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Referrer Breakdown */}
          <div className="rounded-3xl border border-[#d8c7dc] bg-white p-6 sm:p-7 shadow-xs">
            <h3 className="font-serif text-base font-bold tracking-tight text-[#1C1719]">Top Referrers</h3>
            {Object.keys(analytics.referrerCounts).length === 0 ? (
              <p className="mt-4 text-xs text-[#1C1719] font-sans">No referrer data recorded yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {Object.entries(analytics.referrerCounts).map(([ref, count]) => {
                  const pct = Math.round((count / (analytics.totalClicks || 1)) * 100);
                  return (
                    <div key={ref}>
                      <div className="flex justify-between text-xs font-sans">
                        <span className="font-semibold text-[#1C1719]">{ref}</span>
                        <span className="font-mono text-[#1C1719]">{count} ({pct}%)</span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full rounded-full bg-[#f8f5f9] border border-[#d8c7dc]/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#403047] to-[#725c76]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Click Activity Log */}
        <div className="mt-6 rounded-3xl border border-[#d8c7dc] bg-white p-6 sm:p-8 shadow-xs">
          <h3 className="font-serif text-base font-bold tracking-tight text-[#1C1719]">Recent Click Log</h3>
          {analytics.recentClicks.length === 0 ? (
            <p className="mt-4 text-xs text-[#1C1719] font-sans">No clicks recorded yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="border-b border-[#d8c7dc] bg-[#f8f5f9] text-[#1C1719] font-semibold">
                  <tr>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Timestamp</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Device</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Referrer</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8c7dc]/60 text-[#1C1719]">
                  {analytics.recentClicks.map((click) => (
                    <tr key={click.id} className="hover:bg-[#f8f5f9]/60 transition">
                      <td className="py-3 px-4 font-mono font-medium text-[#1C1719]">
                        {new Date(click.clickedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium">{click.deviceType || "Desktop"}</td>
                      <td className="py-3 px-4 truncate max-w-xs font-medium">{click.referrer || "Direct"}</td>
                      <td className="py-3 px-4 font-medium">{click.country || "Global / Unknown"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
