import { clsx } from 'clsx';

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={clsx('size-4 animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-live="polite">
      <Spinner className="size-6 text-ink-500" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
