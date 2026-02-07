/**
 * Tests for SignUpPage component.
 *
 * Validates:
 * - Form renders with name / email / password fields
 * - Submit calls signUp.email with correct params
 * - Error state renders on failure
 * - Navigation link to sign-in page
 * - Button disabled during loading
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SignUpPage from '@/pages/sign-up';

// Mock auth-client
const mockSignUpEmail = vi.fn();

vi.mock('@/lib/auth-client', () => ({
  signIn: { email: vi.fn(), social: vi.fn() },
  signUp: {
    email: (...args: unknown[]) => mockSignUpEmail(...args),
  },
  signOut: vi.fn(),
  useSession: vi.fn(() => ({ data: null, isPending: false })),
  authClient: {},
}));

function renderSignUp() {
  return render(
    <MemoryRouter initialEntries={['/sign-up']}>
      <Routes>
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/sign-in" element={<div data-testid="sign-in-page" />} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SignUpPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render name, email, and password fields', () => {
    renderSignUp();

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should render the submit button', () => {
    renderSignUp();

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should have a link to sign-in page', () => {
    renderSignUp();

    const link = screen.getByRole('link', { name: /sign in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/sign-in');
  });

  it('should call signUp.email with correct params on submit', async () => {
    mockSignUpEmail.mockImplementation((_data: unknown, callbacks: { onSuccess?: () => void }) => {
      callbacks.onSuccess?.();
      return Promise.resolve();
    });

    renderSignUp();

    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecureP@ss123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledTimes(1);
    });

    const [data] = mockSignUpEmail.mock.calls[0];
    expect(data).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecureP@ss123',
    });
  });

  it('should display error message on sign-up failure', async () => {
    mockSignUpEmail.mockImplementation((_data: unknown, callbacks: { onError?: (ctx: { error: { message: string } }) => void }) => {
      callbacks.onError?.({ error: { message: 'Email already exists' } });
      return Promise.resolve();
    });

    renderSignUp();

    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    mockSignUpEmail.mockReturnValue(new Promise(() => {}));

    renderSignUp();

    await user.type(screen.getByLabelText(/full name/i), 'John');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });
  });

  it('should show generic error on unexpected exception', async () => {
    mockSignUpEmail.mockRejectedValue(new Error('Network error'));

    renderSignUp();

    await user.type(screen.getByLabelText(/full name/i), 'John');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  it('should display page title and subtitle', () => {
    renderSignUp();

    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByText('Start your 14-day free trial')).toBeInTheDocument();
  });
});
