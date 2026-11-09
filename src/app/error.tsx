"use client";

import { useEffect } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("LinkForge Runtime Error:", error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center text-[#1C1719] font-sans">
      <header className="absolute top-6 left-6">
        <BackButton fallbackHref="/" />
      </header>

      <div className="mx-auto max-w-md rounded-3xl border border-red-200 bg-white p-8 sm:p-10 shadow-xs">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-2xl font-bold text-red-700">
          !
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1719]">Something went wrong</h1>

        <p className="mt-3 text-sm text-[#1C1719] font-sans">
          An unexpected error occurred. Our team has been notified and is working to resolve it.
        </p>

        <div className="mt-8 flex flex-col gap-3 font-sans">
          <button
            onClick={() => reset()}
            className="w-full rounded-2xl bg-[#403047] px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#302536]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full rounded-2xl border border-[#d8c7dc] bg-white px-5 py-3 text-sm font-medium text-[#1C1719] hover:bg-[#f8f5f9] transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
