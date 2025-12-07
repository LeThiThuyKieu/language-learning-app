CREATE DATABASE language_learning_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE language_learning_app;

CREATE TABLE role (
                      id INT AUTO_INCREMENT PRIMARY KEY,
                      role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       email VARCHAR(100) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                       last_login DATETIME NULL,
                       status ENUM('active', 'banned') DEFAULT 'active'
);

CREATE TABLE user_role (
                           user_id INT,
                           role_id INT,
                           PRIMARY KEY (user_id, role_id),
                           FOREIGN KEY (user_id) REFERENCES users(id),
                           FOREIGN KEY (role_id) REFERENCES role(id)
);

CREATE TABLE user_profile (
                              id INT AUTO_INCREMENT PRIMARY KEY,
                              user_id INT UNIQUE,
                              full_name VARCHAR(100),
                              avatar_url TEXT,
                              target_goal VARCHAR(255),
                              current_level INT,
                              total_xp INT DEFAULT 0,
                              streak_count INT DEFAULT 0,
                              FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE levels (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        level_name VARCHAR(50) NOT NULL,
                        cefr_code VARCHAR(10),
                        min_score_required INT DEFAULT 0
);

CREATE TABLE placement_test (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                user_id INT,
                                score INT,
                                detected_level_id INT,
                                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (user_id) REFERENCES users(id),
                                FOREIGN KEY (detected_level_id) REFERENCES levels(id)
);

CREATE TABLE skill_tree (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            level_id INT,
                            title VARCHAR(255),
                            order_index INT,
                            is_locked_by_default BOOLEAN DEFAULT TRUE,
                            FOREIGN KEY (level_id) REFERENCES levels(id)
);

CREATE TABLE skill_node (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            skill_tree_id INT,
                            title VARCHAR(255),
                            node_type ENUM('VOCAB', 'LISTENING', 'SPEAKING', 'MATCHING', 'REVIEW'),
                            order_index INT,
                            FOREIGN KEY (skill_tree_id) REFERENCES skill_tree(id)
);

CREATE TABLE user_skill_tree_progress (
                                          id INT AUTO_INCREMENT PRIMARY KEY,
                                          user_id INT,
                                          skill_tree_id INT,
                                          status ENUM('locked', 'in_progress', 'done') DEFAULT 'locked',
                                          score INT DEFAULT 0,
                                          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                          FOREIGN KEY (user_id) REFERENCES users(id),
                                          FOREIGN KEY (skill_tree_id) REFERENCES skill_tree(id)
);

CREATE TABLE user_node_progress (
                                    id INT AUTO_INCREMENT PRIMARY KEY,
                                    user_id INT,
                                    node_id INT,
                                    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
                                    score INT DEFAULT 0,
                                    attempt_count INT DEFAULT 0,
                                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    FOREIGN KEY (user_id) REFERENCES users(id),
                                    FOREIGN KEY (node_id) REFERENCES skill_node(id)
);

CREATE TABLE xp_history (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT,
                            amount INT,
                            source VARCHAR(100),
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE badges (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        badge_name VARCHAR(100),
                        description TEXT,
                        required_xp INT,
                        icon_url TEXT
);

CREATE TABLE user_badges (
                             id INT AUTO_INCREMENT PRIMARY KEY,
                             user_id INT,
                             badge_id INT,
                             earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                             FOREIGN KEY (user_id) REFERENCES users(id),
                             FOREIGN KEY (badge_id) REFERENCES badges(id)
);

CREATE TABLE streak_history (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                user_id INT,
                                date DATE,
                                earned_xp INT DEFAULT 0,
                                FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE leaderboard (
                             id INT AUTO_INCREMENT PRIMARY KEY,
                             user_id INT,
                             total_xp INT,
                             rank_position INT,
                             updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                             FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE feedback (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          user_id INT,
                          skill_tree_id INT,
                          rating INT CHECK (rating BETWEEN 1 AND 5),
                          comment TEXT,
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          FOREIGN KEY (user_id) REFERENCES users(id),
                          FOREIGN KEY (skill_tree_id) REFERENCES skill_tree(id)
);
