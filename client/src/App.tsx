import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { CartSheet } from "@/components/CartSheet";
import { AppSidebar } from "@/components/AppSidebar";
import { Logo } from "@/components/Logo";

import Home from "@/pages/Home";
import Results from "@/pages/Results";
import Affiliate from "@/pages/Affiliate";
import Profile from "@/pages/Profile";
import Wallet from "@/pages/Wallet";
import SetCalculator from "@/pages/SetCalculator";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";

function AppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex h-14 items-center justify-between gap-2 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="md:hidden">
                <Logo size="sm" showText={false} />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <CartSheet />
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>
      {children}
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <AppLayout><Home /></AppLayout>} />
      <Route path="/results" component={() => <AppLayout><Results /></AppLayout>} />
      <Route path="/affiliate" component={() => <AppLayout><Affiliate /></AppLayout>} />
      <Route path="/profile" component={() => <AppLayout><Profile /></AppLayout>} />
      <Route path="/wallet" component={() => <AppLayout><Wallet /></AppLayout>} />
      <Route path="/calculator" component={() => <AppLayout><SetCalculator /></AppLayout>} />
      <Route path="/admin" component={() => <AppLayout><Admin /></AppLayout>} />
      <Route path="/admin/login" component={() => <AuthLayout><AdminLogin /></AuthLayout>} />
      <Route path="/login" component={() => <AuthLayout><Login /></AuthLayout>} />
      <Route path="/register" component={() => <AuthLayout><Register /></AuthLayout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
