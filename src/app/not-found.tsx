import Link from "next/link";
import { Droplets, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl mb-6">
          <Droplets className="w-8 h-8 text-brand-500" />
        </div>
        <h1 className="text-6xl font-display font-bold text-brand-600 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          Page not found
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8 max-w-xs mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
