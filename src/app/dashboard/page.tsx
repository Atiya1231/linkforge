"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

interface LinkItem {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title: string | null;
  isGuest: boolean;
  expiresAt: string | null;
  disabledAt: string | null;
  createdAt: string;
  clicks: number;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Delete confirmation & notification state
  const [deleteTarget, setDeleteTarget] = useState<LinkItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // New link form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [userRes, linksRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/links"),
        ]);

        if (ignore) return;

        const userData = await userRes.json();
        if (userData.authenticated) {
          setUser(userData.user);
        }

        const linksData = await linksRes.json();
        if (linksData.links) {
          setLinks(linksData.links);
        }
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (feedback?.type === "success") {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  async function handleCreateLink(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl,
          customAlias: newAlias || undefined,
          title: newTitle || undefined,
          expiresAt: newExpiresAt ? new Date(newExpiresAt).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create link");
      }

      setLinks((prev) => [data.link, ...prev]);
      setNewUrl("");
      setNewAlias("");
      setNewTitle("");
      setNewExpiresAt("");
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error creating link");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(link: LinkItem) {
    const isCurrentlyDisabled = !!link.disabledAt;
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !isCurrentlyDisabled }),
      });
      if (res.ok) {
        setLinks((prev) =>
          prev.map((l) =>
            l.id === link.id
              ? { ...l, disabledAt: isCurrentlyDisabled ? null : new Date().toISOString() }
              : l
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const linkToDelete = deleteTarget;
    setDeleting(true);

    try {
      const res = await fetch(`/api/links/${linkToDelete.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete link");
      }

      // Remove the deleted link from dashboard immediately
      setLinks((prev) => prev.filter((l) => l.id !== linkToDelete.id));

      // Show success message
      setFeedback({
        type: "success",
        message: `Short link /${linkToDelete.shortCode} has been permanently deleted.`,
      });

      setDeleteTarget(null);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete link",
      });
    } finally {
      setDeleting(false);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function openQrModal(url: string) {
    setQrModalUrl(url);
    try {
      const res = await fetch(`/api/qr?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.dataUrl) {
        setQrDataUrl(data.dataUrl);
      }
    } catch (err) {
      console.error("Failed to generate QR", err);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function exportCsv() {
    if (links.length === 0) return;
    const headers = ["Short Code", "Short URL", "Original URL", "Title", "Clicks", "Status", "Created At", "Expires At"];
    const rows = links.map((l) => [
      `"${l.shortCode}"`,
      `"${l.shortUrl}"`,
      `"${l.originalUrl.replace(/"/g, '""')}"`,
      `"${(l.title || "").replace(/"/g, '""')}"`,
      l.clicks,
      l.disabledAt ? "Paused" : (l.expiresAt && new Date(l.expiresAt) < new Date() ? "Expired" : "Active"),
      `"${new Date(l.createdAt).toISOString()}"`,
      `"${l.expiresAt ? new Date(l.expiresAt).toISOString() : "Never"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const dlLink = document.createElement("a");
    dlLink.setAttribute("href", encodedUri);
    dlLink.setAttribute("download", `linkforge-links-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(dlLink);
    dlLink.click();
    document.body.removeChild(dlLink);
  }

  const filteredLinks = links.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.shortCode.toLowerCase().includes(q) ||
      l.originalUrl.toLowerCase().includes(q) ||
      (l.title && l.title.toLowerCase().includes(q))
    );
  });

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const activeCount = links.filter((l) => !l.disabledAt).length;

  return (
    <main className="min-h-screen bg-white text-[#1C1719] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#d8c7dc] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/" />
            <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-[#1C1719] font-sans">
              <span>Link<span className="text-[#1C1719]">Forge</span></span>
              <span className="rounded-full border border-[#d8c7dc] bg-[#e8ddec] px-2.5 py-0.5 font-mono text-xs font-bold text-[#1C1719]">
                Dashboard
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-[#1C1719]">{user.name || "User"}</p>
                  <p className="text-[11px] text-[#1C1719]">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-[#d8c7dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1C1719] hover:bg-[#f8f5f9] transition"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-[#1C1719]">Guest Session</span>
                <Link
                  href="/signup"
                  className="rounded-xl bg-[#403047] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#302536] transition"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            role="alert"
            className={`mb-6 rounded-2xl border p-4 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs animate-fadeIn ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-[#722026]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-sm">
                {feedback.type === "success" ? "✓" : "⚠"}
              </span>
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-700 font-bold px-1.5 py-0.5 rounded transition"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* Guest Warning Banner if applicable */}
        {!user && (
          <div className="mb-6 rounded-3xl border border-[#d8c7dc] bg-[#f8f5f9] p-4 sm:p-5 text-sm text-[#1C1719] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs font-sans">
            <div>
              <span className="font-bold">Guest session active:</span> Your links are saved in this browser. Create an account to permanently sync, manage, and access them anywhere.
            </div>
            <Link
              href="/signup"
              className="shrink-0 rounded-xl bg-[#403047] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#302536] transition text-center"
            >
              Claim & Sync Links →
            </Link>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-[#d8c7dc] bg-white p-6 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1C1719] font-sans">Total Links</p>
            <p className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-[#1C1719]">{links.length}</p>
          </div>
          <div className="rounded-3xl border border-[#d8c7dc] bg-white p-6 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1C1719] font-sans">Total Clicks</p>
            <p className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-[#1C1719]">{totalClicks}</p>
          </div>
          <div className="rounded-3xl border border-[#d8c7dc] bg-white p-6 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1C1719] font-sans">Active Links</p>
            <p className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-[#1C1719]">{activeCount}</p>
          </div>
        </div>

        {/* Action Header */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search links by code, title, or destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-[#d8c7dc] bg-[#f8f5f9] px-4 py-2.5 text-sm text-[#1C1719] outline-none placeholder:text-[#1C1719]/50 focus:border-[#403047] focus:ring-1 focus:ring-[#403047] shadow-xs transition font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            {links.length > 0 && (
              <button
                onClick={exportCsv}
                className="rounded-2xl border border-[#d8c7dc] bg-white px-4 py-2.5 text-xs font-semibold text-[#1C1719] shadow-xs transition hover:bg-[#f8f5f9] flex items-center gap-1.5 font-sans"
                title="Download CSV report of your links"
              >
                <span>📥</span> Export CSV
              </button>
            )}

            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="rounded-2xl bg-[#403047] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#302536] flex items-center justify-center gap-2 font-sans"
            >
              <span>{showCreateForm ? "✕ Cancel" : "+ Shorten New URL"}</span>
            </button>
          </div>
        </div>

        {/* Create Link Drawer / Card */}
        {showCreateForm && (
          <div className="mt-6 rounded-3xl border border-[#d8c7dc] bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1719]">Create a New Short Link</h2>
            {createError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium font-sans">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateLink} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1C1719] uppercase tracking-wider font-sans">Target URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/very-long-url-to-shorten"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#d8c7dc] bg-[#f8f5f9] px-4 py-2.5 text-sm text-[#1C1719] outline-none placeholder:text-[#1C1719]/50 focus:border-[#403047] focus:ring-1 focus:ring-[#403047] font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1719] uppercase tracking-wider font-sans">Custom Alias (Optional)</label>
                <input
                  type="text"
                  placeholder="my-custom-name"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#d8c7dc] bg-[#f8f5f9] px-4 py-2.5 text-sm font-mono text-[#1C1719] outline-none placeholder:text-[#1C1719]/50 focus:border-[#403047] focus:ring-1 focus:ring-[#403047]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1719] uppercase tracking-wider font-sans">Title / Note (Optional)</label>
                <input
                  type="text"
                  placeholder="Product Launch Promo"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#d8c7dc] bg-[#f8f5f9] px-4 py-2.5 text-sm text-[#1C1719] outline-none placeholder:text-[#1C1719]/50 focus:border-[#403047] focus:ring-1 focus:ring-[#403047] font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1719] uppercase tracking-wider font-sans">Expiration Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={newExpiresAt}
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#d8c7dc] bg-[#f8f5f9] px-4 py-2.5 text-sm text-[#1C1719] outline-none focus:border-[#403047] focus:ring-1 focus:ring-[#403047] font-sans"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full rounded-2xl bg-[#403047] py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#302536] disabled:opacity-50 font-sans"
                >
                  {creating ? "Creating..." : "Shorten URL"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Links Table / List */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-[#d8c7dc] bg-white shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-sm text-[#1C1719] font-sans">Loading your links...</div>
          ) : filteredLinks.length === 0 ? (
            <div className="p-12 text-center font-sans">
              <p className="font-serif text-lg font-bold text-[#1C1719]">No links found</p>
              <p className="mt-1 text-sm text-[#1C1719]">
                {search ? "No links matched your search term." : "You haven't shortened any links yet."}
              </p>
              {!search && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4 rounded-xl bg-[#403047] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#302536] transition font-sans"
                >
                  Shorten Your First Link →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-sans">
                <thead className="border-b border-[#d8c7dc] bg-[#f8f5f9] text-xs uppercase tracking-wider text-[#1C1719] font-sans">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Short Code &amp; Destination</th>
                    <th className="px-6 py-4 font-semibold">Clicks</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8c7dc]/60">
                  {filteredLinks.map((link) => {
                    const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                    const isDisabled = !!link.disabledAt;

                    return (
                      <tr key={link.id} className="hover:bg-[#f8f5f9]/60 transition">
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={link.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono font-bold text-[#1C1719] hover:underline flex items-center gap-1"
                              title="Open short link in new tab"
                            >
                              /{link.shortCode}
                              <span className="text-[10px] text-[#1C1719]">↗</span>
                            </a>
                            <button
                              onClick={() => copyToClipboard(link.shortUrl, link.id)}
                              className="rounded-lg border border-[#d8c7dc] bg-white px-2.5 py-0.5 text-xs font-medium text-[#1C1719] hover:bg-[#f8f5f9] transition font-sans"
                            >
                              {copiedId === link.id ? "✓ Copied" : "Copy"}
                            </button>
                            <a
                              href={link.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-[#d8c7dc] bg-white px-2.5 py-0.5 text-xs font-medium text-[#1C1719] hover:bg-[#f8f5f9] transition font-sans"
                              title="Open destination in new tab"
                            >
                              Open ↗
                            </a>
                            <button
                              onClick={() => openQrModal(link.shortUrl)}
                              className="rounded-lg border border-[#d8c7dc] bg-white px-2.5 py-0.5 text-xs font-medium text-[#1C1719] hover:bg-[#f8f5f9] transition font-sans"
                            >
                              QR
                            </button>
                          </div>
                          {link.title && (
                            <p className="mt-1 text-xs font-semibold text-[#1C1719] font-sans">{link.title}</p>
                          )}
                          <a
                            href={link.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 block max-w-md truncate text-xs text-[#1C1719] hover:underline font-sans"
                            title={link.originalUrl}
                          >
                            {link.originalUrl}
                          </a>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-[#e8ddec] px-2.5 py-1 font-mono text-xs font-bold text-[#1C1719]">
                            {link.clicks} clicks
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {isDisabled ? (
                            <span className="inline-flex items-center rounded-full bg-[#f8f5f9] border border-[#d8c7dc] px-2.5 py-0.5 text-xs font-medium text-[#1C1719] font-sans">
                              Paused
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 font-sans">
                              Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-[#e8ddec] px-2.5 py-0.5 text-xs font-semibold text-[#1C1719] font-sans">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 font-mono text-xs font-normal text-[#1C1719]">
                          {new Date(link.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/analytics/${link.id}`}
                              className="rounded-xl border border-[#d8c7dc] bg-white px-3 py-1.5 text-xs font-medium text-[#1C1719] hover:bg-[#f8f5f9] transition font-sans"
                            >
                              Analytics
                            </Link>

                            <button
                              onClick={() => handleToggleStatus(link)}
                              className="rounded-xl border border-[#d8c7dc] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1C1719] hover:bg-[#f8f5f9] transition"
                              title={isDisabled ? "Activate link" : "Pause link"}
                            >
                              {isDisabled ? "▶" : "⏸"}
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(link)}
                              className="group rounded-xl border border-[#d8c7dc] bg-white p-2 text-xs text-[#1C1719] shadow-2xs transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 active:scale-95"
                              title="Delete link"
                              aria-label={`Delete link ${link.shortCode}`}
                            >
                              <svg
                                className="h-3.5 w-3.5 transition-transform duration-150 group-hover:scale-110"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#d8c7dc] bg-white p-6 sm:p-8 text-center shadow-2xl">
            <button
              onClick={() => {
                setQrModalUrl(null);
                setQrDataUrl(null);
              }}
              className="absolute top-4 right-4 text-sm font-bold text-[#1C1719] hover:opacity-75"
            >
              ✕
            </button>

            <h3 className="font-serif text-2xl font-bold text-[#1C1719]">QR Code</h3>
            <p className="mt-1 font-mono text-xs text-[#1C1719] break-all">{qrModalUrl}</p>

            <div className="mt-6 flex justify-center">
              {qrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="h-56 w-56 rounded-2xl border border-[#d8c7dc] bg-white p-3 shadow-xs"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-2xl border border-[#d8c7dc] bg-[#f8f5f9] text-xs text-[#1C1719]">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download="linkforge-qr.png"
                  className="flex-1 rounded-2xl bg-[#403047] py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#302536] transition font-sans text-center"
                >
                  Download PNG
                </a>
              )}
              <button
                onClick={() => {
                  setQrModalUrl(null);
                  setQrDataUrl(null);
                }}
                className="flex-1 rounded-2xl border border-[#d8c7dc] bg-white py-2.5 text-xs font-medium text-[#1C1719] hover:bg-[#f8f5f9] transition font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans animate-fadeIn"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-[#d8c7dc] bg-white p-6 sm:p-8 shadow-2xl text-left">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-700">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="delete-dialog-title" className="font-serif text-xl font-bold text-[#1C1719]">
                  Delete Short Link
                </h3>
                <p className="font-mono text-xs font-bold text-[#1C1719] mt-0.5">
                  /{deleteTarget.shortCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!deleting) setDeleteTarget(null);
                }}
                className="text-[#1C1719] hover:opacity-75 font-bold text-sm px-1"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p className="mt-4 text-sm text-[#1C1719] leading-relaxed">
              Are you sure you want to delete this link? This action cannot be undone.
            </p>

            {/* Target details summary */}
            <div className="mt-3.5 rounded-2xl border border-[#d8c7dc] bg-[#f8f5f9] p-3 font-mono text-xs text-[#1C1719]">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#1C1719]">
                <span>Destination URL</span>
                <span>{deleteTarget.clicks} clicks</span>
              </div>
              <p className="truncate mt-1 text-[#1C1719] font-medium" title={deleteTarget.originalUrl}>
                {deleteTarget.originalUrl}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 font-sans">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-[#d8c7dc] bg-white px-4 py-2 text-xs font-semibold text-[#1C1719] transition hover:bg-[#f8f5f9] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-red-700 px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-red-800 disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Link</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
