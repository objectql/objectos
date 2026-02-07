import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SettingsLayout } from './components/layouts/SettingsLayout';
import { AppLayout } from './components/layouts/AppLayout';

// ── Public pages ──────────────────────────────────────────────
const HomePage = lazy(() => import('./pages/home'));
const SignInPage = lazy(() => import('./pages/sign-in'));
const SignUpPage = lazy(() => import('./pages/sign-up'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password'));
const ResetPasswordPage = lazy(() => import('./pages/reset-password'));
const Verify2FAPage = lazy(() => import('./pages/verify-2fa'));

// ── Settings (Admin Console) ─────────────────────────────────
const SettingsOverviewPage = lazy(() => import('./pages/settings/overview'));
const OrganizationSettingsPage = lazy(() => import('./pages/settings/organization'));
const CreateOrganizationPage = lazy(() => import('./pages/settings/organization-create'));
const MembersPage = lazy(() => import('./pages/settings/members'));
const TeamsPage = lazy(() => import('./pages/settings/teams'));
const InvitationsPage = lazy(() => import('./pages/settings/invitations'));
const PermissionsPage = lazy(() => import('./pages/settings/permissions'));
const SSOSettingsPage = lazy(() => import('./pages/settings/sso'));
const AuditPage = lazy(() => import('./pages/settings/audit'));
const PackagesPage = lazy(() => import('./pages/settings/packages'));
const AccountSettingsPage = lazy(() => import('./pages/settings/account'));
const SecuritySettingsPage = lazy(() => import('./pages/settings/security'));

// ── Business Apps ─────────────────────────────────────────────
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

          {/* ── Admin Console (/settings/*) ── */}
          <Route element={<SettingsLayout />}>
            <Route path="/settings" element={<SettingsOverviewPage />} />
            <Route path="/settings/organization" element={<OrganizationSettingsPage />} />
            <Route path="/settings/organization/create" element={<CreateOrganizationPage />} />
            <Route path="/settings/members" element={<MembersPage />} />
            <Route path="/settings/teams" element={<TeamsPage />} />
            <Route path="/settings/invitations" element={<InvitationsPage />} />
            <Route path="/settings/permissions" element={<PermissionsPage />} />
            <Route path="/settings/sso" element={<SSOSettingsPage />} />
            <Route path="/settings/audit" element={<AuditPage />} />
            <Route path="/settings/packages" element={<PackagesPage />} />
            <Route path="/settings/account" element={<AccountSettingsPage />} />
            <Route path="/settings/security" element={<SecuritySettingsPage />} />
          </Route>

          {/* ── Business Apps (/apps/:appId/*) ── */}
          <Route path="/apps/:appId" element={<AppLayout />}>
            <Route index element={<BusinessAppPage />} />
          </Route>

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
