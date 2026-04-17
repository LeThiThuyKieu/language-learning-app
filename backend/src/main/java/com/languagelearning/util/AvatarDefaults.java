package com.languagelearning.util;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public final class AvatarDefaults {

    public static final List<String> DEFAULT_AVATAR_URLS = List.of(
            "https://api.dicebear.com/9.x/lorelei/svg?seed=Sophie",
            "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix",
            "https://api.dicebear.com/9.x/thumbs/svg?seed=Bear",
            "https://api.dicebear.com/9.x/thumbs/svg?seed=Rabbit",
            "https://api.dicebear.com/9.x/big-smile/svg?seed=Cookie",
            "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sky"
    );

    private AvatarDefaults() {
    }

    public static String randomAvatarUrl() {
        if (DEFAULT_AVATAR_URLS.isEmpty()) {
            throw new IllegalStateException("No default avatar URLs configured");
        }

        return DEFAULT_AVATAR_URLS.get(ThreadLocalRandom.current().nextInt(DEFAULT_AVATAR_URLS.size()));
    }
}