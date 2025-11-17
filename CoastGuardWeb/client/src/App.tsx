import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuthStore } from "@/lib/store";
import { startSyncWorker, stopSyncWorker } from "@/lib/sync-worker";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import MyReportsPage from "@/pages/my-reports";
import NewReportPage from "@/pages/new-report";
import AnalystPage from "@/pages/analyst";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isAuthenticated } = useAuthStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated()) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/my-reports">
        <ProtectedRoute component={MyReportsPage} />
      </Route>
      <Route path="/new-report">
        <ProtectedRoute component={NewReportPage} />
      </Route>
      <Route path="/analyst">
        <ProtectedRoute component={AnalystPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Start offline sync worker when authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      startSyncWorker();
      return () => stopSyncWorker();
    }
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isAuthenticated() ? (
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between h-14 px-4 border-b shrink-0">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                </header>
                <main className="flex-1 overflow-hidden">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
        ) : (
          <Router />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
