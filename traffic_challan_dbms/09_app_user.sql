-- ========================================================
-- Traffic Violation & Smart Challan Management System
-- Script: 09_app_user.sql
-- Description: App Users & Role-Based Access Control (RBAC)
-- ========================================================

USE traffic_challan;

CREATE TABLE IF NOT EXISTS app_user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('OFFICER', 'PAYMENT_ADMIN', 'APPEAL_OFFICER', 'TRAFFIC_ADMIN', 'MANAGEMENT', 'OWNER') NOT NULL,
    officer_id INT NULL,
    owner_id INT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_user_officer FOREIGN KEY (officer_id) REFERENCES officer(officer_id) ON DELETE SET NULL,
    CONSTRAINT fk_app_user_owner FOREIGN KEY (owner_id) REFERENCES owner(owner_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Demo Users (passwords hashed with bcrypt; default password for all demo accounts: 'password123' or 'admin123')
-- Bcrypt hash for 'password123': $2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7rq8WvRupvm
-- Bcrypt hash for 'admin123': $2b$10$5vGZtZJvMvhY6oQz5lB3ceC2Ua4L8zK3N6h4O1P9.m0t7V5r3B1We

INSERT INTO app_user (user_id, username, password_hash, role, officer_id, owner_id, active) VALUES
(1, 'officer_vikram', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7rq8WvRupvm', 'OFFICER', 1, NULL, TRUE),
(2, 'payment_admin', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7rq8WvRupvm', 'PAYMENT_ADMIN', NULL, NULL, TRUE),
(3, 'appeal_kavita', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7rq8WvRupvm', 'APPEAL_OFFICER', 2, NULL, TRUE),
(4, 'traffic_admin', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7rq8WvRupvm', 'TRAFFIC_ADMIN', NULL, NULL, TRUE),
(5, 'management_lead', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7rq8WvRupvm', 'MANAGEMENT', NULL, NULL, TRUE),
(6, 'citizen_aarav', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7rq8WvRupvm', 'OWNER', NULL, 1, TRUE)
ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    role = VALUES(role),
    officer_id = VALUES(officer_id),
    owner_id = VALUES(owner_id),
    active = VALUES(active);
