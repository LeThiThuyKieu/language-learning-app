import SettingRow from "./SettingRow";
import { AccountSettingsState } from "./types";

interface AccountSettingsPanelProps {
    settings: AccountSettingsState;
    onChangeDisplayName: () => void;
    onChangeEmail: () => void;
    onChangePassword: () => void;
    onToggleGoogle: () => void;
    onToggleFacebook: () => void;
}

export default function AccountSettingsPanel({
    settings,
    onChangeDisplayName,
    onChangeEmail,
    onChangePassword,
    onToggleGoogle,
    onToggleFacebook,
}: AccountSettingsPanelProps) {
    const primaryButtonClass = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors bg-primary text-primary-foreground hover:opacity-90";
    const outlineButtonClass = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors border border-slate-300 bg-white text-slate-900 hover:bg-slate-50";

    return (
        <div className="space-y-6">
            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-bold mb-4">Thông tin cá nhân</h3>

                    <SettingRow
                        title="Tên hiển thị"
                        description={`Hiện tại: ${settings.displayName}`}
                        right={
                            <button className={outlineButtonClass} onClick={onChangeDisplayName}>
                                Đổi tên hiển thị
                            </button>
                        }
                    />

                    <SettingRow
                        title="Địa chỉ email"
                        description={`Hiện tại: ${settings.email}`}
                        right={
                            <button className={outlineButtonClass} onClick={onChangeEmail}>
                                Đổi email
                            </button>
                        }
                    />
            </div>

            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-bold mb-4">Bảo mật</h3>
                    <SettingRow
                        title="Đổi mật khẩu"
                        description="Nên thay đổi định kỳ để bảo vệ tài khoản."
                        right={
                            <button className={primaryButtonClass} onClick={onChangePassword}>
                                Đổi mật khẩu
                            </button>
                        }
                    />
            </div>

            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-bold mb-4">Liên kết tài khoản</h3>

                    <SettingRow
                        title="Google"
                        description={settings.googleLinked ? "Đã liên kết" : "Chưa liên kết"}
                        right={
                            <button className={settings.googleLinked ? outlineButtonClass : primaryButtonClass} onClick={onToggleGoogle}>
                                {settings.googleLinked ? "Hủy liên kết Google" : "Liên kết Google"}
                            </button>
                        }
                    />

                    <SettingRow
                        title="Facebook"
                        description={settings.facebookLinked ? "Đã liên kết" : "Chưa liên kết"}
                        right={
                            <button className={settings.facebookLinked ? outlineButtonClass : primaryButtonClass} onClick={onToggleFacebook}>
                                {settings.facebookLinked ? "Hủy liên kết Facebook" : "Liên kết Facebook"}
                            </button>
                        }
                    />
            </div>
        </div>
    );
}
