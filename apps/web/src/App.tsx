import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy-loaded pages for code splitting
const HomePage = lazy(() => import('./pages/home'));
const SignInPage = lazy(() => import('./pages/sign-in'));
const SignUpPage = lazy(() => import('./pages/sign-up'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password'));
const ResetPasswordPage = lazy(() => import('./pages/reset-password'));
const Verify2FAPage = lazy(() => import('./pages/verify-2fa'));
const DashboardPage = lazy(() => import('./pages/dashboard'));
const CreateOrganizationPage = lazy(() => import('./pages/organization/create'));
const MembersPage = lazy(() => import('./pages/organization/members'));
const InvitationsPage = lazy(() => import('./pages/organization/invitations'));
const OrganizationSettingsPage = lazy(() => import('./pages/organization/settings'));
const TeamsPage = lazy(() => import('./pages/organization/teams'));
const AccountSettingsPage = lazy(() => import('./pages/settings/account'));
const SecuritySettingsPage = lazy(() => import('./pages/settings/security'));
const SSOSettingsPage = lazy(() => import('./pages/settings/sso'));
const AdminOrganizationsPage = lazy(() => import('./pages/admin/organizations'));
const AdminPermissionsPage = lazy(() => import('./pages/admin/permissions'));
const AdminPackagesPage = lazy(() => import('./pages/admin/packages'));
const BusinessAppPage = lazy(() => import('./pages/apps/app'));

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
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-2fa" element={<Verify2FAPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/organization/create" element={<CreateOrganizationPage />} />
          <Route path="/organization/members" element={<MembersPage />} />
          <Route path="/organization/invitations" element={<InvitationsPage />} />
          <Route path="/organization/settings" element={<OrganizationSettingsPage />} />
          <Route path="/organization/teams" element={<TeamsPage />} />
          <Route path="/settings/account" element={<AccountSettingsPage />} />
          <Route path="/settings/security" element={<SecuritySettingsPage />} />
          <Route path="/settings/sso" element={<SSOSettingsPage />} />
          <Route path="/admin/organizations" element={<AdminOrganizationsPage />} />
          <Route path="/admin/permissions" element={<AdminPermissionsPage />} />
          <Route path="/admin/packages" element={<AdminPackagesPage />} />
          <Route path="/apps/:appId" element={<BusinessAppPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
