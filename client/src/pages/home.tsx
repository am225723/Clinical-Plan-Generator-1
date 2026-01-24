import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Overview } from "@/components/dashboard/Overview";
import { Calendar } from "@/components/dashboard/Calendar";
import { RecentNotes } from "@/components/dashboard/RecentNotes";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { AuthModal } from "@/components/auth/auth-modal";

export default function Home() {
  const { signIn, signUp } = useSupabaseAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <Layout>
      <DashboardHeader onSignIn={() => setAuthModalOpen(true)} />
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
