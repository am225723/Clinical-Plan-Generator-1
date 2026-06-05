import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <CardTitle className="text-2xl text-slate-900">Page not found</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-slate-600">
            We could not find that page. You can return to your IFS path or open the Tools Directory.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button asChild>
              <Link href="/doctor">My IFS Work</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings">Tools</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
