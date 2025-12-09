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
  `required_xp` int(11) DEFAULT NULL,
  `icon_url` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.badges: ~0 rows (approximately)
DELETE FROM `badges`;

-- Dumping structure for table language_learning_app.feedback
CREATE TABLE IF NOT EXISTS `feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `skill_tree_id` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `skill_tree_id` (`skill_tree_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`skill_tree_id`) REFERENCES `skill_tree` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.feedback: ~0 rows (approximately)
DELETE FROM `feedback`;

-- Dumping structure for table language_learning_app.leaderboard
CREATE TABLE IF NOT EXISTS `leaderboard` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `total_xp` int(11) DEFAULT NULL,
  `rank_position` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `leaderboard_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.leaderboard: ~0 rows (approximately)
DELETE FROM `leaderboard`;

-- Dumping structure for table language_learning_app.levels
CREATE TABLE IF NOT EXISTS `levels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `level_name` varchar(50) NOT NULL,
  `cefr_code` varchar(10) DEFAULT NULL,
  `min_score_required` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.levels: ~0 rows (approximately)
DELETE FROM `levels`;

-- Dumping structure for table language_learning_app.placement_test
CREATE TABLE IF NOT EXISTS `placement_test` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `score` int(11) DEFAULT NULL,
  `detected_level_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `detected_level_id` (`detected_level_id`),
  CONSTRAINT `placement_test_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `placement_test_ibfk_2` FOREIGN KEY (`detected_level_id`) REFERENCES `levels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.placement_test: ~0 rows (approximately)
DELETE FROM `placement_test`;

-- Dumping structure for table language_learning_app.role
CREATE TABLE IF NOT EXISTS `role` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.role: ~0 rows (approximately)
DELETE FROM `role`;
INSERT INTO `role` (`id`, `role_name`) VALUES
	(1, 'USER');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.skill_node: ~0 rows (approximately)
DELETE FROM `skill_node`;

-- Dumping structure for table language_learning_app.skill_tree
CREATE TABLE IF NOT EXISTS `skill_tree` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `level_id` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `order_index` int(11) DEFAULT NULL,
  `is_locked_by_default` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `level_id` (`level_id`),
  CONSTRAINT `skill_tree_ibfk_1` FOREIGN KEY (`level_id`) REFERENCES `levels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.skill_tree: ~0 rows (approximately)
DELETE FROM `skill_tree`;

-- Dumping structure for table language_learning_app.streak_history
CREATE TABLE IF NOT EXISTS `streak_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `earned_xp` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `streak_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.streak_history: ~0 rows (approximately)
DELETE FROM `streak_history`;

-- Dumping structure for table language_learning_app.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `last_login` datetime DEFAULT NULL,
  `status` enum('active','banned') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.users: ~1 rows (approximately)
DELETE FROM `users`;
INSERT INTO `users` (`id`, `email`, `password_hash`, `created_at`, `last_login`, `status`) VALUES
	(1, 'kieuk1030@gmail.com', '$2a$10$YRjFMmH9Iecz/S0hittrHeOdFZFEp9uf1nN9TmGe.Qb5iUR8oAohe', '2025-12-08 15:54:37', '2025-12-08 15:55:22', 'active');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.user_badges: ~0 rows (approximately)
DELETE FROM `user_badges`;

-- Dumping structure for table language_learning_app.user_node_progress
CREATE TABLE IF NOT EXISTS `user_node_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `node_id` int(11) DEFAULT NULL,
  `status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
  `score` int(11) DEFAULT 0,
  `attempt_count` int(11) DEFAULT 0,
  `updated_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `node_id` (`node_id`),
  CONSTRAINT `user_node_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_node_progress_ibfk_2` FOREIGN KEY (`node_id`) REFERENCES `skill_node` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.user_node_progress: ~0 rows (approximately)
DELETE FROM `user_node_progress`;

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
  CONSTRAINT `user_profile_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.user_profile: ~0 rows (approximately)
DELETE FROM `user_profile`;
INSERT INTO `user_profile` (`id`, `user_id`, `full_name`, `avatar_url`, `target_goal`, `current_level`, `total_xp`, `streak_count`) VALUES
	(1, 1, 'Nguyễn An', NULL, NULL, NULL, 0, 0);

-- Dumping structure for table language_learning_app.user_role
CREATE TABLE IF NOT EXISTS `user_role` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_role_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_role_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.user_role: ~0 rows (approximately)
DELETE FROM `user_role`;
INSERT INTO `user_role` (`user_id`, `role_id`) VALUES
	(1, 1);

-- Dumping structure for table language_learning_app.user_skill_tree_progress
CREATE TABLE IF NOT EXISTS `user_skill_tree_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `skill_tree_id` int(11) DEFAULT NULL,
  `status` enum('locked','in_progress','done') DEFAULT 'locked',
  `score` int(11) DEFAULT 0,
  `updated_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `skill_tree_id` (`skill_tree_id`),
  CONSTRAINT `user_skill_tree_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_skill_tree_progress_ibfk_2` FOREIGN KEY (`skill_tree_id`) REFERENCES `skill_tree` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.user_skill_tree_progress: ~0 rows (approximately)
DELETE FROM `user_skill_tree_progress`;

-- Dumping structure for table language_learning_app.xp_history
CREATE TABLE IF NOT EXISTS `xp_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `amount` int(11) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `xp_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table language_learning_app.xp_history: ~0 rows (approximately)
DELETE FROM `xp_history`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
