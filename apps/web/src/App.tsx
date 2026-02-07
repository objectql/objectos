import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy-loaded pages for code splitting
const HomePage = lazy(() => import('./pages/home'));
const SignInPage = lazy(() => import('./pages/sign-in'));
const SignUpPage = lazy(() => import('./pages/sign-up'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password'));
const DashboardPage = lazy(() => import('./pages/dashboard'));
const CreateOrganizationPage = lazy(() => import('./pages/organization/create'));
const MembersPage = lazy(() => import('./pages/organization/members'));
const InvitationsPage = lazy(() => import('./pages/organization/invitations'));
const OrganizationSettingsPage = lazy(() => import('./pages/organization/settings'));

export function App() {
  const fallback = (
    <div className="flex min-h-svh items-center justify-center">
      <div className="animate-spin rounded-full size-8 border-2 border-muted border-t-primary" />
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/organization/create" element={<CreateOrganizationPage />} />
          <Route path="/organization/members" element={<MembersPage />} />
          <Route path="/organization/invitations" element={<InvitationsPage />} />
          <Route path="/organization/settings" element={<OrganizationSettingsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
