import { useEffect, useState } from "react";
import SettingsSidebar from "@/components/user/settings/SettingsSidebar";
import AccountSettingsPanel from "@/components/user/settings/AccountSettingsPanel";
import LearningSettingsPanel from "@/components/user/settings/LearningSettingsPanel";
import NotificationSettingsPanel from "@/components/user/settings/NotificationSettingsPanel";
import AppearanceSettingsPanel from "@/components/user/settings/AppearanceSettingsPanel";
import ChangePasswordModal from "@/components/user/settings/ChangePassword";
import {
    AccountSettingsState,
    AppearanceSettingsState,
    LearningSettingsState,
    NotificationSettingsState,
    SettingsTab,
} from "@/components/user/settings/types";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { getStoredAppearanceSettings, saveAppearanceSettings, notifyAppearanceSettingsChanged } from "@/utils/appearanceSettings";
import {
    getStoredLearningSettings,
    getStoredNotificationSettings,
    saveLearningSettings,
    saveNotificationSettings,
} from "@/utils/SettingsStorage";
import axios from "axios";

// Scope backend hiện tại của Settings:
// - Đã có BE+DB: đổi tên hiển thị (update profile), đổi mật khẩu (api/auth/change-password).
// - Chưa có BE: đổi email, liên kết/hủy liên kết Google/Facebook.
// - Chưa có BE riêng cho tab Learning/Notifications và phần còn lại của Appearance (ngoài font size áp dụng toàn hệ thống).

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("account");
    const [isAccountSaving, setIsAccountSaving] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);

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
    const handleSaveDisplayName = async (trimmedName: string): Promise<boolean> => {
        try {
            setIsAccountSaving(true);
            const updatedProfile = await profileService.updateMyProfile({ fullName: trimmedName });
            setAccountSettings((prev) => ({
                ...prev,
                displayName: updatedProfile.fullName?.trim() || trimmedName,
                email: updatedProfile.email,
            }));
            return true;
        } catch {
            window.alert("Không thể cập nhật tên hiển thị lúc này. Vui lòng thử lại.");
            return false;
        } finally {
            setIsAccountSaving(false);
        }
    };

    // PENDING: Backend hiện chưa hỗ trợ đổi email trong scope Settings, nên chỉ đánh dấu chưa hoàn thành.
    const handleChangeEmail = () => {
        window.alert("Chức năng đổi email chưa hoàn thành trong scope hiện tại.");
    };

    // Đổi mật khẩu: đã nối backend và lưu DB qua API auth.
    const handleChangePassword = () => {
        setIsPasswordModalOpen(true);
    };

    const handleSubmitChangePassword = async (
        payload: {
            currentPassword: string;
            newPassword: string;
            confirmNewPassword: string;
        }
    ): Promise<{ success: boolean; message: string }> => {

        try {
            setIsPasswordSaving(true);

            await authService.changePassword(payload);

            return {
                success: true,
                message: "Đổi mật khẩu thành công.",
            };

        } catch (error: unknown) {

            if (axios.isAxiosError(error)) {
                return {
                    success: false,
                    message:
                        error.response?.data?.message ||
                        "Không thể đổi mật khẩu lúc này. Vui lòng thử lại.",
                };
            }

            return {
                success: false,
                message: "Đã xảy ra lỗi không mong muốn.",
            };

        } finally {
            setIsPasswordSaving(false);
        }
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
                        onSaveDisplayName={handleSaveDisplayName}
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
        <div className="min-h-screen px-6 pt-2 pb-6 md:px-10 md:pt-3 md:pb-8">
            <div className="max-w-7xl mx-auto">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Cài đặt</h1>
                    <p className="text-slate-600 mb-4">Tùy chỉnh tài khoản, học tập, thông báo và trải nghiệm sử dụng của bạn.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 xl:col-span-3">
                        <div className="sticky top-28 self-start">
                            <SettingsSidebar
                                activeTab={activeTab}
                                onSelectTab={setActiveTab}
                            />
                        </div>
                    </div>
                    <div className="lg:col-span-8 xl:col-span-9">
                        <div key={activeTab}>
                            {renderActivePanel()}
                        </div>
                    </div>
                </div>
            </div>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                isSubmitting={isPasswordSaving}
                onClose={() => setIsPasswordModalOpen(false)}
                onSubmit={handleSubmitChangePassword}
            />
        </div>
    );
}
