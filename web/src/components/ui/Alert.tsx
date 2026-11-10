import { clsx } from 'clsx';
import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

export function Alert({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-3 rounded-xl bg-danger/[0.06] px-4 py-3 text-sm text-danger ring-1 ring-danger/20 animate-shake',
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="leading-5">{children}</div>
    </div>
  );
}
