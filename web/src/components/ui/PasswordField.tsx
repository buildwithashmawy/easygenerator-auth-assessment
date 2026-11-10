import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { TextField, type TextFieldProps } from './TextField';

/** Password input with a visibility toggle and a Caps Lock warning. */
export function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing' | 'icon'>) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const detectCaps = (e: KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(e.getModifierState?.('CapsLock') ?? false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      icon={<LockKeyhole />}
      spellCheck={false}
      autoCapitalize="none"
      onKeyUp={detectCaps}
      onKeyDown={detectCaps}
      hint={
        capsLock && !props.error ? (
          <span className="font-medium text-coral">Caps Lock is on</span>
        ) : (
          props.hint
        )
      }
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="grid size-9 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-800 focus-visible:ring-2 focus-visible:ring-violet/40"
        >
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      }
    />
  );
}
