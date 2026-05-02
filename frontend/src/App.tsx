import {BrowserRouter, Routes, Route} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "react-query";
import {Toaster} from "react-hot-toast";
import {useEffect} from "react";
import {useAuthStore} from "@/store/authStore.ts";
import AdminLayout from "@/components/admin/layout/Layout";
import AdminGuard from "@/components/admin/layout/AdminGuard.tsx";
import MainLayout from "@/components/user/layout/MainLayout.tsx";
import HomePage from "@/pages/User/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "@/pages/Admin/DashboardPage.tsx";
import UserManagementPage from "@/pages/Admin/UserManagementPage.tsx";
import EmailSupportPage from "@/pages/Admin/support_management/EmailSupportPage.tsx";
import LearningPage from "@/pages/User/learn/LearningPage.tsx";
import VocabLessonPage from "@/pages/User/learn/question_type/VocabLessonPage.tsx";
import ListeningLessonPage from "@/pages/User/learn/question_type/ListeningLessonPage.tsx";
import SpeakingLessonPage from "@/pages/User/learn/question_type/SpeakingLessonPage.tsx";
import MatchingLessonPage from "@/pages/User/learn/question_type/MatchingLessonPage.tsx";
import ReviewLessonPage from "@/pages/User/learn/question_type/ReviewLessonPage.tsx";
import ProfilePage from "@/pages/User/ProfilePage";
import LionWelcome from "@/components/user/home/LionWelcome";
import LevelSelectPage from "@/pages/User/learn/LevelSelectPage.tsx";
import PlacementTestPage from "@/pages/User/learn/placement/PlacementTestPage.tsx";
import PlacementTestSessionPage from "@/pages/User/learn/placement/PlacementTestSessionPage.tsx";
import PlacementTestResultsPage from "@/pages/User/learn/placement/PlacementTestResultsPage.tsx";
import LevelConfirmPage from "@/pages/User/learn/LevelConfirmPage.tsx";
import HelpPage from "@/pages/User/HelpPage.tsx";
import SupportFloatingButton from "@/components/user/common/SupportFloatingButton.tsx";
import SettingsPage from "@/pages/User/SettingsPage.tsx";
import { applyAppearanceSettings, getStoredAppearanceSettings } from "@/utils/appearanceSettings";

const queryClient = new QueryClient();

/** Decode JWT payload (không verify signature) để lấy exp */
function getTokenExpiry(token: string): number | null {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return typeof payload.exp === "number" ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

/** Kiểm tra token hết hạn khi app load và khi tab được focus lại */
function TokenGuard() {
    const { token, logout } = useAuthStore();

    useEffect(() => {
        function checkExpiry() {
            if (!token) return;
            const expiry = getTokenExpiry(token);
            if (expiry && Date.now() > expiry) {
                logout();
            }
        }

        checkExpiry(); // kiểm tra ngay khi mount

        // Kiểm tra lại khi user quay lại tab
        window.addEventListener("focus", checkExpiry);
        // Kiểm tra định kỳ mỗi phút
        const interval = setInterval(checkExpiry, 60_000);

        return () => {
            window.removeEventListener("focus", checkExpiry);
            clearInterval(interval);
        };
    }, [token, logout]);

    return null;
}

function App() {
    useEffect(() => {
        const syncAppearanceSettings = () => {
            applyAppearanceSettings(getStoredAppearanceSettings());
        };

        syncAppearanceSettings();
        window.addEventListener("lion-appearance-settings-changed", syncAppearanceSettings);
        window.addEventListener("storage", syncAppearanceSettings);

        return () => {
            window.removeEventListener("lion-appearance-settings-changed", syncAppearanceSettings);
            window.removeEventListener("storage", syncAppearanceSettings);
        };
    }, []);
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <TokenGuard />
                <Routes>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/register" element={<RegisterPage/>}/>

                    {/* User Routes - HomePage, Learning, Profile */}
                    <Route path="/" element={<MainLayout/>}>
                        <Route index element={<HomePage/>}/>
                        <Route path="learn" element={<LearningPage/>}/>
                        <Route path="profile" element={<ProfilePage/>}/>
                        <Route path="settings" element={<SettingsPage/>}/>
                        <Route path="help" element={<HelpPage/>}/>
                    </Route>

                    {/* Bài học full màn hình: không Header/Footer layout trang chủ */}
                    <Route path="/learn/vocab" element={<VocabLessonPage/>}/>
                    <Route path="/learn/listening" element={<ListeningLessonPage/>}/>
                    <Route path="/learn/speaking" element={<SpeakingLessonPage/>}/>
                    <Route path="/learn/matching" element={<MatchingLessonPage/>}/>
                    <Route path="/learn/review" element={<ReviewLessonPage/>}/>

                    {/* Trang Welcome */}
                    <Route path="/welcome"
                        element={<LionWelcome message="Chào bạn! Tớ là sư tử Lion!" nextPath="/welcome-start" />}
                    />
                    <Route path="/welcome-start"
                        element={<LionWelcome message="Cùng bắt đầu vào học nào!" nextPath="/level-select" />}
                    />
                    <Route path="/level-select" element={<LevelSelectPage />} />
                    <Route path="/level-confirm" element={<LevelConfirmPage />} />
                    <Route path="/placement-test" element={<PlacementTestPage />} />
                    <Route path="/placement-test/session" element={<PlacementTestSessionPage />} />
                    <Route path="/placement-test/results" element={<PlacementTestResultsPage />} />

                    {/* Admin Routes - chỉ ADMIN mới vào được */}
                    <Route path="/admin" element={<AdminGuard><AdminLayout/></AdminGuard>}>
                        <Route index element={<DashboardPage/>}/>
                        <Route path="dashboard" element={<DashboardPage/>}/>
                        <Route path="user_management" element={<UserManagementPage/>}/>
                        <Route path="support-management/email-support" element={<EmailSupportPage/>}/>
                    </Route>
                </Routes>
                <SupportFloatingButton />
                <Toaster position="top-right"/>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
