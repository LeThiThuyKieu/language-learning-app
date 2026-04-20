import { Moon, Sun } from "lucide-react";
import SettingRow from "./SettingRow";
import { AppearanceSettingsState } from "./types";

interface AppearanceSettingsPanelProps {
    settings: AppearanceSettingsState;
    onChange: (next: AppearanceSettingsState) => void;
}

export default function AppearanceSettingsPanel({ settings, onChange }: AppearanceSettingsPanelProps) {
    // Hàm helper cập nhật từng trường để hạn chế lặp spread object.
    const update = <K extends keyof AppearanceSettingsState>(key: K, value: AppearanceSettingsState[K]) => {
        onChange({ ...settings, [key]: value });
    };

    const themeButtonClass = (theme: AppearanceSettingsState["theme"], isActive: boolean) => {
        const baseClass = "p-5 rounded-2xl border-2 text-left transition-all duration-200";
        if (theme === "light") {
            return `${baseClass} ${
                isActive
                    ? "border-primary-200  text-primary-900 font-bold"
                    : "hover:border-primary-300 hover:bg-slate-50"
            }`;
        }

        return `${baseClass} ${
            isActive
                ? "border-black bg-black text-white font-bold "
                : "hover:border-primary-300 hover:bg-slate-50"
        }`;
    };

    const toggleButtonClass = (isActive: boolean) =>
        `w-12 h-7 rounded-full transition-colors relative ${isActive ? "bg-primary-700" : "bg-slate-300"}`;

    const toggleKnobClass = (isActive: boolean) =>
        `absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`;

    return (
        <div className="space-y-6">
            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-bold mb-4">Chủ đề</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <button
                        className={themeButtonClass("light", settings.theme === "light")}
                        onClick={() => update("theme", "light")}
                    >
                        <Sun className="mb-2" size={20} />
                        <p className="font-semibold">Chế độ sáng</p>
                    </button>

                    <button
                        className={themeButtonClass("dark", settings.theme === "dark")}
                        onClick={() => update("theme", "dark")}
                    >
                        <Moon className="mb-2" size={20} />
                        <p className="font-semibold">Chế độ tối</p>
                    </button>
                </div>
            </div>

            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-bold mb-4">Hiển thị</h3>

                <SettingRow title="Cỡ chữ">
                    <select
                        value={settings.fontSize}
                        onChange={(event) => update("fontSize", event.target.value as AppearanceSettingsState["fontSize"])}
                        className="w-full md:w-64 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:border-primary-700"
                    >
                        <option value="small">Nhỏ</option>
                        <option value="medium">Vừa</option>
                        <option value="large">Lớn</option>
                    </select>
                </SettingRow>

                <SettingRow title="Ngôn ngữ giao diện">
                    <select
                        value={settings.language}
                        onChange={(event) => update("language", event.target.value as AppearanceSettingsState["language"])}
                        className="w-full md:w-64 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:border-primary-700"
                    >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">Tiếng Anh</option>
                    </select>
                </SettingRow>
            </div>

            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-bold mb-4">Hiệu ứng và âm thanh</h3>

                <SettingRow
                    title="Bật/Tắt hiệu ứng chuyển động"
                    right={
                        <button
                            type="button"
                            aria-label="Bật hoặc tắt hiệu ứng chuyển động"
                            onClick={() => update("animationsEnabled", !settings.animationsEnabled)}
                            className={toggleButtonClass(settings.animationsEnabled)}
                        >
                            <span className={toggleKnobClass(settings.animationsEnabled)} />
                        </button>
                    }
                />

                <SettingRow
                    title="Bật/Tắt âm thanh đúng/sai"
                    right={
                        <button
                            type="button"
                            aria-label="Bật hoặc tắt âm thanh đúng sai"
                            onClick={() => update("soundEffectsEnabled", !settings.soundEffectsEnabled)}
                            className={toggleButtonClass(settings.soundEffectsEnabled)}
                        >
                            <span className={toggleKnobClass(settings.soundEffectsEnabled)} />
                        </button>
                    }
                />
            </div>
        </div>
    );
}
