export const AVATAR_OPTIONS = [
    "https://api.dicebear.com/9.x/lorelei/svg?seed=Sophie",
    "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix",
    "https://api.dicebear.com/9.x/thumbs/svg?seed=Bear",
    "https://api.dicebear.com/9.x/thumbs/svg?seed=Rabbit",
    "https://api.dicebear.com/9.x/big-smile/svg?seed=Cookie",
    "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sky",
] as const;

export const DEFAULT_AVATAR_URL = AVATAR_OPTIONS[2];

export const getRandomAvatarUrl = () =>
    AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)] ?? DEFAULT_AVATAR_URL;