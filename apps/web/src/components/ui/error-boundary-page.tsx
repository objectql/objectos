/**
 * ErrorBoundaryPage — top-level error boundary for unrecoverable errors.
 *
 * Catches unhandled exceptions in the React tree and shows a
 * user-friendly error page with retry and diagnostic options.
 *
 * Phase L — Task L.4
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Copy, Home } from 'lucide-react';

interface ErrorBoundaryPageProps {
  children: ReactNode;
  /** Callback when an error is reported */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryPageState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundaryPage extends Component<ErrorBoundaryPageProps, ErrorBoundaryPageState> {
  constructor(props: ErrorBoundaryPageProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryPageState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleCopyDiagnostics = () => {
    const diagnostics = [
      `Error: ${this.state.error?.message ?? 'Unknown'}`,
      `Stack: ${this.state.error?.stack ?? 'N/A'}`,
      `Component: ${this.state.errorInfo?.componentStack ?? 'N/A'}`,
      `URL: ${window.location.href}`,
      `Time: ${new Date().toISOString()}`,
      `UserAgent: ${navigator.userAgent}`,
    ].join('\n\n');

    navigator.clipboard
      .writeText(diagnostics)
      .then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      })
      .catch(() => {
        // Clipboard may not be available
      });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex min-h-svh items-center justify-center bg-background p-4"
          data-testid="error-boundary-page"
        >
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. You can try refreshing the page or going back to the
                home page.
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-lg border bg-muted/50 p-3 text-left">
                <p className="text-xs font-mono text-destructive">{this.state.error.message}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <RefreshCw className="size-4" />
                Try Again
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <Home className="size-4" />
                Go Home
              </a>
              <button
                onClick={this.handleCopyDiagnostics}
                className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <Copy className="size-4" />
                {this.state.copied ? 'Copied!' : 'Copy Diagnostics'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
