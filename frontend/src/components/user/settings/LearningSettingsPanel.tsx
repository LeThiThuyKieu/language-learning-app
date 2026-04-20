import SettingRow from "./SettingRow";
import SettingSwitch from "./SettingSwitch";
import { LearningSettingsState } from "./types";

interface LearningSettingsPanelProps {
    settings: LearningSettingsState;
    onChange: (next: LearningSettingsState) => void;
}

export default function LearningSettingsPanel({ settings, onChange }: LearningSettingsPanelProps) {
    // Hàm cập nhật chung giúp tránh lặp code setState cho từng field.
    const update = <K extends keyof LearningSettingsState>(key: K, value: LearningSettingsState[K]) => {
        onChange({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-bold mb-4">Mục tiêu mỗi ngày</h3>

                    <SettingRow title="Số từ mới mỗi ngày" description="Đặt mục tiêu số từ mới bạn muốn học trong ngày.">
                        <input
                            type="number"
                            min={1}
                            max={200}
                            value={settings.dailyNewWordsGoal}
                            onChange={(event) => update("dailyNewWordsGoal", Number(event.target.value) || 1)}
                            className="w-full md:w-64 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:border-primary"
                        />
                    </SettingRow>

                    <SettingRow title="Số bài luyện mỗi ngày" description="Số bài tối thiểu để duy trì tiến độ học.">
                        <input
                            type="number"
                            min={1}
                            max={50}
                            value={settings.dailyPracticeGoal}
                            onChange={(event) => update("dailyPracticeGoal", Number(event.target.value) || 1)}
                            className="w-full md:w-64 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:border-primary"
                        />
                    </SettingRow>
            </div>

            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-bold mb-4">Nhắc học</h3>

                    <SettingRow
                        title="Bật/Tắt nhắc học"
                        right={
                            <SettingSwitch
                                checked={settings.studyReminderEnabled}
                                onChange={(value) => update("studyReminderEnabled", value)}
                                ariaLabel="Bật hoặc tắt nhắc học"
                            />
                        }
                    />

                    <SettingRow title="Giờ nhắc học" description="Hệ thống sẽ gửi nhắc học theo mốc giờ bạn chọn.">
                        <input
                            type="time"
                            value={settings.reminderTime}
                            disabled={!settings.studyReminderEnabled}
                            onChange={(event) => update("reminderTime", event.target.value)}
                            className="w-full md:w-64 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:border-primary disabled:bg-slate-100 disabled:text-slate-400"
                        />
                    </SettingRow>
            </div>

            <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-bold mb-4">Tùy chọn học tập</h3>

                    <SettingRow
                        title="Bật nhắc lại ngắt quãng (Spaced Repetition)"
                        right={
                            <SettingSwitch
                                checked={settings.spacedRepetitionEnabled}
                                onChange={(value) => update("spacedRepetitionEnabled", value)}
                                ariaLabel="Bật hoặc tắt nhắc lại ngắt quãng"
                            />
                        }
                    />

                    <SettingRow
                        title="Tự động chạy thẻ ghi nhớ"
                        right={
                            <SettingSwitch
                                checked={settings.flashcardAutoPlayEnabled}
                                onChange={(value) => update("flashcardAutoPlayEnabled", value)}
                                ariaLabel="Bật hoặc tắt tự động chạy thẻ ghi nhớ"
                            />
                        }
                    />

                    <SettingRow
                        title="Tự động phát âm"
                        right={
                            <SettingSwitch
                                checked={settings.autoPronunciationEnabled}
                                onChange={(value) => update("autoPronunciationEnabled", value)}
                                ariaLabel="Bật hoặc tắt tự động phát âm"
                            />
                        }
                    />
            </div>
        </div>
    );
}
