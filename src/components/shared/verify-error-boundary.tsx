'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Simple client-side error boundary for the verify page.
 * Catches runtime errors in the certificate viewer component.
 */
export class VerifyErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="max-w-md text-center space-y-4 py-16">
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="text-gray-400">Failed to render certificate. Please try refreshing the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
