import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SidebarProvider } from "./hooks/use-sidebar";
import Layout from "./components/Layout";
import FindCustomers from "./pages/FindCustomers";
import CreatePost from "./pages/CreateContent/Post";
import CreateComment from "./pages/CreateContent/Comment";
import CustomerConsulting from "./pages/CreateContent/CustomerConsulting";
import CreateQuote from "./pages/CreateQuote";
import CreatePlan from "./pages/CreatePlan";
import Income from "./pages/Income";
import ConfigScanPost from "./pages/Config/ScanPost";
import ConfigContentAI from "./pages/Config/ContentAI";
import ConfigCreatePlan from "./pages/Config/CreatePlan";
import ConfigQuote from "./pages/Config/Quote";
import Documents from "./pages/Documents";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { Toaster } from "@/components/ui/toaster"

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <SidebarProvider>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/find-customers" />} />
                  <Route path="/find-customers" element={<FindCustomers />} />
                  <Route path="/create-content/post" element={<CreatePost />} />
                  <Route path="/create-content/comment" element={<CreateComment />} />
                  <Route path="/create-content/customer-consulting" element={<CustomerConsulting />} />
                  <Route path="/create-quote" element={<CreateQuote />} />
                  <Route path="/create-plan" element={<CreatePlan />} />
                  <Route path="/income" element={<Income />} />
                  <Route path="/config/scan-post" element={<ConfigScanPost />} />
                  <Route path="/config/content-ai" element={<ConfigContentAI />} />
                  <Route path="/config/create-plan" element={<ConfigCreatePlan />} />
                  <Route path="/config/quote" element={<ConfigQuote />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            </SidebarProvider>
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;