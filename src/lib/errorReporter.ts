import { toast } from 'sonner';
export interface ClientErrorReport {
  message: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  stack?: string;
  componentStack?: string;
  errorBoundary?: boolean;
  errorBoundaryProps?: Record<string, unknown>;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: unknown;
  showToast?: boolean;
}
class ErrorReporter {
  private reportedErrors = new Set<string>();
  private throttleMs = 5000; // 5 seconds
  public report(details: Partial<ClientErrorReport>): void {
    const errorKey = `${details.message}:${details.stack}`;
    if (this.reportedErrors.has(errorKey)) {
      console.warn('[ErrorReporter] Throttled duplicate error:', details.message);
      return;
    }
    this.reportedErrors.add(errorKey);
    setTimeout(() => this.reportedErrors.delete(errorKey), this.throttleMs);
    const report: ClientErrorReport = {
      message: details.message || 'Unknown client error',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...details,
    };
    // Log to console for local dev
    console.error('[ErrorReporter]', report);
    // Send to backend
    fetch('/api/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }).catch(err => console.error('[ErrorReporter] Failed to send report:', err));
    // Optionally show a toast
    if (details.showToast) {
      toast.error(details.message || 'An unexpected error occurred.', {
        description: 'Our team has been notified. Please try again later.',
      });
    }
  }
}
export const errorReporter = new ErrorReporter();
// Global error handlers
window.addEventListener('error', (event) => {
  errorReporter.report({
    message: event.message,
    source: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});
window.addEventListener('unhandledrejection', (event) => {
  errorReporter.report({
    message: `Unhandled promise rejection: ${event.reason}`,
    error: event.reason,
  });
});
// This file is imported in main.tsx to initialize the handlers.
// Do not touch this file.