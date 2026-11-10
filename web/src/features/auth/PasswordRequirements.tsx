import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { passwordRules, passwordScore } from './schemas';

const levels = [
  { label: 'Too weak', color: 'bg-danger', text: 'text-danger' },
  { label: 'Too weak', color: 'bg-danger', text: 'text-danger' },
  { label: 'Almost there', color: 'bg-coral', text: 'text-coral' },
  { label: 'Good', color: 'bg-lime-600', text: 'text-lime-600' },
  { label: 'Strong', color: 'bg-success', text: 'text-success' },
];

/** Live checklist + strength meter, so users fix the password while typing, not after submit. */
export function PasswordRequirements({ value, id }: { value: string; id?: string }) {
  const score = passwordScore(value);
  const level = levels[Math.floor(score)];

  return (
    <div id={id} className="space-y-3 pt-1">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className="h-1.5 overflow-hidden rounded-full bg-ink-100">
              <span
                className={clsx(
                  'block h-full rounded-full transition-all duration-300 ease-out',
                  score >= step - 0.5 && value ? level.color : 'bg-transparent',
                  score >= step - 0.5 && value ? 'w-full' : 'w-0',
                )}
              />
            </span>
          ))}
        </div>
        <span
          className={clsx('w-24 text-right text-xs font-medium transition-colors', value ? level.text : 'text-ink-400')}
          aria-live="polite"
        >
          {value ? level.label : 'Strength'}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5" aria-label="Password requirements">
        {passwordRules.map((rule) => {
          const ok = rule.test(value);
          return (
            <li
              key={rule.id}
              className={clsx('flex items-center gap-2 text-[13px] transition-colors', ok ? 'text-ink-800' : 'text-ink-500')}
            >
              <span
                className={clsx(
                  'grid size-4 shrink-0 place-items-center rounded-full transition-all duration-200',
                  ok ? 'scale-100 bg-success text-white' : 'scale-90 bg-ink-100 text-transparent',
                )}
                aria-hidden="true"
              >
                <Check className="size-2.5" strokeWidth={4} />
              </span>
              {rule.label}
              <span className="sr-only">{ok ? '(met)' : '(not met)'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
