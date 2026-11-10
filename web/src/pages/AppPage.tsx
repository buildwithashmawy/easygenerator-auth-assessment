import { CalendarDays, ChevronDown, LogOut, Mail, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/features/auth/useAuth';
import { api, type User } from '@/lib/api';
import { toUserMessage } from '@/lib/errors';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

export function AppPage() {
  useDocumentTitle('Home');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast('You’ve been signed out.');
    } finally {
      navigate('/signin', { replace: true });
    }
  };

  if (!user) return null;
  const firstName = user.name.split(' ')[0];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-ink-100 bg-paper/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Logo />
          <UserMenu user={user} onSignOut={handleSignOut} signingOut={signingOut} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <section className="relative overflow-hidden rounded-[28px] bg-ink-900 px-8 py-12 text-white sm:px-12 sm:py-16 animate-rise">
          <div className="absolute -right-24 -top-32 size-[420px] rounded-full bg-violet/40 blur-[110px]" />
          <div className="absolute -bottom-40 left-10 size-[360px] rounded-full bg-lime/15 blur-[110px]" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10">
              <span className="size-1.5 rounded-full bg-lime shadow-[0_0_10px_#c8f169]" /> Signed in as {firstName}
            </p>
            <h1 className="mt-6 max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[56px]">
              Welcome to the application.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-6 text-white/60">
              Good to see you, {firstName}. Your session is active and protected — everything below was
              loaded from a protected API endpoint.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleSignOut}
                loading={signingOut}
                loadingText="Signing out…"
                className="!bg-white !ring-0 hover:!bg-lime"
              >
                <LogOut className="size-4" /> Sign out
              </Button>
            </div>
          </div>
        </section>

        <ProfileFromProtectedEndpoint />
      </main>
    </div>
  );
}

/** Calls GET /api/users/me (JWT-protected) to show the guard working end to end. */
function ProfileFromProtectedEndpoint() {
  const [state, setState] = useState<{ data?: User; error?: string; loading: boolean }>({ loading: true });

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    api
      .me()
      .then((data) => setState({ data, loading: false }))
      .catch((err: unknown) => setState({ error: toUserMessage(err), loading: false }));
  };
  useEffect(load, []);

  const { data, error, loading } = state;
  const memberSince = data
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(data.createdAt))
    : '';

  return (
    <section className="mt-10 animate-rise [animation-delay:120ms]" aria-labelledby="account-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="account-heading" className="font-display text-xl font-semibold tracking-tight">
            Your account
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Fetched from <code className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[12px] text-ink-800">GET /api/users/me</code>
          </p>
        </div>
        <Button variant="ghost" onClick={load} disabled={loading} aria-label="Reload account details">
          {loading ? <Spinner /> : <RefreshCw className="size-4" />} Refresh
        </Button>
      </div>

      {error ? (
        <p role="alert" className="mt-5 rounded-2xl bg-danger/[0.06] p-5 text-sm text-danger ring-1 ring-danger/20">
          {error}
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard icon={<UserRound />} label="Name" value={data?.name} loading={loading} />
          <InfoCard icon={<Mail />} label="Email" value={data?.email} loading={loading} />
          <InfoCard icon={<CalendarDays />} label="Member since" value={memberSince} loading={loading} />
          <InfoCard
            icon={<ShieldCheck />}
            label="Session"
            value="httpOnly · auto-refresh"
            loading={loading}
            accent
          />
        </div>
      )}
    </section>
  );
}

function InfoCard({
  icon,
  label,
  value,
  loading,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-100">
      <span
        className={`grid size-9 place-items-center rounded-xl [&>svg]:size-[18px] ${accent ? 'bg-lime text-ink-900' : 'bg-ink-50 text-ink-700'}`}
      >
        {icon}
      </span>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-ink-400">{label}</p>
      {loading && !value ? (
        <span className="mt-2 block h-5 w-3/4 animate-pulse rounded-md bg-ink-100" />
      ) : (
        <p className="mt-1 truncate text-[15px] font-medium text-ink-900" title={value}>
          {value}
        </p>
      )}
    </div>
  );
}

function UserMenu({ user, onSignOut, signingOut }: { user: User; onSignOut: () => void; signingOut: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-ink-100 focus-visible:ring-4 focus-visible:ring-violet/25"
      >
        <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-violet to-coral text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden text-sm font-medium sm:block">{user.name}</span>
        <ChevronDown className={`size-4 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-white p-1.5 shadow-card ring-1 ring-ink-100 animate-rise"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-ink-500">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-ink-100" />
          <button
            role="menuitem"
            type="button"
            onClick={onSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-700 transition-colors hover:bg-ink-50 hover:text-danger disabled:opacity-60"
          >
            {signingOut ? <Spinner /> : <LogOut className="size-4" />} Sign out
          </button>
        </div>
      )}
    </div>
  );
}
