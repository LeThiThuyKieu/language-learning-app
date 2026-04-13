import {BrowserRouter, Routes, Route} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "react-query";
import {Toaster} from "react-hot-toast";
import AdminLayout from "@/components/admin/layout/Layout";
import MainLayout from "@/components/user/layout/MainLayout.tsx";
import HomePage from "@/pages/User/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "@/pages/Admin/DashboardPage.tsx";
import LearningPage from "@/pages/User/learn/LearningPage.tsx";
import VocabLessonPage from "@/pages/User/learn/VocabLessonPage.tsx";
import ListeningLessonPage from "@/pages/User/learn/ListeningLessonPage.tsx";
import SpeakingLessonPage from "@/pages/User/learn/SpeakingLessonPage.tsx";
import MatchingLessonPage from "@/pages/User/learn/MatchingLessonPage.tsx";
import ReviewLessonPage from "@/pages/User/learn/ReviewLessonPage.tsx";
import ProfilePage from "@/pages/User/ProfilePage";
import LionWelcome from "@/components/user/home/LionWelcome";
import LevelSelectPage from "@/pages/User/learn/LevelSelectPage.tsx";
import PlacementTestPage from "@/pages/User/learn/PlacementTestPage.tsx";
import LevelConfirmPage from "@/pages/User/learn/LevelConfirmPage.tsx";
import HelpPage from "@/pages/User/HelpPage.tsx";
import SupportFloatingButton from "@/components/user/common/SupportFloatingButton.tsx";

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/register" element={<RegisterPage/>}/>

                    {/* User Routes - HomePage, Learning, Profile */}
                    <Route path="/" element={<MainLayout/>}>
                        <Route index element={<HomePage/>}/>
                        <Route path="learn" element={<LearningPage/>}/>
                        <Route path="profile" element={<ProfilePage/>}/>
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

                    {/* Admin Routes - Dashboard */}
                    <Route path="/admin" element={<AdminLayout/>}>
                        <Route path="dashboard" element={<DashboardPage/>}/>
                    </Route>
                </Routes>
                <SupportFloatingButton />
                <Toaster position="top-right"/>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
