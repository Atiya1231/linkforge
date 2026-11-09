import Link from "next/link";
import BackButton from "@/components/BackButton";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center text-[#1C1719] font-sans">
      <header className="absolute top-6 left-6">
        <BackButton fallbackHref="/" />
      </header>

      <div className="mx-auto max-w-md rounded-3xl border border-[#d8c7dc] bg-white p-8 sm:p-10 shadow-xs">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d8c7dc] bg-[#e8ddec] font-mono text-2xl font-bold text-[#1C1719]">
          404
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1719]">Page Not Found</h1>

        <p className="mt-3 text-sm text-[#1C1719] font-sans">
          The page you are looking for doesn&apos;t exist, has been removed, or is temporarily unavailable.
        </p>

        <div className="mt-8 flex flex-col gap-3 font-sans">
          <Link
            href="/"
            className="w-full rounded-2xl bg-[#403047] px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#302536]"
          >
            Back to LinkForge Home →
          </Link>
          <Link
            href="/dashboard"
            className="w-full rounded-2xl border border-[#d8c7dc] bg-white px-5 py-3 text-sm font-medium text-[#1C1719] hover:bg-[#f8f5f9] transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
