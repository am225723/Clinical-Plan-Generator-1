import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useLocation } from "wouter";

export default function ProfilePage() {
  const { loading, error } = useSupabaseAuth();
  const [, setLocation] = useLocation();

  return (
    <Layout>
      <header className="px-5 pt-12 pb-4">
        <p className="text-xs font-medium text-primary tracking-wider uppercase">Profile</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your profile</h1>
      </header>
      <section className="px-5">
        <Card>
          <CardHeader>
            <CardTitle>Profile overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {loading ? (
              <p>Loading your assessments and progress…</p>
            ) : error ? (
              <div className="space-y-3">
                <p>Your profile could not be loaded right now. Please refresh or return to My IFS Work.</p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => window.location.reload()}>Refresh</Button>
                  <Button variant="outline" onClick={() => setLocation("/my-ifs", { replace: true })}>
                    Return to My IFS Work
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p>
                  Your assessments will appear here after you complete them.
                </p>
                <p className="rounded-lg border border-dashed p-3 text-slate-500 dark:text-slate-400">
                  Profile details are available when assessment and progress data are connected.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
