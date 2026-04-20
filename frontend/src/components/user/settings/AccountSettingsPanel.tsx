import {useEffect, useState} from "react";
import SettingRow from "./SettingRow";
import {AccountSettingsState} from "./types";

interface AccountSettingsPanelProps {
    settings: AccountSettingsState;
    onSaveDisplayName: (nextName: string) => Promise<boolean>;
    onChangeEmail: () => void;
    onChangePassword: () => void;
    onToggleGoogle: () => void;
    onToggleFacebook: () => void;
    isSaving?: boolean;
}

export default function AccountSettingsPanel({
                                                 settings,
                                                 onSaveDisplayName,
                                                 onChangePassword,
                                                 onToggleGoogle,
                                                 onToggleFacebook,
                                                 isSaving = false,
                                             }: AccountSettingsPanelProps) {
    const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
    const [displayNameInput, setDisplayNameInput] = useState(settings.displayName);

    useEffect(() => {
        if (!isEditingDisplayName) {
            setDisplayNameInput(settings.displayName);
        }
    }, [settings.displayName, isEditingDisplayName]);

    const handleSaveDisplayName = async () => {
        const trimmedName = displayNameInput.trim();
        if (!trimmedName) {
            return;
        }

        const isUpdated = await onSaveDisplayName(trimmedName);
        if (isUpdated) {
            setIsEditingDisplayName(false);
        }
    };

    const handleCancelEditDisplayName = () => {
        setDisplayNameInput(settings.displayName);
        setIsEditingDisplayName(false);
    };

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
                <h3 className="text-xl font-bold mb-5">
                    Thông tin cá nhân
                </h3>

                {/* TÊN HIỂN THỊ */}
                <SettingRow
                    title="Tên hiển thị"
                    description={undefined}
                    right={
                        !isEditingDisplayName && (
                            <button
                                onClick={() => setIsEditingDisplayName(true)}
                                disabled={isSaving}
                                className="
                        h-10 w-10
                        rounded-full
                        bg-primary-100
                        text-primary-700
                        transition-all duration-200
                        hover:bg-primary-200
                        hover:scale-105
                    "
                                aria-label="Đổi tên hiển thị"
                            >
                                <i className="fa-solid fa-pencil"></i>
                            </button>
                        )
                    }
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="
                h-11 w-11
                rounded-2xl
                bg-primary-100
                flex items-center justify-center
                text-primary-700
            ">
                            <i className="fa-solid fa-user"></i>
                        </div>

                        <div>
                            <div className="font-semibold text-slate-800">
                                {settings.displayName}
                            </div>

                            <div className="text-xs text-slate-500">
                                Tên hiển thị công khai của bạn
                            </div>
                        </div>
                    </div>

                    {isEditingDisplayName && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <input
                                type="text"
                                value={displayNameInput}
                                onChange={(event) =>
                                    setDisplayNameInput(
                                        event.target.value
                                    )
                                }
                                className="
                        w-full sm:max-w-md
                        rounded-xl
                        border border-slate-300
                        px-3 py-2
                        text-sm

                        focus:outline-none
                        focus:ring-2
                        focus:ring-primary
                    "
                                placeholder="Nhập tên hiển thị mới"
                                disabled={isSaving}
                            />

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    onClick={handleSaveDisplayName}
                                    disabled={isSaving}
                                    className="
                            rounded-xl
                            bg-primary-600
                            px-4 py-2
                            text-sm font-semibold
                            text-white

                            hover:bg-primary-700
                            disabled:opacity-60
                        "
                                >
                                    {isSaving
                                        ? "Đang lưu..."
                                        : "Lưu"}
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleCancelEditDisplayName
                                    }
                                    disabled={isSaving}
                                    className="
                            rounded-xl
                            border border-slate-300
                            bg-white
                            px-4 py-2
                            text-sm font-semibold
                            text-slate-700
                            hover:bg-slate-50
                        "
                                >
                                    Hủy
                                </button>

                            </div>
                        </div>
                    )}
                </SettingRow>

                {/* EMAIL */}
                <SettingRow
                    title="Email đăng nhập"
                    description={undefined}
                >
                    <div className="flex items-center gap-3">

                        <div className="
            h-11 w-11
            rounded-2xl
            bg-amber-100
            flex items-center justify-center
            text-amber-700
        ">
                            <i className="fa-solid fa-envelope"></i>
                        </div>

                        <div className="flex-1">
                            <div className="font-semibold text-slate-800">
                                {settings.email}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">

                <span className="
                    rounded-full
                    bg-emerald-100
                    px-3 py-1
                    text-xs font-medium
                    text-emerald-700
                ">
                    Đã xác minh
                </span>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Liên hệ hỗ trợ nếu cần cập nhật.
                            </p>

                        </div>

                    </div>
                </SettingRow>
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