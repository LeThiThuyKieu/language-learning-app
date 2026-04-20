import { LearningSettingsState, NotificationSettingsState } from "@/components/user/settings/types";

const LEARNING_SETTINGS_STORAGE_KEY = "lion-settings-learning";
const NOTIFICATION_SETTINGS_STORAGE_KEY = "lion-settings-notifications";

const defaultLearningSettings: LearningSettingsState = {
    dailyNewWordsGoal: 20,
    dailyPracticeGoal: 3,
    studyReminderEnabled: true,
    reminderTime: "19:30",
    spacedRepetitionEnabled: true,
    flashcardAutoPlayEnabled: false,
    autoPronunciationEnabled: true,
};

const defaultNotificationSettings: NotificationSettingsState = {
    dailyStudyReminder: true,
    streakReminder: true,
    newLessonNotification: true,
    emailNotifications: false,
    pushNotifications: true,
};

const readStoredValue = <T>(storageKey: string, fallback: T): T => {
    if (typeof window === "undefined") {
        return fallback;
    }

    try {
        const rawValue = window.localStorage.getItem(storageKey);
        if (!rawValue) {
            return fallback;
        }

        return { ...fallback, ...JSON.parse(rawValue) } as T;
    } catch {
        return fallback;
    }
};

const saveStoredValue = <T>(storageKey: string, value: T) => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(value));
};

export const getStoredLearningSettings = (): LearningSettingsState =>
    readStoredValue(LEARNING_SETTINGS_STORAGE_KEY, defaultLearningSettings);

export const saveLearningSettings = (settings: LearningSettingsState) =>
    saveStoredValue(LEARNING_SETTINGS_STORAGE_KEY, settings);

export const getStoredNotificationSettings = (): NotificationSettingsState =>
    readStoredValue(NOTIFICATION_SETTINGS_STORAGE_KEY, defaultNotificationSettings);

export const saveNotificationSettings = (settings: NotificationSettingsState) =>
    saveStoredValue(NOTIFICATION_SETTINGS_STORAGE_KEY, settings);
