import { useLocation } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 dark:bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <CardTitle className="text-2xl text-gray-900 dark:text-white">Page not found</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
            We could not find that page. You can return to your IFS path or open the Tools Directory.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button onClick={() => setLocation("/")}>Go Home</Button>
            <Button variant="outline" onClick={() => setLocation("/my-ifs")}>My IFS Work</Button>
            <Button variant="outline" onClick={() => setLocation("/templates")}>Tools</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
