import Link from "next/link";
import BackButton from "@/components/BackButton";

interface PageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function LinkNotFoundPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const code = params?.code;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center text-[#1C1719] font-sans">
      <header className="absolute top-6 left-6">
        <BackButton fallbackHref="/" />
      </header>

      <div className="mx-auto max-w-md rounded-3xl border border-[#d8c7dc] bg-white p-8 sm:p-10 shadow-xs">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-2xl font-bold text-red-700">
          ✕
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1719]">Link Not Found</h1>

        <p className="mt-3 text-sm text-[#1C1719] font-sans">
          The short link{" "}
          {code && (
            <span className="rounded-lg bg-[#f8f5f9] px-2 py-0.5 font-mono text-xs font-bold text-[#1C1719] border border-[#d8c7dc]">
              /{code}
            </span>
          )}{" "}
          does not exist or may have been deleted by its creator.
        </p>

        <div className="mt-8 flex flex-col gap-3 font-sans">
          <Link
            href="/"
            className="w-full rounded-2xl bg-[#403047] px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#302536]"
          >
            Create Your Own Link →
          </Link>
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
