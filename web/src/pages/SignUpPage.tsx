import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, AtSign, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { PasswordRequirements } from '@/features/auth/PasswordRequirements';
import { signUpSchema, type SignUpValues } from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/useAuth';
import { ApiError } from '@/lib/api';
import { toUserMessage } from '@/lib/errors';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

export function SignUpPage() {
  useDocumentTitle('Create your account');
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '' },
  });
  const password = watch('password');

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setEmailTaken(false);
    try {
      const user = await signUp(values);
      toast.success(`Welcome aboard, ${user.name.split(' ')[0]}!`);
      navigate('/app', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setEmailTaken(true);
        setError('email', { message: 'An account with this email already exists.' }, { shouldFocus: true });
      } else {
        setFormError(toUserMessage(err));
      }
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start building courses in minutes. No credit card required."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/signin" className="font-medium text-ink-900 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <Alert>{formError}</Alert>}
        <TextField
          label="Full name"
          placeholder="Jane Cooper"
          autoComplete="name"
          autoFocus
          icon={<UserRound />}
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="Work email"
          type="email"
          inputMode="email"
          placeholder="jane@company.com"
          autoComplete="email"
          spellCheck={false}
          icon={<AtSign />}
          error={errors.email?.message}
          {...register('email', { onChange: () => setEmailTaken(false) })}
        />
        {emailTaken && (
          <p className="-mt-3 text-[13px] text-ink-500">
            Is it you?{' '}
            <Link to="/signin" className="font-medium text-ink-900 underline underline-offset-4">
              Sign in instead
            </Link>
          </p>
        )}
        <div className="space-y-2">
          <PasswordField
            label="Password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordRequirements value={password} />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} loadingText="Creating account…">
          Create account <ArrowRight className="size-4" />
        </Button>
        <p className="text-center text-xs leading-5 text-ink-400">
          By creating an account you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
}
