import { useState } from "react";
import SettingsSidebar from "@/components/user/settings/SettingsSidebar";
import AccountSettingsPanel from "@/components/user/settings/AccountSettingsPanel";
import LearningSettingsPanel from "@/components/user/settings/LearningSettingsPanel";
import NotificationSettingsPanel from "@/components/user/settings/NotificationSettingsPanel";
import AppearanceSettingsPanel from "@/components/user/settings/AppearanceSettingsPanel";
import {
    AccountSettingsState,
    AppearanceSettingsState,
    LearningSettingsState,
    NotificationSettingsState,
    SettingsTab,
} from "@/components/user/settings/types";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("account");

    // Nhóm trạng thái tài khoản phục vụ phần thông tin cá nhân, bảo mật và liên kết mạng xã hội.
    const [accountSettings, setAccountSettings] = useState<AccountSettingsState>({
        displayName: "Học viên IELTS",
        email: "hocvien@example.com",
        googleLinked: true,
        facebookLinked: false,
    });

    // Nhóm trạng thái học tập: mục tiêu, nhắc học và tùy chọn luyện tập.
    const [learningSettings, setLearningSettings] = useState<LearningSettingsState>({
        dailyNewWordsGoal: 20,
        dailyPracticeGoal: 3,
        studyReminderEnabled: true,
        reminderTime: "19:30",
        spacedRepetitionEnabled: true,
        flashcardAutoPlayEnabled: false,
        autoPronunciationEnabled: true,
    });

    // Nhóm trạng thái thông báo cho học tập và liên lạc.
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsState>({
        dailyStudyReminder: true,
        streakReminder: true,
        newLessonNotification: true,
        emailNotifications: false,
        pushNotifications: true,
    });

    // Nhóm trạng thái giao diện hiển thị và hiệu ứng.
    const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettingsState>({
        theme: "light",
        fontSize: "medium",
        language: "vi",
        animationsEnabled: true,
        soundEffectsEnabled: true,
    });

    // Handler đổi tên hiển thị bằng prompt tạm thời, có thể thay bằng modal/API sau.
    const handleChangeDisplayName = () => {
        const nextName = window.prompt("Nhập tên hiển thị mới", accountSettings.displayName);
        if (!nextName) return;
        setAccountSettings((prev) => ({ ...prev, displayName: nextName.trim() || prev.displayName }));
    };

    // Handler đổi email với validate cơ bản để tránh nhập sai định dạng.
    const handleChangeEmail = () => {
        const nextEmail = window.prompt("Nhập email mới", accountSettings.email);
        if (!nextEmail) return;

        const trimmedEmail = nextEmail.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            window.alert("Email không hợp lệ. Vui lòng nhập lại.");
            return;
        }

        setAccountSettings((prev) => ({ ...prev, email: trimmedEmail }));
    };

    // Handler đổi mật khẩu (placeholder), chỗ này thường cần gọi API đổi mật khẩu thực tế.
    const handleChangePassword = () => {
        window.alert("Mở luồng đổi mật khẩu tại đây (gọi API backend khi sẵn sàng).");
    };

    // Hàm render nội dung chính theo tab đang active.
    const renderActivePanel = () => {
        switch (activeTab) {
            case "account":
                return (
                    <AccountSettingsPanel
                        settings={accountSettings}
                        onChangeDisplayName={handleChangeDisplayName}
                        onChangeEmail={handleChangeEmail}
                        onChangePassword={handleChangePassword}
                        onToggleGoogle={() => setAccountSettings((prev) => ({ ...prev, googleLinked: !prev.googleLinked }))}
                        onToggleFacebook={() => setAccountSettings((prev) => ({ ...prev, facebookLinked: !prev.facebookLinked }))}
                    />
                );
            case "learning":
                return <LearningSettingsPanel settings={learningSettings} onChange={setLearningSettings} />;
            case "notifications":
                return <NotificationSettingsPanel settings={notificationSettings} onChange={setNotificationSettings} />;
            case "appearance":
                return <AppearanceSettingsPanel settings={appearanceSettings} onChange={setAppearanceSettings} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen via-white to-amber-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Cài đặt</h1>
                    <p className="text-slate-600 mb-8">Tùy chỉnh tài khoản, học tập, thông báo và trải nghiệm sử dụng của bạn.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 xl:col-span-3">
                        <SettingsSidebar activeTab={activeTab} onSelectTab={setActiveTab} />
                    </div>

                    <div className="lg:col-span-8 xl:col-span-9">
                        <div key={activeTab}>
                            {renderActivePanel()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
