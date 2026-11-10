import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, AtSign } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { signInSchema, type SignInValues } from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/useAuth';
import { toUserMessage } from '@/lib/errors';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

export function SignInPage() {
  useDocumentTitle('Sign in');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/app';
  const [formError, setFormError] = useState<string | null>(null);
  // Bumped on every failed attempt so the alert re-animates even when the message repeats.
  const [attempt, setAttempt] = useState(0);

  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await signIn(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(toUserMessage(err));
      setAttempt((n) => n + 1);
      resetField('password');
      setFocus('password');
    }
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up right where you left off."
      footer={
        <>
          New to Lumen?{' '}
          <Link to="/signup" className="font-medium text-ink-900 underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <Alert key={attempt}>{formError}</Alert>}
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          placeholder="jane@company.com"
          autoComplete="username"
          autoFocus
          spellCheck={false}
          icon={<AtSign />}
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} loadingText="Signing in…">
          Sign in <ArrowRight className="size-4" />
        </Button>
      </form>
    </AuthLayout>
  );
}
