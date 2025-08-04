-- SQL script to create reviews table for user reviews with images

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(100) NOT NULL COMMENT 'Name of the reviewer',
  `email` varchar(150) NOT NULL COMMENT 'Email of the reviewer',
  `rating` tinyint(1) NOT NULL COMMENT 'Rating from 1 to 5',
  `review_text` text NOT NULL COMMENT 'Review content/description',
  `entity_type` varchar(50) NOT NULL COMMENT 'Type of entity being reviewed (activity, package, destination, etc.)',
  `entity_id` int(11) NOT NULL COMMENT 'ID of the entity being reviewed',
  `images` json DEFAULT NULL COMMENT 'JSON array of uploaded image URLs',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT 'Review moderation status',
  `helpful_count` int(11) DEFAULT 0 COMMENT 'Number of users who found this review helpful',
  `reply` text DEFAULT NULL COMMENT 'Admin/business reply to the review',
  `reply_date` datetime DEFAULT NULL COMMENT 'Date when reply was added',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP address of reviewer',
  `user_agent` text DEFAULT NULL COMMENT 'Browser/device information',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_status` (`status`),
  KEY `idx_rating` (`rating`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_email` (`email`),
  CONSTRAINT `chk_rating` CHECK (`rating` >= 1 AND `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table to store user reviews with multiple images';

-- Create indexes for better performance
CREATE INDEX `idx_entity_status_rating` ON `reviews`(`entity_type`, `entity_id`, `status`, `rating`);
CREATE INDEX `idx_status_created` ON `reviews`(`status`, `created_at`);

-- Sample data for testing (optional)
-- INSERT INTO `reviews` (`user_name`, `email`, `rating`, `review_text`, `entity_type`, `entity_id`, `status`) 
-- VALUES 
-- ('John Doe', 'john@example.com', 5, 'Amazing experience! Highly recommended.', 'activity', 1, 'approved'),
-- ('Jane Smith', 'jane@example.com', 4, 'Great service and beautiful location.', 'package', 2, 'approved');
