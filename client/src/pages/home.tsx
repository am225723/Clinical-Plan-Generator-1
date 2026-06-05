import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Overview } from "@/components/dashboard/Overview";
import { Calendar } from "@/components/dashboard/Calendar";
import { RecentNotes } from "@/components/dashboard/RecentNotes";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { AuthModal } from "@/components/auth/auth-modal";

export default function Home() {
  const { signIn, signUp, loading, error, user } = useSupabaseAuth();
  const [location] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const isMyIFS = location === "/my-ifs";

  const selfProfileConnected = useMemo(() => {
    if (!isMyIFS) return false;
    return Boolean(user) && !error;
  }, [error, isMyIFS, user]);

  const hasProfileBlockingError = isMyIFS && !loading && !selfProfileConnected;
  const hasOptionalDashboardWarning = false;

  return (
    <Layout>
      <DashboardHeader onSignIn={() => setAuthModalOpen(true)} />
      {isMyIFS ? (
        <section className="px-5 pb-2 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              Loading your IFS path…
            </div>
          ) : null}
          {hasProfileBlockingError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-700/50 dark:bg-red-950/30 dark:text-red-100">
              Your IFS data could not be loaded right now. Please refresh or try again.
            </div>
          ) : null}
          {!loading && selfProfileConnected ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900 dark:border-teal-700/50 dark:bg-teal-950/30 dark:text-teal-100">
              Your personal IFS path is connected.
            </div>
          ) : null}
          {!hasProfileBlockingError && hasOptionalDashboardWarning ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
              Some parts of your IFS path could not be refreshed. The rest of your information is still shown.
            </div>
          ) : null}
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
