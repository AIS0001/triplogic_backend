-- SQL script to create user_activities table for analytics

CREATE TABLE IF NOT EXISTS `user_activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `activity_type` varchar(100) NOT NULL COMMENT 'page_view, click, search, filter, form_submit, etc.',
  `page_url` varchar(500) DEFAULT NULL COMMENT 'URL of the page where activity occurred',
  `action_performed` varchar(200) DEFAULT NULL COMMENT 'Specific action like button_click, link_click, form_submit',
  `element_clicked` varchar(200) DEFAULT NULL COMMENT 'ID or class of clicked element',
  `time_spent` int(11) DEFAULT NULL COMMENT 'Time spent on page in seconds',
  `device_info` text DEFAULT NULL COMMENT 'User agent or device information',
  `browser_info` varchar(200) DEFAULT NULL COMMENT 'Browser name and version',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'User IP address',
  `session_id` varchar(100) DEFAULT NULL COMMENT 'User session identifier',
  `referrer` varchar(500) DEFAULT NULL COMMENT 'Referring page URL',
  `search_query` varchar(300) DEFAULT NULL COMMENT 'Search term if applicable',
  `filters_applied` text DEFAULT NULL COMMENT 'JSON string of applied filters',
  `additional_data` text DEFAULT NULL COMMENT 'JSON string for any additional data',
  `timestamp` datetime NOT NULL COMMENT 'When the activity occurred',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_page_url` (`page_url`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table to store user activities for analytics';

-- Create indexes for better performance
CREATE INDEX `idx_user_activity_date` ON `user_activities`(`user_id`, `created_at`);
CREATE INDEX `idx_activity_type_date` ON `user_activities`(`activity_type`, `created_at`);
CREATE INDEX `idx_session_activities` ON `user_activities`(`session_id`, `timestamp`);
