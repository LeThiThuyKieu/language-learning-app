import { useEffect, useState } from "react";
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
import { profileService } from "@/services/profileService";
import { getStoredAppearanceSettings, saveAppearanceSettings, notifyAppearanceSettingsChanged } from "@/utils/appearanceSettings";
import {
    getStoredLearningSettings,
    getStoredNotificationSettings,
    saveLearningSettings,
    saveNotificationSettings,
} from "@/utils/SettingsStorage.ts";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("account");
    const [isAccountSaving, setIsAccountSaving] = useState(false);

    // Nhóm trạng thái tài khoản phục vụ phần thông tin cá nhân, bảo mật và liên kết mạng xã hội.
    const [accountSettings, setAccountSettings] = useState<AccountSettingsState>({
        displayName: "Học viên IELTS",
        email: "hocvien@example.com",
        googleLinkStatus: "pending",
        facebookLinkStatus: "pending",
    });

    // Nhóm trạng thái học tập: mục tiêu, nhắc học và tùy chọn luyện tập.
    const [learningSettings, setLearningSettings] = useState<LearningSettingsState>(() => getStoredLearningSettings());

    // Nhóm trạng thái thông báo cho học tập và liên lạc.
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsState>(() => getStoredNotificationSettings());

    // Nhóm trạng thái giao diện hiển thị và hiệu ứng.
    const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettingsState>(() => getStoredAppearanceSettings());

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            try {
                const profile = await profileService.getMyProfile();
                if (!isMounted) {
                    return;
                }

                setAccountSettings((prev) => ({
                    ...prev,
                    displayName: profile.fullName?.trim() || profile.email,
                    email: profile.email,
                }));
            } catch {
                // PENDING: Nếu backend profile lỗi, vẫn giữ dữ liệu tạm ở UI hiện tại.
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        saveLearningSettings(learningSettings);
    }, [learningSettings]);

    useEffect(() => {
        saveNotificationSettings(notificationSettings);
    }, [notificationSettings]);

    useEffect(() => {
        saveAppearanceSettings(appearanceSettings);
        notifyAppearanceSettingsChanged();
    }, [appearanceSettings]);

    // Handler đổi tên hiển thị: đã nối backend profile và lưu DB qua API hiện có.
    const handleChangeDisplayName = async () => {
        const nextName = window.prompt("Nhập tên hiển thị mới", accountSettings.displayName);
        if (!nextName) return;

        const trimmedName = nextName.trim();
        if (!trimmedName) {
            return;
        }

        try {
            setIsAccountSaving(true);
            const updatedProfile = await profileService.updateMyProfile({ fullName: trimmedName });
            setAccountSettings((prev) => ({
                ...prev,
                displayName: updatedProfile.fullName?.trim() || trimmedName,
                email: updatedProfile.email,
            }));
        } catch {
            window.alert("Không thể cập nhật tên hiển thị lúc này. Vui lòng thử lại.");
        } finally {
            setIsAccountSaving(false);
        }
    };

    // PENDING: Backend hiện chưa hỗ trợ đổi email trong scope Settings, nên chỉ đánh dấu chưa hoàn thành.
    const handleChangeEmail = () => {
        window.alert("Chức năng đổi email chưa hoàn thành trong scope hiện tại.");
    };

    // PENDING: Chưa có API đổi mật khẩu trong backend hiện tại.
    const handleChangePassword = () => {
        window.alert("Chức năng đổi mật khẩu chưa hoàn thành trong scope hiện tại.");
    };

    // PENDING: Chưa có backend social-linking, nên chỉ giữ trạng thái UI và đánh dấu pending.
    const handleToggleGoogle = () => {
        window.alert("Chức năng liên kết/hủy liên kết Google chưa hoàn thành trong scope hiện tại.");
    };

    // PENDING: Chưa có backend social-linking, nên chỉ giữ trạng thái UI và đánh dấu pending.
    const handleToggleFacebook = () => {
        window.alert("Chức năng liên kết/hủy liên kết Facebook chưa hoàn thành trong scope hiện tại.");
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
                        onToggleGoogle={handleToggleGoogle}
                        onToggleFacebook={handleToggleFacebook}
                        isSaving={isAccountSaving}
                    />
                );
            case "learning":
                // PENDING: Chưa có backend/database riêng cho Learning Settings, nên chỉ lưu localStorage.
                return <LearningSettingsPanel settings={learningSettings} onChange={setLearningSettings} />;
            case "notifications":
                // PENDING: Chưa có backend/database riêng cho Notification Settings, nên chỉ lưu localStorage.
                return <NotificationSettingsPanel settings={notificationSettings} onChange={setNotificationSettings} />;
            case "appearance":
                // Chỉ cỡ chữ được áp dụng toàn hệ thống; các tùy chọn còn lại chỉ lưu localStorage.
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
