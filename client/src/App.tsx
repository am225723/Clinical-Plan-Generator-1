import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import GeneratorPage from "@/pages/generator";
import TemplatesPage from "@/pages/templates";
import PatientsPage from "@/pages/patients";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import MedicationPage from "@/pages/medication";

function LegacyRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.history.replaceState(null, "", to);
    window.dispatchEvent(new Event("popstate"));
  }, [to]);

  return (
    <main className="min-h-screen bg-background px-5 py-12 text-slate-600 dark:text-slate-300">
      Loading this page…
    </main>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <RouteErrorBoundary key={location}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/home"><LegacyRedirect to="/" /></Route>
        <Route path="/my-ifs" component={Home} />
        <Route path="/my-ifs-path"><LegacyRedirect to="/my-ifs" /></Route>
        <Route path="/therapy"><LegacyRedirect to="/my-ifs" /></Route>
        <Route path="/assessment"><LegacyRedirect to="/generator" /></Route>
        <Route path="/tools"><LegacyRedirect to="/templates" /></Route>
        <Route path="/generator" component={GeneratorPage} />
        <Route path="/templates" component={TemplatesPage} />
        <Route path="/patients" component={PatientsPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/medication" component={MedicationPage} />
        <Route path="/medications" component={MedicationPage} />
        <Route path="/medication-management" component={MedicationPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="*" component={NotFound} />
      </Switch>
    </RouteErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
