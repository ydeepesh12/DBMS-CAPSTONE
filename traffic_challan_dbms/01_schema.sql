-- ========================================================
-- Traffic Violation & Smart Challan Management System
-- Script: 01_schema.sql
-- Description: Core relational schema
-- ========================================================

CREATE DATABASE IF NOT EXISTS traffic_challan;
USE traffic_challan;

-- 1. Owner Table
CREATE TABLE IF NOT EXISTS owner (
    owner_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    national_id VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Vehicle Table
CREATE TABLE IF NOT EXISTS vehicle (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_no VARCHAR(20) UNIQUE NOT NULL,
    chassis_no VARCHAR(50) UNIQUE NOT NULL,
    engine_no VARCHAR(50) UNIQUE NOT NULL,
    make_model VARCHAR(100) NOT NULL,
    vehicle_type ENUM('CAR', 'MOTORCYCLE', 'TRUCK', 'BUS', 'OTHER') NOT NULL,
    color VARCHAR(30),
    owner_id INT NOT NULL,
    rc_status ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED', 'BLACKLISTED') DEFAULT 'ACTIVE',
    registration_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_owner FOREIGN KEY (owner_id) REFERENCES owner(owner_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. License Table
CREATE TABLE IF NOT EXISTS license (
    license_id INT AUTO_INCREMENT PRIMARY KEY,
    license_number VARCHAR(30) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    license_class ENUM('MCWG', 'LMV', 'HMV', 'TRANS') NOT NULL,
    status ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED') DEFAULT 'ACTIVE',
    points_demerit INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Driver Table
CREATE TABLE IF NOT EXISTS driver (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_id INT UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_driver_license FOREIGN KEY (license_id) REFERENCES license(license_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 5. Officer Table
CREATE TABLE IF NOT EXISTS officer (
    officer_id INT AUTO_INCREMENT PRIMARY KEY,
    badge_number VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    police_station VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TRANSFERRED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. Violation Type Table
CREATE TABLE IF NOT EXISTS violation_type (
    violation_type_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    section_act VARCHAR(100) NOT NULL,
    base_fine DECIMAL(10, 2) NOT NULL,
    late_fee_rate DECIMAL(5, 2) DEFAULT 0.05,
    demerit_points INT DEFAULT 0,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM'
) ENGINE=InnoDB;

-- 7. Location Table
CREATE TABLE IF NOT EXISTS location (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL,
    junction_name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    speed_limit INT DEFAULT 50,
    camera_id VARCHAR(50),
    zone_type ENUM('HIGHWAY', 'COMMERCIAL', 'RESIDENTIAL', 'SCHOOL_ZONE') DEFAULT 'COMMERCIAL'
) ENGINE=InnoDB;

-- 8. Violation Table
CREATE TABLE IF NOT EXISTS violation (
    violation_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    driver_id INT NULL,
    violation_type_id INT NOT NULL,
    location_id INT NOT NULL,
    officer_id INT NOT NULL,
    violation_timestamp DATETIME NOT NULL,
    speed_recorded INT NULL,
    remarks TEXT,
    status ENUM('LOGGED', 'CHALLAN_GENERATED', 'CANCELLED') DEFAULT 'LOGGED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_violation_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id),
    CONSTRAINT fk_violation_driver FOREIGN KEY (driver_id) REFERENCES driver(driver_id),
    CONSTRAINT fk_violation_type FOREIGN KEY (violation_type_id) REFERENCES violation_type(violation_type_id),
    CONSTRAINT fk_violation_location FOREIGN KEY (location_id) REFERENCES location(location_id),
    CONSTRAINT fk_violation_officer FOREIGN KEY (officer_id) REFERENCES officer(officer_id)
) ENGINE=InnoDB;

-- 9. Evidence Table (Relational reference to files/MongoDB)
CREATE TABLE IF NOT EXISTS evidence (
    evidence_id INT AUTO_INCREMENT PRIMARY KEY,
    violation_id INT NOT NULL,
    media_type ENUM('IMAGE', 'VIDEO', 'RADAR_LOG', 'ANPR_SCAN') NOT NULL,
    storage_path VARCHAR(255) NOT NULL,
    mongo_evidence_id VARCHAR(50) NULL,
    captured_at DATETIME NOT NULL,
    file_size_kb INT DEFAULT 0,
    md5_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidence_violation FOREIGN KEY (violation_id) REFERENCES violation(violation_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Challan Table
CREATE TABLE IF NOT EXISTS challan (
    challan_id INT AUTO_INCREMENT PRIMARY KEY,
    challan_number VARCHAR(30) UNIQUE NOT NULL,
    violation_id INT UNIQUE NOT NULL,
    fine_amount DECIMAL(10, 2) NOT NULL,
    late_fee DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('UNPAID', 'PAID', 'APPEALED', 'CANCELLED', 'OVERDUE') DEFAULT 'UNPAID',
    appeal_window_end DATE NOT NULL,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_challan_violation FOREIGN KEY (violation_id) REFERENCES violation(violation_id)
) ENGINE=InnoDB;

-- 11. Payment Table
CREATE TABLE IF NOT EXISTS payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    challan_id INT NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date DATETIME NOT NULL,
    payment_method ENUM('ONLINE_GATEWAY', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'CASH_COUNTER') NOT NULL,
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    gateway_status ENUM('SUCCESS', 'FAILED', 'PENDING') DEFAULT 'SUCCESS',
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_challan FOREIGN KEY (challan_id) REFERENCES challan(challan_id)
) ENGINE=InnoDB;

-- 12. Appeal Table
CREATE TABLE IF NOT EXISTS appeal (
    appeal_id INT AUTO_INCREMENT PRIMARY KEY,
    challan_id INT NOT NULL,
    reason TEXT NOT NULL,
    appeal_date DATE NOT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED') DEFAULT 'PENDING',
    reviewing_officer_id INT NULL,
    decision_date DATE NULL,
    officer_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appeal_challan FOREIGN KEY (challan_id) REFERENCES challan(challan_id),
    CONSTRAINT fk_appeal_officer FOREIGN KEY (reviewing_officer_id) REFERENCES officer(officer_id)
) ENGINE=InnoDB;

-- 13. Challan Audit Trail Table
CREATE TABLE IF NOT EXISTS challan_audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    challan_id INT NOT NULL,
    old_status ENUM('UNPAID', 'PAID', 'APPEALED', 'CANCELLED', 'OVERDUE') NULL,
    new_status ENUM('UNPAID', 'PAID', 'APPEALED', 'CANCELLED', 'OVERDUE') NOT NULL,
    old_amount DECIMAL(10, 2) NULL,
    new_amount DECIMAL(10, 2) NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(50) DEFAULT 'SYSTEM',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
