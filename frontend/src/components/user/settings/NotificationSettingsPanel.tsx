import SettingRow from "./SettingRow";
import SettingSwitch from "./SettingSwitch";
import { NotificationSettingsState } from "./types";

interface NotificationSettingsPanelProps {
    settings: NotificationSettingsState;
    onChange: (next: NotificationSettingsState) => void;
}

export default function NotificationSettingsPanel({ settings, onChange }: NotificationSettingsPanelProps) {
    // Gom logic cập nhật vào một helper để code dễ đọc hơn.
    const update = <K extends keyof NotificationSettingsState>(key: K, value: NotificationSettingsState[K]) => {
        onChange({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-bold mb-4">Thông báo học tập</h3>

                    <SettingRow
                        title="Nhắc học hằng ngày"
                        right={<SettingSwitch checked={settings.dailyStudyReminder} onChange={(value) => update("dailyStudyReminder", value)} />}
                    />

                    <SettingRow
                        title="Nhắc streak"
                        right={<SettingSwitch checked={settings.streakReminder} onChange={(value) => update("streakReminder", value)} />}
                    />

                    <SettingRow
                        title="Thông báo bài học mới"
                        right={<SettingSwitch checked={settings.newLessonNotification} onChange={(value) => update("newLessonNotification", value)} />}
                    />
            </div>

            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-bold mb-4">Thông báo liên lạc</h3>

                    <SettingRow
                        title="Thông báo qua email"
                        right={<SettingSwitch checked={settings.emailNotifications} onChange={(value) => update("emailNotifications", value)} />}
                    />

                    <SettingRow
                        title="Thông báo đẩy"
                        right={<SettingSwitch checked={settings.pushNotifications} onChange={(value) => update("pushNotifications", value)} />}
                    />
            </div>
        </div>
    );
}
