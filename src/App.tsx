import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
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
import Documents from "./pages/Documents";
import PermissionGuard from "./components/PermissionGuard";
import { AppSettingsProvider, useAppSettings } from "./contexts/AppSettingsContext";
import { useEffect } from "react";
import CreateQuote from "./pages/CreateQuote";
import ConfigQuote from "./pages/ConfigQuote";
import PerformanceReport from "./pages/PerformanceReport";
import PublicServices from "./pages/PublicServices";
import EmailMarketing from "./pages/EmailMarketing";

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const HomeRedirect = () => {
  const { hasPermission } = useAuth();
  
  const orderedRoutes = [
    { path: '/find-customers', feature: 'find_customers' },
    { path: '/create-content/post', feature: 'create_post' },
    { path: '/income', feature: 'income' },
    { path: '/performance-report', feature: 'performance_reports' },
  ];

  for (const route of orderedRoutes) {
    if (hasPermission(route.feature)) {
      return <Navigate to={route.path} replace />;
    }
  }

  return <Navigate to="/profile" replace />;
};

const PageTitleUpdater = () => {
  const { settings, loading } = useAppSettings();

  useEffect(() => {
    if (!loading && settings?.page_title) {
      document.title = settings.page_title;
    }
  }, [settings, loading]);

  return null;
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <>
      <PageTitleUpdater />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/find-customers" element={<PermissionGuard feature="find_customers"><FindCustomers /></PermissionGuard>} />
          <Route path="/create-content/post" element={<PermissionGuard feature="create_post"><CreatePost /></PermissionGuard>} />
          <Route path="/create-content/comment" element={<PermissionGuard feature="create_comment"><CreateComment /></PermissionGuard>} />
          <Route path="/email-marketing" element={<PermissionGuard feature="email_marketing"><EmailMarketing /></PermissionGuard>} />
          <Route path="/create-content/customer-consulting" element={<PermissionGuard feature="customer_consulting"><CustomerConsulting /></PermissionGuard>} />
          <Route path="/create-quote" element={<PermissionGuard feature="create_quote"><CreateQuote /></PermissionGuard>} />
          <Route path="/create-plan" element={<PermissionGuard feature="create_plan"><CreatePlan /></PermissionGuard>} />
          <Route path="/config/scan-post" element={<PermissionGuard feature="config_scan_post"><Index /></PermissionGuard>} />
          <Route path="/config/content-ai" element={<PermissionGuard feature="config_content_ai"><ConfigContentAI /></PermissionGuard>} />
          <Route path="/config/create-plan" element={<PermissionGuard feature="config_create_plan"><ConfigCreatePlan /></PermissionGuard>} />
          <Route path="/config/quote" element={<PermissionGuard feature="config_quote"><ConfigQuote /></PermissionGuard>} />
          <Route path="/documents" element={<PermissionGuard feature="documents"><Documents /></PermissionGuard>} />
          <Route path="/services" element={<PermissionGuard feature="public_services"><PublicServices /></PermissionGuard>} />
          <Route path="/settings" element={<PermissionGuard feature="settings"><Settings /></PermissionGuard>} />
          <Route path="/performance-report" element={<PermissionGuard feature="performance_reports"><PerformanceReport /></PermissionGuard>} />
          <Route path="/income" element={<PermissionGuard feature="income"><Income /></PermissionGuard>} />
          <Route path="/account" element={<PermissionGuard feature="account"><Account /></PermissionGuard>} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppSettingsProvider>
              <Sonner position="bottom-right" toastOptions={{ classNames: { success: "bg-brand-orange-light text-brand-orange border-orange-200", error: "bg-red-100 text-red-600 border-red-200", loading: "bg-brand-orange-light text-brand-orange border-orange-200" } }} />
              <AppContent />
            </AppSettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;