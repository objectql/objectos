/**
 * Tests for SignInPage component.
 *
 * Validates:
 * - Form renders with email / password fields
 * - Submit calls signIn.email with correct params
 * - Error state renders on failure
 * - Navigation links to sign-up and forgot-password
 * - Button disabled during loading
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SignInPage from '@/pages/sign-in';

// Mock auth-client
const mockSignInEmail = vi.fn();

vi.mock('@/lib/auth-client', () => ({
  signIn: {
    email: (...args: unknown[]) => mockSignInEmail(...args),
    social: vi.fn(),
  },
  signUp: { email: vi.fn() },
  signOut: vi.fn(),
  useSession: vi.fn(() => ({ data: null, isPending: false })),
  authClient: {},
}));

function renderSignIn() {
  return render(
    <MemoryRouter initialEntries={['/sign-in']}>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<div data-testid="sign-up-page" />} />
        <Route path="/forgot-password" element={<div data-testid="forgot-password-page" />} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SignInPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email and password fields', () => {
    renderSignIn();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should render the submit button', () => {
    renderSignIn();

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should have a link to sign-up page', () => {
    renderSignIn();

    const link = screen.getByRole('link', { name: /sign up/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/sign-up');
  });

  it('should have a link to forgot-password page', () => {
    renderSignIn();

    const link = screen.getByRole('link', { name: /forgot password/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/forgot-password');
  });

  it('should call signIn.email with correct params on submit', async () => {
    mockSignInEmail.mockImplementation((_data: unknown, callbacks: { onSuccess?: () => void }) => {
      callbacks.onSuccess?.();
      return Promise.resolve();
    });

    renderSignIn();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecureP@ss123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledTimes(1);
    });

    const [data] = mockSignInEmail.mock.calls[0];
    expect(data).toEqual({
      email: 'test@example.com',
      password: 'SecureP@ss123',
    });
  });

  it('should display error message on sign-in failure', async () => {
    mockSignInEmail.mockImplementation((_data: unknown, callbacks: { onError?: (ctx: { error: { message: string } }) => void }) => {
      callbacks.onError?.({ error: { message: 'Invalid credentials' } });
      return Promise.resolve();
    });

    renderSignIn();

    await user.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    // signIn.email never resolves — simulates pending state
    mockSignInEmail.mockReturnValue(new Promise(() => {}));

    renderSignIn();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });
  });

  it('should show generic error on unexpected exception', async () => {
    mockSignInEmail.mockRejectedValue(new Error('Network error'));

    renderSignIn();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });
});
