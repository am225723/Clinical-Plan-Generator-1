import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function MedicationPage() {
  const [, setLocation] = useLocation();

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
            <p>Medication information is not available in this app right now.</p>
            <p className="text-slate-500 dark:text-slate-400">
              This page is a safe placeholder and does not provide medication advice, prescribing support, or AI medication guidance.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => setLocation("/my-ifs", { replace: true })}>My IFS Work</Button>
              <Button variant="outline" onClick={() => setLocation("/", { replace: true })}>Home</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
