import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Account from "./pages/Account";
import Guide from "./pages/Guide";
import Profile from "./pages/Profile";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import FindCustomers from "./pages/FindCustomers";
import CreatePost from "./pages/CreatePost";
import CreateComment from "./pages/CreateComment";
import CreatePlan from "./pages/CreatePlan";
import ConfigContentAI from "./pages/ConfigContentAI";
import ConfigCreatePlan from "./pages/ConfigCreatePlan";
import Income from "./pages/Income";
import CustomerConsulting from "./pages/CustomerConsulting";

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const { session, roles } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const isSuperAdmin = roles.includes('Super Admin');

  if ((location.pathname.startsWith('/account') || location.pathname.startsWith('/settings')) && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/find-customers" replace />} />
          <Route path="/find-customers" element={<FindCustomers />} />
          <Route path="/create-content/post" element={<CreatePost />} />
          <Route path="/create-content/comment" element={<CreateComment />} />
          <Route path="/create-content/customer-consulting" element={<CustomerConsulting />} />
          <Route path="/create-plan" element={<CreatePlan />} />
          <Route path="/config/scan-post" element={<Index />} />
          <Route path="/config/content-ai" element={<ConfigContentAI />} />
          <Route path="/config/create-plan" element={<ConfigCreatePlan />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/income" element={<Income />} />
          <Route path="/account" element={<Account />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner position="bottom-right" toastOptions={{ classNames: { success: "bg-brand-orange-light text-brand-orange border-orange-200", error: "bg-red-100 text-red-600 border-red-200", loading: "bg-brand-orange-light text-brand-orange border-orange-200" } }} />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;