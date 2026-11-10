import { clsx } from 'clsx';

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill={inverted ? '#ffffff' : '#14122b'} fillOpacity={inverted ? 0.08 : 1} />
        <path d="M9 21.5 15.5 9l7.5 12.5" fill="none" stroke="#c8f169" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="15.5" cy="22" r="2.2" fill="#ff8a5c" />
      </svg>
      <span className={clsx('font-display text-xl font-semibold tracking-tight', inverted ? 'text-white' : 'text-ink-900')}>
        Lumen
      </span>
    </span>
  );
}
