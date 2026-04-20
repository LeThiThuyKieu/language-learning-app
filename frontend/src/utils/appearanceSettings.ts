import { AppearanceSettingsState } from "@/components/user/settings/types";

export const APPEARANCE_STORAGE_KEY = "lion-settings-appearance";

export const defaultAppearanceSettings: AppearanceSettingsState = {
    theme: "light",
    fontSize: "medium",
    language: "vi",
    animationsEnabled: true,
    soundEffectsEnabled: true,
};

export const fontSizeClassMap: Record<AppearanceSettingsState["fontSize"], string> = {
    small: "14px",
    medium: "16px",
    large: "18px",
};

export const getStoredAppearanceSettings = (): AppearanceSettingsState => {
    if (typeof window === "undefined") {
        return defaultAppearanceSettings;
    }

    try {
        const rawValue = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
        if (!rawValue) {
            return defaultAppearanceSettings;
        }

        const parsedValue = JSON.parse(rawValue) as Partial<AppearanceSettingsState>;
        return {
            theme: parsedValue.theme === "dark" ? "dark" : "light",
            fontSize: parsedValue.fontSize === "small" || parsedValue.fontSize === "large" ? parsedValue.fontSize : "medium",
            language: parsedValue.language === "en" ? "en" : "vi",
            animationsEnabled: typeof parsedValue.animationsEnabled === "boolean" ? parsedValue.animationsEnabled : true,
            soundEffectsEnabled: typeof parsedValue.soundEffectsEnabled === "boolean" ? parsedValue.soundEffectsEnabled : true,
        };
    } catch {
        return defaultAppearanceSettings;
    }
};

export const saveAppearanceSettings = (settings: AppearanceSettingsState) => {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(settings));
};

export const applyAppearanceSettings = (settings: AppearanceSettingsState) => {
    const rootElement = document.documentElement;
    rootElement.style.fontSize = fontSizeClassMap[settings.fontSize];
    delete rootElement.dataset.theme;
    delete document.body.dataset.theme;
};

export const notifyAppearanceSettingsChanged = () => {
    window.dispatchEvent(new Event("lion-appearance-settings-changed"));
};
