import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MedicationPage() {
  return (
    <Layout>
      <header className="px-5 pt-12 pb-4">
        <p className="text-xs font-medium text-primary tracking-wider uppercase">Medication</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Medication information</h1>
      </header>
      <section className="px-5">
        <Card>
          <CardHeader>
            <CardTitle>Medication tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <p>Medication tracking is not set up yet.</p>
            <p className="text-slate-500 dark:text-slate-400">
              Medication information is not available in this app right now.
            </p>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
