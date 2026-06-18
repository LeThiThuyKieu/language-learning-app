-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.4.32-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for language_learning_app
CREATE DATABASE IF NOT EXISTS `language_learning_app` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `language_learning_app`;

-- Dumping structure for table language_learning_app.badges
CREATE TABLE IF NOT EXISTS `badges` (
                                        `id` int(11) NOT NULL AUTO_INCREMENT,
    `badge_name` varchar(100) DEFAULT NULL,
    `description` text DEFAULT NULL,
    `required_kn` int(11) DEFAULT NULL,
    `icon_url` text DEFAULT NULL,
    `status` varchar(255) NOT NULL,
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.chatbot_rule
CREATE TABLE IF NOT EXISTS `chatbot_rule` (
                                              `id` int(11) NOT NULL AUTO_INCREMENT,
    `rule_name` varchar(100) NOT NULL COMMENT 'Tên rule để dễ quản lý trong admin',
    `keywords` text NOT NULL COMMENT 'Từ khóa phân cách bởi |, vd: quên mật khẩu|reset password',
    `bot_response` text NOT NULL COMMENT 'Câu trả lời tự động khi khớp keyword',
    `category_id` int(11) DEFAULT NULL COMMENT 'NULL = áp dụng cho mọi category',
    `priority` int(11) NOT NULL DEFAULT 0 COMMENT 'Ưu tiên cao hơn được kiểm tra trước',
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `created_at` datetime DEFAULT current_timestamp(),
    `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_chatbot_active` (`is_active`),
    KEY `idx_chatbot_category` (`category_id`),
    CONSTRAINT `chatbot_rule_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `support_category` (`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chatbot rule-based: keyword matching → auto reply';

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.faq
CREATE TABLE IF NOT EXISTS `faq` (
                                     `id` int(11) NOT NULL AUTO_INCREMENT,
    `question` varchar(255) NOT NULL,
    `answer` text NOT NULL,
    `display_order` int(11) DEFAULT 0,
    `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    `created_at` datetime DEFAULT current_timestamp(),
    `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.feedback
CREATE TABLE IF NOT EXISTS `feedback` (
                                          `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `skill_tree_id` int(11) DEFAULT NULL,
    `rating` int(11) NOT NULL,
    `created_at` datetime DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `skill_tree_id` (`skill_tree_id`),
    CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`skill_tree_id`) REFERENCES `skill_tree` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.general_revision_questions
CREATE TABLE IF NOT EXISTS `general_revision_questions` (
                                                            `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `mongo_question_id` varchar(50) NOT NULL COMMENT 'ObjectId từ MongoDB',
    `topic_id` int(11) NOT NULL,
    `task_id` int(11) NOT NULL,
    `question_type` varchar(50) NOT NULL COMMENT 'VOCAB_IMAGE | LISTENING | SPEAKING | MATCHING',
    `correct_answer` text DEFAULT NULL COMMENT 'Đáp án đúng, dùng cho chấm điểm',
    `created_at` datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_grq_mongo_id` (`mongo_question_id`),
    KEY `idx_grq_topic` (`topic_id`),
    KEY `idx_grq_task` (`task_id`),
    CONSTRAINT `fk_grq_task` FOREIGN KEY (`task_id`) REFERENCES `general_revision_task` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_grq_topic` FOREIGN KEY (`topic_id`) REFERENCES `general_revision_topic` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mapping câu hỏi ôn tập (Mongo <-> SQL) và lưu correct_answer';

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.general_revision_task
CREATE TABLE IF NOT EXISTS `general_revision_task` (
                                                       `id` int(11) NOT NULL AUTO_INCREMENT,
    `topic_id` int(11) NOT NULL,
    `task_index` int(11) NOT NULL,
    `task_label` varchar(100) NOT NULL COMMENT 'Tên task hiển thị, vd: Từ vựng, Nghe hiểu…',
    `question_type` varchar(50) NOT NULL COMMENT 'Loại bài: VOCAB | LISTENING | SPEAKING | MATCHING | READING | WRITING | DICTATION | …',
    `description` varchar(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_grt_topic_task` (`topic_id`,`task_index`),
    KEY `idx_grt_topic` (`topic_id`),
    CONSTRAINT `fk_grt_topic` FOREIGN KEY (`topic_id`) REFERENCES `general_revision_topic` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='4 task của mỗi chủ đề ôn tập tổng hợp; mỗi task ứng 1 dạng bài';

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.general_revision_topic
CREATE TABLE IF NOT EXISTS `general_revision_topic` (
                                                        `id` int(11) NOT NULL AUTO_INCREMENT,
    `title` varchar(255) NOT NULL COMMENT 'Tên chủ đề, vd: Daily Life, Travel, Business…',
    `description` text DEFAULT NULL,
    `order_index` int(11) NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị',
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='10 chủ đề ôn tập tổng hợp';

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.leaderboard
CREATE TABLE IF NOT EXISTS `leaderboard` (
                                             `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `total_xp` int(11) DEFAULT NULL,
    `rank_position` int(11) DEFAULT NULL,
    `updated_at` datetime DEFAULT current_timestamp(),
    `total_kn` int(11) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `leaderboard_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.levels
CREATE TABLE IF NOT EXISTS `levels` (
                                        `id` int(11) NOT NULL AUTO_INCREMENT,
    `level_name` varchar(50) NOT NULL,
    `cefr_code` varchar(10) DEFAULT NULL,
    `min_score_required` int(11) DEFAULT 0,
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.placement_test
CREATE TABLE IF NOT EXISTS `placement_test` (
                                                `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `status` varchar(32) NOT NULL DEFAULT 'IN_PROGRESS',
    `issued_json` longtext DEFAULT NULL,
    `scores_json` longtext DEFAULT NULL,
    `total_score` double DEFAULT NULL,
    `detected_level_id` int(11) DEFAULT NULL,
    `created_at` datetime NOT NULL DEFAULT current_timestamp(),
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_placement_session_user` (`user_id`),
    KEY `fk_placement_session_level` (`detected_level_id`),
    CONSTRAINT `fk_placement_session_level` FOREIGN KEY (`detected_level_id`) REFERENCES `levels` (`id`),
    CONSTRAINT `fk_placement_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.questions
CREATE TABLE IF NOT EXISTS `questions` (
                                           `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `mongo_question_id` varchar(50) NOT NULL,
    `node_id` int(11) DEFAULT NULL,
    `level_id` int(11) DEFAULT NULL,
    `question_type` enum('VOCAB','LISTENING','SPEAKING','MATCHING') DEFAULT NULL,
    `correct_answer` text DEFAULT NULL,
    `created_at` datetime DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `mongo_question_id` (`mongo_question_id`),
    KEY `node_id` (`node_id`),
    KEY `level_id` (`level_id`),
    CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `skill_node` (`id`),
    CONSTRAINT `questions_ibfk_2` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=4870 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.role
CREATE TABLE IF NOT EXISTS `role` (
                                      `id` int(11) NOT NULL AUTO_INCREMENT,
    `role_name` varchar(50) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `role_name` (`role_name`)
    ) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.skill_node
CREATE TABLE IF NOT EXISTS `skill_node` (
                                            `id` int(11) NOT NULL AUTO_INCREMENT,
    `skill_tree_id` int(11) DEFAULT NULL,
    `title` varchar(255) DEFAULT NULL,
    `node_type` enum('VOCAB','LISTENING','SPEAKING','MATCHING','REVIEW') DEFAULT NULL,
    `order_index` int(11) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `skill_tree_id` (`skill_tree_id`),
    CONSTRAINT `skill_node_ibfk_1` FOREIGN KEY (`skill_tree_id`) REFERENCES `skill_tree` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.skill_tree
CREATE TABLE IF NOT EXISTS `skill_tree` (
                                            `id` int(11) NOT NULL AUTO_INCREMENT,
    `level_id` int(11) DEFAULT NULL,
    `order_index` int(11) DEFAULT NULL,
    `is_locked_by_default` tinyint(1) DEFAULT 1,
    `difficulty` double NOT NULL DEFAULT 0.5 COMMENT 'Độ khó adaptive [0,1]. Mặc định 0.5 (Cold Start). Cập nhật hàng tuần khi có dữ liệu mới.',
    `difficulty_updated_at` datetime DEFAULT NULL COMMENT 'Thời điểm cập nhật difficulty gần nhất. NULL = chưa từng cập nhật.',
    PRIMARY KEY (`id`),
    KEY `level_id` (`level_id`),
    CONSTRAINT `skill_tree_ibfk_1` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.support_category
CREATE TABLE IF NOT EXISTS `support_category` (
                                                  `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(50) NOT NULL,
    `display_name` varchar(100) NOT NULL,
    `color_bg` varchar(50) DEFAULT NULL,
    `color_text` varchar(50) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `name` (`name`)
    ) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.support_email_log
CREATE TABLE IF NOT EXISTS `support_email_log` (
                                                   `id` int(11) NOT NULL AUTO_INCREMENT,
    `ticket_id` int(11) DEFAULT NULL,
    `to_email` varchar(100) DEFAULT NULL,
    `subject` varchar(255) DEFAULT NULL,
    `status` enum('SUCCESS','FAILED') DEFAULT NULL,
    `error_message` text DEFAULT NULL,
    `sent_at` datetime DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `ticket_id` (`ticket_id`),
    CONSTRAINT `support_email_log_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `support_ticket` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.support_message
CREATE TABLE IF NOT EXISTS `support_message` (
                                                 `id` int(11) NOT NULL AUTO_INCREMENT,
    `ticket_id` int(11) NOT NULL,
    `sender_type` enum('USER','ADMIN','BOT') NOT NULL,
    `message` text NOT NULL,
    `created_at` datetime DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_message_ticket` (`ticket_id`),
    CONSTRAINT `support_message_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `support_ticket` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.support_ticket
CREATE TABLE IF NOT EXISTS `support_ticket` (
                                                `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `guest_id` varchar(36) DEFAULT NULL,
    `guest_email` varchar(100) DEFAULT NULL,
    `guest_name` varchar(100) DEFAULT NULL,
    `subject` varchar(255) DEFAULT NULL,
    `category_id` int(11) NOT NULL,
    `status` enum('OPEN','IN_PROGRESS','RESOLVED','CLOSED') DEFAULT 'OPEN',
    `created_at` datetime DEFAULT current_timestamp(),
    `source` enum('CHAT','EMAIL') NOT NULL DEFAULT 'EMAIL',
    `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `idx_ticket_status` (`status`),
    KEY `idx_ticket_category` (`category_id`),
    KEY `idx_ticket_source` (`source`),
    KEY `idx_ticket_guest` (`guest_id`),
    CONSTRAINT `support_ticket_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `support_ticket_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `support_category` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.users
CREATE TABLE IF NOT EXISTS `users` (
                                       `id` int(11) NOT NULL AUTO_INCREMENT,
    `email` varchar(100) NOT NULL,
    `password_hash` varchar(255) DEFAULT NULL,
    `auth_provider` enum('LOCAL','GOOGLE','FACEBOOK') NOT NULL DEFAULT 'LOCAL',
    `created_at` datetime DEFAULT current_timestamp(),
    `last_login` datetime DEFAULT NULL,
    `status` enum('active','banned') DEFAULT 'active',
    `provider_user_id` varchar(255) DEFAULT NULL,
    `email_verified` bit(1) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`)
    ) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_badges
CREATE TABLE IF NOT EXISTS `user_badges` (
                                             `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `badge_id` int(11) DEFAULT NULL,
    `earned_at` datetime DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `badge_id` (`badge_id`),
    CONSTRAINT `user_badges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `user_badges_ibfk_2` FOREIGN KEY (`badge_id`) REFERENCES `badges` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_general_revision_task_attempt
CREATE TABLE IF NOT EXISTS `user_general_revision_task_attempt` (
                                                                    `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `task_id` int(11) NOT NULL,
    `correct_count` int(11) NOT NULL DEFAULT 0,
    `total_count` int(11) NOT NULL DEFAULT 0,
    `score` int(11) NOT NULL DEFAULT 0 COMMENT 'Điểm 0-100',
    `attempted_at` datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_ugrta_user` (`user_id`),
    KEY `idx_ugrta_task` (`task_id`),
    CONSTRAINT `fk_ugrta_task` FOREIGN KEY (`task_id`) REFERENCES `general_revision_task` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ugrta_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử làm từng task ôn tập tổng hợp';

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_general_revision_topic_progress
CREATE TABLE IF NOT EXISTS `user_general_revision_topic_progress` (
                                                                      `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `topic_id` int(11) NOT NULL,
    `completed_tasks` int(11) NOT NULL,
    `status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
    `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_ugrtp_user_topic` (`user_id`,`topic_id`),
    KEY `idx_ugrtp_user` (`user_id`),
    KEY `idx_ugrtp_topic` (`topic_id`),
    CONSTRAINT `fk_ugrtp_topic` FOREIGN KEY (`topic_id`) REFERENCES `general_revision_topic` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ugrtp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tiến trình ôn tập tổng hợp của user theo từng chủ đề';

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_kn
CREATE TABLE IF NOT EXISTS `user_kn` (
                                         `id` int(11) NOT NULL AUTO_INCREMENT,
    `total_kn` int(11) NOT NULL,
    `updated_at` datetime(6) DEFAULT NULL,
    `user_id` int(11) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_s272e3aqu0gch92qj97fw74mp` (`user_id`),
    CONSTRAINT `FKtijrmdli7n3k26lv3byssd75s` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_level_question_snapshot
CREATE TABLE IF NOT EXISTS `user_level_question_snapshot` (
                                                              `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `level_id` int(11) NOT NULL,
    `payload_json` longtext NOT NULL,
    `created_at` datetime DEFAULT current_timestamp(),
    `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_level_snapshot` (`user_id`,`level_id`),
    KEY `level_id` (`level_id`),
    CONSTRAINT `fk_ulqs_level` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ulqs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_node_attempt_summary
CREATE TABLE IF NOT EXISTS `user_node_attempt_summary` (
                                                           `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `node_id` int(11) DEFAULT NULL,
    `total_questions` int(11) DEFAULT NULL,
    `correct_count` int(11) DEFAULT NULL,
    `total_score` int(11) DEFAULT NULL,
    `completed_at` datetime DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `node_id` (`node_id`),
    CONSTRAINT `user_node_attempt_summary_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `user_node_attempt_summary_ibfk_2` FOREIGN KEY (`node_id`) REFERENCES `skill_node` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_node_progress
CREATE TABLE IF NOT EXISTS `user_node_progress` (
                                                    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `node_id` int(11) DEFAULT NULL,
    `status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
    `earned_xp` int(11) NOT NULL,
    `max_xp` int(11) NOT NULL,
    `attempt_count` int(11) DEFAULT 0,
    `updated_at` datetime DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `node_id` (`node_id`),
    CONSTRAINT `user_node_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `user_node_progress_ibfk_2` FOREIGN KEY (`node_id`) REFERENCES `skill_node` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_profile
CREATE TABLE IF NOT EXISTS `user_profile` (
                                              `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `full_name` varchar(100) DEFAULT NULL,
    `avatar_url` text DEFAULT NULL,
    `target_goal` varchar(255) DEFAULT NULL,
    `current_level` int(11) DEFAULT NULL,
    `total_xp` int(11) DEFAULT 0,
    `streak_count` int(11) DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_id` (`user_id`),
    KEY `fk_user_level` (`current_level`),
    CONSTRAINT `fk_user_level` FOREIGN KEY (`current_level`) REFERENCES `levels` (`id`),
    CONSTRAINT `user_profile_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_question_attempt
CREATE TABLE IF NOT EXISTS `user_question_attempt` (
                                                       `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `question_id` bigint(20) DEFAULT NULL,
    `user_answer` text DEFAULT NULL,
    `is_correct` tinyint(1) DEFAULT NULL,
    `score` int(11) DEFAULT NULL CHECK (`score` in (0,10)),
    `attempt_time` datetime DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `question_id` (`question_id`),
    CONSTRAINT `user_question_attempt_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `user_question_attempt_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=1157 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_review_attempt
CREATE TABLE IF NOT EXISTS `user_review_attempt` (
                                                     `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `node_id` int(11) NOT NULL,
    `correct_count` int(11) NOT NULL DEFAULT 0,
    `total_count` int(11) NOT NULL DEFAULT 0,
    `accuracy` int(11) NOT NULL DEFAULT 0 COMMENT 'Tỷ lệ đúng 0-100%',
    `elapsed_seconds` int(11) NOT NULL DEFAULT 0 COMMENT 'Thời gian làm bài (giây)',
    `timed_out` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 nếu hết giờ',
    `outcome` varchar(20) NOT NULL COMMENT 'FAST_TRACKER|STEADY|SLOW_PASS|FAIL|CARELESS',
    `passed` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 nếu đạt (outcome != FAIL và != CARELESS)',
    `attempted_at` datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_review_attempt_user` (`user_id`),
    KEY `idx_review_attempt_node` (`node_id`),
    CONSTRAINT `fk_review_attempt_node` FOREIGN KEY (`node_id`) REFERENCES `skill_node` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_review_attempt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_role
CREATE TABLE IF NOT EXISTS `user_role` (
                                           `user_id` int(11) NOT NULL,
    `role_id` int(11) NOT NULL,
    PRIMARY KEY (`user_id`,`role_id`),
    KEY `role_id` (`role_id`),
    CONSTRAINT `user_role_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `user_role_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_skill_tree_progress
CREATE TABLE IF NOT EXISTS `user_skill_tree_progress` (
                                                          `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `skill_tree_id` int(11) DEFAULT NULL,
    `status` enum('locked','in_progress','done') DEFAULT 'locked',
    `accuracy` double NOT NULL,
    `initial_order_index` int(11) DEFAULT NULL COMMENT 'order_index của tree tại thời điểm user bắt đầu học. Dùng để sort lộ trình đúng thứ tự gốc dù adaptive difficulty có đổi thứ tự sau.',
    `updated_at` datetime DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `skill_tree_id` (`skill_tree_id`),
    CONSTRAINT `user_skill_tree_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `user_skill_tree_progress_ibfk_2` FOREIGN KEY (`skill_tree_id`) REFERENCES `skill_tree` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_skip_test_attempt
CREATE TABLE IF NOT EXISTS `user_skip_test_attempt` (
                                                        `id` bigint(20) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `target_level_id` int(11) NOT NULL COMMENT 'Level muốn học vượt lên',
    `correct_count` int(11) NOT NULL DEFAULT 0,
    `total_count` int(11) NOT NULL DEFAULT 0,
    `accuracy` int(11) NOT NULL DEFAULT 0 COMMENT 'Tỷ lệ đúng 0-100%',
    `passed` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 nếu đạt (accuracy >= 70%)',
    `attempted_at` datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_skip_test_user` (`user_id`),
    KEY `idx_skip_test_level` (`target_level_id`),
    CONSTRAINT `fk_skip_test_level` FOREIGN KEY (`target_level_id`) REFERENCES `levels` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_skip_test_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lưu lịch sử các lần user thử học vượt level';

-- Data exporting was unselected.

-- Dumping structure for table language_learning_app.user_streak
CREATE TABLE IF NOT EXISTS `user_streak` (
                                             `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) DEFAULT NULL,
    `date` date NOT NULL,
    `earned_xp` int(11) DEFAULT 0,
    `earned_kn` int(11) DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_streak_date` (`user_id`,`date`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `streak_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE grammar_topics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    display_order INT NOT NULL,
    json_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
