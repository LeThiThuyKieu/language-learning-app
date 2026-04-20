import SettingRow from "./SettingRow";
import { AccountSettingsState } from "./types";

interface AccountSettingsPanelProps {
    settings: AccountSettingsState;
    onChangeDisplayName: () => void;
    onChangeEmail: () => void;
    onChangePassword: () => void;
    onToggleGoogle: () => void;
    onToggleFacebook: () => void;
    isSaving?: boolean;
}

export default function AccountSettingsPanel({
                                                 settings,
                                                 onChangeDisplayName,
                                                 onChangeEmail,
                                                 onChangePassword,
                                                 onToggleGoogle,
                                                 onToggleFacebook,
                                                 isSaving = false,
                                             }: AccountSettingsPanelProps) {

    const primaryButtonClass =
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors bg-primary text-primary-foreground hover:opacity-90";

    const outlineButtonClass =
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors border border-slate-300 bg-white text-slate-900 hover:bg-slate-50";

    const pendingButtonClass =
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border border-dashed border-slate-300 bg-slate-50 text-slate-500 cursor-not-allowed";

    const iconButtonClass = `
        w-10 h-10
        flex items-center justify-center
    
        rounded-full
    
        bg-gradient-to-br
        from-primary-100
        to-primary-300
    
        text-primary-700
    
        border-2 border-primary-300
    
        hover:scale-105
        hover:from-primary-200
        hover:to-primary-400
    
        active:scale-95
    
        shadow-md
        transition-all duration-200
        `;

    return (
        <div className="space-y-6">

            {/* Thông tin cá nhân */}
            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-bold mb-4">
                    Thông tin cá nhân
                </h3>

                <SettingRow
                    title="Tên hiển thị"
                    description={`Hiện tại: ${settings.displayName}`}
                    right={
                        <button
                            onClick={onChangeDisplayName}
                            disabled={isSaving}
                            className={iconButtonClass}
                            aria-label="Đổi tên hiển thị"
                        >
                            <i className="fa-solid fa-pencil text-base"></i>
                        </button>
                    }
                />

                <SettingRow
                    title="Địa chỉ email"
                    description={`Hiện tại: ${settings.email}`}
                    right={
                        <button
                            onClick={onChangeEmail}
                            className={iconButtonClass}
                            aria-label="Đổi email"
                        >
                            <i className="fa-solid fa-pencil text-base"></i>
                        </button>
                    }
                />
            </div>

            {/* Bảo mật */}
            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-bold mb-4">
                    Bảo mật
                </h3>

                <SettingRow
                    title="Đổi mật khẩu"
                    description="Nên thay đổi định kỳ để bảo vệ tài khoản."
                    right={
                        <button
                            onClick={onChangePassword}
                            className={iconButtonClass}
                            aria-label="Đổi mật khẩu"
                        >
                            <i className="fa-solid fa-lock text-base"></i>
                        </button>
                    }
                />
            </div>

            {/* Liên kết tài khoản */}
            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-bold mb-4">
                    Liên kết tài khoản
                </h3>

                <SettingRow
                    title="Google"
                    description="Chưa hoàn thành / pending"
                    right={
                        <button
                            className={
                                settings.googleLinkStatus === "linked"
                                    ? outlineButtonClass
                                    : settings.googleLinkStatus === "pending"
                                        ? pendingButtonClass
                                        : primaryButtonClass
                            }
                            onClick={settings.googleLinkStatus === "pending" ? undefined : onToggleGoogle}
                            disabled={settings.googleLinkStatus === "pending"}
                        >
                            {settings.googleLinkStatus === "linked"
                                ? "Hủy liên kết Google"
                                : settings.googleLinkStatus === "pending"
                                    ? "Chưa hỗ trợ"
                                    : "Liên kết Google"}
                        </button>
                    }
                />

                <SettingRow
                    title="Facebook"
                    description="Chưa hoàn thành / pending"
                    right={
                        <button
                            className={
                                settings.facebookLinkStatus === "linked"
                                    ? outlineButtonClass
                                    : settings.facebookLinkStatus === "pending"
                                        ? pendingButtonClass
                                        : primaryButtonClass
                            }
                            onClick={settings.facebookLinkStatus === "pending" ? undefined : onToggleFacebook}
                            disabled={settings.facebookLinkStatus === "pending"}
                        >
                            {settings.facebookLinkStatus === "linked"
                                ? "Hủy liên kết Facebook"
                                : settings.facebookLinkStatus === "pending"
                                    ? "Chưa hỗ trợ"
                                    : "Liên kết Facebook"}
                        </button>
                    }
                />
            </div>

        </div>
    );
}