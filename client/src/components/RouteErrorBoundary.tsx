import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

function RouteErrorFallback({ error }: { error?: Error }) {
  const [, setLocation] = useLocation();

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    setLocation("/");
  };

  return (
    <main className="min-h-screen w-full bg-gray-50 px-4 py-10 dark:bg-background">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900 dark:text-white">
            Something on this page did not load correctly.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            You can refresh or return to your IFS path.
          </p>
          {import.meta.env.DEV && error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Route render error: {error.message}
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button onClick={() => setLocation("/")}>Go Home</Button>
            <Button variant="outline" onClick={() => setLocation("/my-ifs")}>Go to My IFS Work</Button>
            <Button variant="outline" onClick={() => setLocation("/templates")}>Go to Tools</Button>
            <Button variant="outline" onClick={goBack}>Back to previous page</Button>
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
    if (import.meta.env.DEV) {
      console.error("Route render error", {
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
