import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

function RouteErrorFallback({ error }: { error?: Error }) {
  const router = useRouter();
  const isDev = process.env.NODE_ENV !== 'production';

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.replace('/');
  };

  return (
    <main className="min-h-screen w-full bg-slate-50 px-4 py-10">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900">
            Something on this page did not load correctly.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-slate-600">
            You can refresh or return to your IFS path.
          </p>
          {isDev && error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Route render error: {error.message}
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button onClick={() => window.location.reload()}>Refresh</Button>
            <Button asChild variant="outline">
              <Link href="/doctor">Go to My IFS Work</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Go to Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings">Open Tools</Link>
            </Button>
            <Button variant="outline" onClick={goBack} className="sm:col-span-2">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Route render error', {
        message: error.message,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return <RouteErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
