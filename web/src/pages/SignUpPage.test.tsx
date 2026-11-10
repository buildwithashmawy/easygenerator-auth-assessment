import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthProvider';
import { SignUpPage } from './SignUpPage';

function renderPage(overrides: Partial<AuthContextValue> = {}) {
  const value: AuthContextValue = {
    user: null,
    status: 'anonymous',
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return value;
}

describe('SignUpPage', () => {
  it('shows field errors and does not submit invalid data', async () => {
    const { signUp } = renderPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Full name'), 'Jo');
    await user.type(screen.getByLabelText('Work email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'weak');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Name must be at least 3 characters')).toBeInTheDocument();
    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/doesn’t meet all requirements/i)).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('ticks password requirements live', async () => {
    renderPage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Password'), 'abc1');
    const list = screen.getByRole('list', { name: /password requirements/i });
    expect(list).toHaveTextContent('One letter(met)');
    expect(list).toHaveTextContent('One number(met)');
    expect(list).toHaveTextContent('At least 8 characters(not met)');
  });

  it('submits normalised values when valid', async () => {
    const signUp = vi.fn().mockResolvedValue({ name: 'Jane Cooper' });
    renderPage({ signUp });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Full name'), '  Jane Cooper ');
    await user.type(screen.getByLabelText('Work email'), 'jane@company.com');
    await user.type(screen.getByLabelText('Password'), 'Passw0rd!');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(signUp).toHaveBeenCalledWith({ name: 'Jane Cooper', email: 'jane@company.com', password: 'Passw0rd!' });
  });
});
