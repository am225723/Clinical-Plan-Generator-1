import React, { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Overview } from "@/components/dashboard/Overview";
import { Calendar } from "@/components/dashboard/Calendar";
import { RecentNotes } from "@/components/dashboard/RecentNotes";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { AuthModal } from "@/components/auth/auth-modal";

export default function Home() {
  const { signIn, signUp } = useSupabaseAuth();
  const [location] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const isMyIFS = location === "/my-ifs";

  return (
    <Layout>
      <DashboardHeader onSignIn={() => setAuthModalOpen(true)} />
      {isMyIFS ? (
        <section className="px-5 pb-2 space-y-3">
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900 dark:border-teal-700/50 dark:bg-teal-950/30 dark:text-teal-100">
            Your personal IFS path is connected.
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
            Some parts of your IFS path could not be refreshed. The rest of your information is still shown.
          </div>
        </section>
      ) : null}
      <Overview />
      <Calendar />
      <RecentNotes />
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSignIn={signIn}
        onSignUp={signUp}
      />
    </Layout>
  );
}
