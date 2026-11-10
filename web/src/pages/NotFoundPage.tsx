import { Link } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="animate-rise">
        <Logo className="justify-center" />
        <p className="mt-10 font-display text-7xl font-semibold tracking-tight text-ink-200">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">This page wandered off</h1>
        <p className="mt-2 text-ink-500">The link may be broken or the page may have moved.</p>
        <Link
          to="/"
          className="mt-8 inline-flex h-11 items-center rounded-xl bg-ink-900 px-5 text-sm font-medium text-white hover:bg-ink-800"
        >
          Back to safety
        </Link>
      </div>
    </main>
  );
}
