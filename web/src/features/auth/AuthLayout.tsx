import { BookOpenCheck, Check, PlayCircle, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <main className="flex flex-col px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <Logo />
        <div className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-[400px] animate-rise">
            <h1 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900">
              {title}
            </h1>
            <p className="mt-3 text-[15px] leading-6 text-ink-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-8 text-center text-sm text-ink-500">{footer}</p>
          </div>
        </div>
        <p className="text-xs text-ink-400">© {new Date().getFullYear()} Lumen Learning. A demo authentication module.</p>
      </main>
      <BrandPanel />
    </div>
  );
}

function BrandPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative m-3 hidden overflow-hidden rounded-[28px] bg-ink-900 text-white lg:flex lg:flex-col"
    >
      {/* Ambient light + fine grid */}
      <div className="absolute -right-40 -top-40 size-[520px] rounded-full bg-violet/40 blur-[120px]" />
      <div className="absolute -bottom-48 -left-24 size-[420px] rounded-full bg-lime/20 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse at 60% 40%, black 30%, transparent 75%)',
        }}
      />

      <div className="relative flex flex-1 flex-col justify-between p-12 xl:p-16">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10">
          <Sparkles className="size-3.5 text-lime" /> Course authoring, simplified
        </span>

        <div className="relative mx-auto my-10 w-full max-w-[400px]">
          <CourseCard />
          <div className="absolute -bottom-6 -left-8 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-ink-900 shadow-lift animate-rise [animation-delay:400ms]">
            <span className="grid size-9 place-items-center rounded-xl bg-lime">
              <BookOpenCheck className="size-[18px]" />
            </span>
            <div>
              <p className="text-sm font-semibold">Course published</p>
              <p className="text-xs text-ink-500">248 learners enrolled today</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="max-w-md font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.025em]">
            Turn what your team knows into courses people <span className="text-lime">finish</span>.
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-6 text-white/60">
            Build, share and track learning in one calm workspace. Your account is protected with
            httpOnly session cookies and rotating refresh tokens.
          </p>
        </div>
      </div>
    </aside>
  );
}

function CourseCard() {
  const modules = [
    { title: 'Welcome & goals', done: true },
    { title: 'Product fundamentals', done: true },
    { title: 'Handling objections', done: false, active: true },
    { title: 'Final assessment', done: false },
  ];
  return (
    <div className="rounded-3xl bg-white/[0.06] p-5 shadow-lift ring-1 ring-white/10 backdrop-blur-xl animate-float">
      <div className="h-28 rounded-2xl bg-[radial-gradient(circle_at_20%_20%,#c8f169,transparent_45%),radial-gradient(circle_at_90%_70%,#ff8a5c,transparent_50%),linear-gradient(135deg,#7c6cff,#3a3760)] p-4">
        <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
          Sales onboarding · 4 modules
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-semibold">Selling with confidence</p>
          <p className="text-xs text-white/50">Updated 2 hours ago</p>
        </div>
        <ProgressRing value={62} />
      </div>
      <ul className="mt-4 space-y-2">
        {modules.map((m) => (
          <li
            key={m.title}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${m.active ? 'bg-white/10 ring-1 ring-white/15' : ''}`}
          >
            {m.done ? (
              <span className="grid size-5 place-items-center rounded-full bg-lime text-ink-900">
                <Check className="size-3" strokeWidth={3.5} />
              </span>
            ) : m.active ? (
              <PlayCircle className="size-5 text-coral" />
            ) : (
              <span className="size-5 rounded-full ring-1 ring-white/25" />
            )}
            <span className={m.done ? 'text-white/50 line-through decoration-white/30' : 'text-white/90'}>
              {m.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-12 place-items-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#c8f169"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <span className="text-[11px] font-semibold">{value}%</span>
    </div>
  );
}
