import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { Toaster } from "react-hot-toast";
import AdminLayout from "@/components/admin/layout/Layout";
import UserLayout from "@/components/user/layout/UserLayout";
import HomePage from "@/pages/User/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "@/pages/Admin/DashboardPage.tsx";
import LearningPage from "@/pages/User/LearningPage";
import ProfilePage from "@/pages/User/ProfilePage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* User Routes - HomePage, Learning, Profile */}
          <Route path="/" element={<UserLayout />}>
            <Route index element={<HomePage />} />
            <Route path="learning" element={<LearningPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          
          {/* Admin Routes - Dashboard */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
