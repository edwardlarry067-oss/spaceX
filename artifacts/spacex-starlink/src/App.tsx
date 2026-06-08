import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { initAuth } from "@/lib/auth";

// Eagerly loaded (above-the-fold critical)
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

// Lazy loaded pages — reduce initial bundle
const Plans = lazy(() => import("@/pages/plans"));
const Checkout = lazy(() => import("@/pages/checkout"));
const CheckoutSuccess = lazy(() => import("@/pages/checkout-success"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Contact = lazy(() => import("@/pages/contact"));
const Wallet = lazy(() => import("@/pages/wallet"));
const Login = lazy(() => import("@/pages/login"));
const About = lazy(() => import("@/pages/about"));
const FAQ = lazy(() => import("@/pages/faq"));
const Coverage = lazy(() => import("@/pages/coverage"));
const Support = lazy(() => import("@/pages/support"));
const Track = lazy(() => import("@/pages/track"));

// Admin pages — lazy loaded
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminPlans = lazy(() => import("@/pages/admin/plans"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/subscriptions"));
const WhatsAppTemplates = lazy(() => import("@/pages/admin/whatsapp-templates"));
const Orders = lazy(() => import("@/pages/admin/orders"));
const WhatsAppBot = lazy(() => import("@/pages/admin/whatsapp-bot"));
const EnvConfig = lazy(() => import("@/pages/admin/env-config"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminTickets = lazy(() => import("@/pages/admin/tickets"));

initAuth();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/plans" component={Plans} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/contact" component={Contact} />
        <Route path="/wallet" component={Wallet} />
        <Route path="/login" component={Login} />
        <Route path="/about" component={About} />
        <Route path="/faq" component={FAQ} />
        <Route path="/coverage" component={Coverage} />
        <Route path="/support" component={Support} />
        <Route path="/track" component={Track} />

        <Route path="/admin" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/plans" component={AdminPlans} />
        <Route path="/admin/subscriptions" component={AdminSubscriptions} />
        <Route path="/admin/whatsapp-templates" component={WhatsAppTemplates} />
        <Route path="/admin/orders" component={Orders} />
        <Route path="/admin/whatsapp-bot" component={WhatsAppBot} />
        <Route path="/admin/env-config" component={EnvConfig} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/tickets" component={AdminTickets} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
