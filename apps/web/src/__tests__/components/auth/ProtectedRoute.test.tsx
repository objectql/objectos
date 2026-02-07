/**
 * Tests for ProtectedRoute component.
 *
 * Validates:
 * - Shows loader when session is pending
 * - Redirects to /sign-in when no session
 * - Renders child route (Outlet) when session exists
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Mock useSession from auth-client
const mockUseSession = vi.fn();

vi.mock('@/lib/auth-client', () => ({
  useSession: (...args: unknown[]) => mockUseSession(...args),
}));

function renderWithRouter(initialRoute = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div data-testid="protected-content">Protected</div>} />
        </Route>
        <Route path="/sign-in" element={<div data-testid="sign-in-page">Sign In</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loader when session is pending', () => {
    mockUseSession.mockReturnValue({ data: null, isPending: true });
    renderWithRouter();

    // Loader2 renders an SVG with animate-spin class
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sign-in-page')).not.toBeInTheDocument();
  });

  it('should redirect to /sign-in when no session', () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    renderWithRouter();

    expect(screen.getByTestId('sign-in-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should redirect to /sign-in when session has no user', () => {
    mockUseSession.mockReturnValue({ data: { user: null }, isPending: false });
    renderWithRouter();

    expect(screen.getByTestId('sign-in-page')).toBeInTheDocument();
  });

  it('should render child route when session exists', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', email: 'test@example.com', name: 'Test' } },
      isPending: false,
    });
    renderWithRouter();

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('sign-in-page')).not.toBeInTheDocument();
  });
});
