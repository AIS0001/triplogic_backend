-- Categories table for activity categorization
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT NULL,
    color VARCHAR(7) DEFAULT '#007bff',
    status ENUM('active', 'inactive') DEFAULT 'active',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order)
);

-- Insert default categories
INSERT INTO categories (name, description, icon, color, sort_order) VALUES
('Sightseeing', 'Tourist attractions and scenic spots', 'fas fa-eye', '#007bff', 1),
('Adventure', 'Thrilling outdoor activities', 'fas fa-mountain', '#28a745', 2),
('Cultural', 'Museums, heritage sites, and cultural experiences', 'fas fa-landmark', '#6f42c1', 3),
('Food & Cuisine', 'Food tours, cooking classes, and culinary experiences', 'fas fa-utensils', '#fd7e14', 4),
('Water Sports', 'Swimming, diving, boating, and water activities', 'fas fa-swimmer', '#17a2b8', 5),
('Trekking', 'Hiking, mountain climbing, and nature walks', 'fas fa-hiking', '#198754', 6),
('Wildlife', 'Safaris, bird watching, and nature reserves', 'fas fa-paw', '#795548', 7),
('Shopping', 'Markets, malls, and shopping districts', 'fas fa-shopping-bag', '#e91e63', 8),
('Entertainment', 'Shows, concerts, and entertainment venues', 'fas fa-music', '#9c27b0', 9),
('Educational', 'Learning experiences and educational tours', 'fas fa-graduation-cap', '#3f51b5', 10),
('Spiritual', 'Temples, churches, and spiritual experiences', 'fas fa-pray', '#ff9800', 11),
('Photography', 'Photography tours and scenic spots', 'fas fa-camera', '#607d8b', 12),
('Leisure', 'Relaxing activities and leisure experiences', 'fas fa-spa', '#4caf50', 13);

-- Activity categories junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS activity_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_activity_category (activity_id, category_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_category_id (category_id)
);
