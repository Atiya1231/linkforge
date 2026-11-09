"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;
}

export default function BackButton({
  fallbackHref = "/",
  label = "Back",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined") {
      const referrer = document.referrer;
      const origin = window.location.origin;
      const currentPath = window.location.pathname;

      // Ensure referrer is internal to our application and not the current page
      const isInternal = referrer && referrer.startsWith(origin);
      const isDifferentPath = isInternal && !referrer.endsWith(currentPath);

      if (window.history.length > 1 && isInternal && isDifferentPath) {
        e.preventDefault();
        router.back();
      }
      // If no valid internal history exists, default Link navigation to fallbackHref occurs safely.
    }
  };

  return (
    <Link
      href={fallbackHref}
      onClick={handleBack}
      className={`group inline-flex items-center gap-1.5 rounded-xl border border-[#d8c7dc] bg-white px-3 py-1.5 font-sans text-xs font-semibold text-[#1C1719] shadow-xs transition hover:border-[#1C1719] hover:bg-[#f8f5f9] hover:text-[#1C1719] active:scale-98 ${className}`}
      aria-label={label}
    >
      <svg
        className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2.4"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      <span>{label}</span>
    </Link>
  );
}

