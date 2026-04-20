export type SettingsTab = "account" | "learning" | "notifications" | "appearance";

export type ThemeMode = "light" | "dark";
export type FontSizeOption = "small" | "medium" | "large";
export type AppLanguage = "vi" | "en";
export type SocialLinkStatus = "pending" | "linked" | "unlinked";

export interface AccountSettingsState {
    displayName: string;
    email: string;
    googleLinkStatus: SocialLinkStatus;
    facebookLinkStatus: SocialLinkStatus;
}

export interface LearningSettingsState {
    dailyNewWordsGoal: number;
    dailyPracticeGoal: number;
    studyReminderEnabled: boolean;
    reminderTime: string;
    spacedRepetitionEnabled: boolean;
    flashcardAutoPlayEnabled: boolean;
    autoPronunciationEnabled: boolean;
}

export interface NotificationSettingsState {
    dailyStudyReminder: boolean;
    streakReminder: boolean;
    newLessonNotification: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
}

export interface AppearanceSettingsState {
    theme: ThemeMode;
    fontSize: FontSizeOption;
    language: AppLanguage;
    animationsEnabled: boolean;
    soundEffectsEnabled: boolean;
}
