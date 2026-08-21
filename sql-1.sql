CREATE DATABASE IF NOT EXISTS learner_portal;
USE learner_portal;

ALTER DATABASE learner_portal 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

CREATE TABLE registrations (
    register_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    id_number VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,  -- Added this
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_at DATETIME,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE email_verifications (
    verify_id INT PRIMARY KEY AUTO_INCREMENT,
    register_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME NULL,
    
    FOREIGN KEY (register_id) REFERENCES registrations(register_id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_register_id (register_id)
);
SHOW TABLES;
Select *from registrations;
Select *from email_verifications;

ALTER TABLE registrations ADD COLUMN gender ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT 'prefer_not_to_say' AFTER id_number;

SELECT * FROM email_verifications WHERE token = '1b10de65e30749e7b78bf047ce3cf29fdb1e7d729041c5904fea73ba26459731';
DELETE FROM registrations WHERE email = 'mthobisintshangase129@gmail.com';

-- Add is_verified column if missing
ALTER TABLE registrations 
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER password_hash;

-- Also check if other columns exist
ALTER TABLE registrations 
ADD COLUMN gender ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT 'prefer_not_to_say' AFTER id_number;
-- First add is_verified
ALTER TABLE registrations 
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE registrations 
ADD COLUMN terms_accepted_at DATETIME;

-- Add last_login
ALTER TABLE registrations 
ADD COLUMN last_login DATETIME;



-- Connect to your database
USE learner_portal;

-- Create password_resets table
CREATE TABLE IF NOT EXISTS password_resets (
    reset_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME NULL,
    
    FOREIGN KEY (user_id) REFERENCES registrations(register_id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

select*from password_resets;

USE learner_portal;

INSERT INTO registrations
(full_name, email, phone, id_number, gender, password_hash, is_verified, terms_accepted, terms_accepted_at)
VALUES
('John Smith', 'john.smith@test.com', '0712345678', '9001015009087', 'male', 'test_password_hash_123', TRUE, TRUE, NOW()),
('Sarah Mthembu', 'sarah.mthembu@test.com', '0723456789', '9502025009088', 'female', 'test_password_hash_456', TRUE, TRUE, NOW()),
('Thabo Dlamini', 'thabo.dlamini@test.com', '0734567890', '9803035009089', 'male', 'test_password_hash_789', FALSE, TRUE, NOW());

SELECT * FROM registrations;
