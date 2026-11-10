import { clsx } from 'clsx';
import { CircleAlert } from 'lucide-react';
import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  /** Rendered inside the input on the right (e.g. a visibility toggle). */
  trailing?: ReactNode;
  /** Rendered beside the label on the right (e.g. "Forgot password?"). */
  labelAside?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function TextField({
  label,
  error,
  hint,
  icon,
  trailing,
  labelAside,
  className,
  id,
  ref,
  ...props
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={clsx('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={inputId} className="text-sm font-medium text-ink-800">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="group relative">
        {icon && (
          <span
            className={clsx(
              'pointer-events-none absolute inset-y-0 left-3.5 flex items-center transition-colors [&>svg]:size-[18px]',
              error ? 'text-danger' : 'text-ink-400 group-focus-within:text-ink-800',
            )}
          >
            {icon}
          </span>
        )}
        <input
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={clsx(
            'h-12 w-full rounded-xl bg-white text-[15px] text-ink-900 ring-1 transition-[box-shadow,background-color] duration-150 placeholder:text-ink-400',
            'shadow-[0_1px_2px_rgb(20_18_43/0.04)] outline-none',
            icon ? 'pl-11' : 'pl-3.5',
            trailing ? 'pr-12' : 'pr-3.5',
            error
              ? 'ring-danger/70 focus:ring-2 focus:ring-danger focus:shadow-[0_0_0_4px_rgb(201_58_58/0.12)]'
              : 'ring-ink-200 hover:ring-ink-300 focus:ring-2 focus:ring-ink-900 focus:shadow-[0_0_0_4px_rgb(124_108_255/0.15)]',
          )}
        />
        {trailing && <span className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</span>}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-[13px] leading-5 text-danger animate-rise">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <div id={hintId} className="text-[13px] leading-5 text-ink-500">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
