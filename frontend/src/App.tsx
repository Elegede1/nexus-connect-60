
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PropertyListings from "./pages/PropertyListings";
import PropertyDetail from "./pages/PropertyDetail";
import LandlordDashboard from "./pages/LandlordDashboard";
import AddProperty from "./pages/AddProperty";
import EditProperty from "./pages/EditProperty";
import TenantDashboard from "./pages/TenantDashboard";
import PublicLandlordProfile from "./pages/PublicLandlordProfile";
import LandlordProfile from "./pages/LandlordProfile";
import TenantProfile from "./pages/TenantProfile";
import ProfileSettings from "./pages/ProfileSettings";
import Messages from "./pages/Messages";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleGuard } from "./components/RoleGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/listings" element={<PropertyListings />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/landlord/:id" element={<PublicLandlordProfile />} />

            {/* Protected Routes (Authenticated Users) */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />

            {/* Landlord Routes */}
            <Route path="/landlord" element={
              <ProtectedRoute>
                <RoleGuard allowedRole="LANDLORD">
                  <LandlordDashboard />
                </RoleGuard>
              </ProtectedRoute>
            } />
            <Route path="/add-property" element={
              <ProtectedRoute>
                <RoleGuard allowedRole="LANDLORD">
                  <AddProperty />
                </RoleGuard>
              </ProtectedRoute>
            } />
            <Route path="/property/edit/:id" element={
              <ProtectedRoute>
                <RoleGuard allowedRole="LANDLORD">
                  <EditProperty />
                </RoleGuard>
              </ProtectedRoute>
            } />
            <Route path="/landlord-profile" element={
              <ProtectedRoute>
                <RoleGuard allowedRole="LANDLORD">
                  <LandlordProfile />
                </RoleGuard>
              </ProtectedRoute>
            } />

            {/* Tenant Routes */}
            <Route path="/tenant" element={
              <ProtectedRoute>
                <RoleGuard allowedRole="TENANT">
                  <TenantDashboard />
                </RoleGuard>
              </ProtectedRoute>
            } />
            <Route path="/tenant-profile" element={
              <ProtectedRoute>
                <RoleGuard allowedRole="TENANT">
                  <TenantProfile />
                </RoleGuard>
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
