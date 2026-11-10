import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
}

const variants = {
  primary:
    'bg-ink-900 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_2px_rgb(20_18_43/0.2)] hover:bg-ink-800 active:bg-ink-950',
  secondary: 'bg-white text-ink-900 ring-1 ring-ink-200 hover:bg-ink-50 hover:ring-ink-300',
  ghost: 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
};

const sizes = { md: 'h-10 px-4 text-sm', lg: 'h-12 px-5 text-[15px]' };

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'relative inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium transition-[background-color,box-shadow,transform] duration-150',
        'focus-visible:ring-4 focus-visible:ring-violet/30 active:scale-[0.99]',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading && <Spinner />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
