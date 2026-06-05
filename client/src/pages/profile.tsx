import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
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
            <p>
              Your profile could not be loaded right now. Please refresh or return to My IFS Work.
            </p>
            <p className="rounded-lg border border-dashed p-3 text-slate-500 dark:text-slate-400">
              Your assessments will appear here after you complete them.
            </p>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
