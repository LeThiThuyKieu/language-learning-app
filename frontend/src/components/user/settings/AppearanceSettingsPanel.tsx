import { Moon, Sun } from "lucide-react";
import SettingRow from "./SettingRow";
import SettingSwitch from "./SettingSwitch";
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

    return (
        <div className="space-y-6">
            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-bold mb-4">Chủ đề</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <button
                            className={`p-5 rounded-2xl border-2 text-left transition-all ${
                                settings.theme === "light" ? "border-primary bg-orange-50" : "border-slate-200"
                            }`}
                            onClick={() => update("theme", "light")}
                        >
                            <Sun className="mb-2" size={20} />
                            <p className="font-semibold">Chế độ sáng</p>
                        </button>

                        <button
                            className={`p-5 rounded-2xl border-2 text-left transition-all ${
                                settings.theme === "dark" ? "border-primary bg-orange-50" : "border-slate-200"
                            }`}
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
                            className="w-full md:w-64 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:border-primary"
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
                            className="w-full md:w-64 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:border-primary"
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
                            <SettingSwitch
                                checked={settings.animationsEnabled}
                                onChange={(value) => update("animationsEnabled", value)}
                            />
                        }
                    />

                    <SettingRow
                        title="Bật/Tắt âm thanh đúng/sai"
                        right={
                            <SettingSwitch
                                checked={settings.soundEffectsEnabled}
                                onChange={(value) => update("soundEffectsEnabled", value)}
                            />
                        }
                    />
            </div>
        </div>
    );
}
