<?php
$dbhost = "localhost";
$dbuser = "root";
$dbpass = "";

$mysqli = new mysqli($dbhost, $dbuser, $dbpass);
if ($mysqli->connect_errno) die("Database Connection Failed: " . $mysqli->connect_error);

$sql = "CREATE DATABASE IF NOT EXISTS hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
$mysqli->query($sql);
$mysqli->select_db("hr_system");

$tables = [

"CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('employee','manager','hr', 'hr_manager','admin','sales','team_lead','intern') DEFAULT 'employee',
    position VARCHAR(50),
    gender ENUM('Unassigned','Male','Female') DEFAULT 'Unassigned',
    department VARCHAR(100) DEFAULT 'Unassigned',
    phone VARCHAR(20) DEFAULT NULL,
    date_joined DATE DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    city VARCHAR(50) DEFAULT NULL,
    state VARCHAR(50) DEFAULT NULL,
    country VARCHAR(50) DEFAULT NULL,
    postal_code VARCHAR(20) DEFAULT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    password_reset VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS targets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_amount DECIMAL(10,2) NOT NULL,
    achieved_amount DECIMAL(10,2) DEFAULT 0,
    deadline DATE,
    status ENUM('pending','in_progress','achieved') DEFAULT 'pending',
    approved_by INT UNSIGNED DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS attendance (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    clock_in DATETIME,
    clock_out DATETIME,
    total_hours DECIMAL(5,2),
    shift ENUM('morning','afternoon','night') DEFAULT 'morning',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS breaks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT UNSIGNED NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    break_type ENUM('coffee','lunch','other') DEFAULT 'other',
    FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS sales (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    target_id INT UNSIGNED DEFAULT NULL,
    sale_date DATETIME NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    company_name VARCHAR(255) DEFAULT NULL,
    client VARCHAR(255) DEFAULT NULL,
    product_name VARCHAR(255) DEFAULT NULL,
    quantity INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE SET NULL
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS tasks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('pending','in_progress','finished') DEFAULT 'pending',
    priority ENUM('low','medium','high') DEFAULT 'medium',
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS expenses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    approved_by INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS leaves (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    type ENUM('sick','casual','vacation','other') DEFAULT 'other',
    start_date DATE,
    end_date DATE,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INT UNSIGNED DEFAULT NULL,
    action_message TEXT DEFAULT NULL,
    action_date DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS alerts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id INT UNSIGNED NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    department VARCHAR(50) DEFAULT NULL,
    message TEXT NOT NULL,
    alert_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS alert_recipients (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    alert_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    read_status TINYINT(1) DEFAULT 0,
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (alert_id, user_id)
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id INT UNSIGNED NOT NULL,
    recipient_id INT UNSIGNED DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS meetings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    participants TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS user_states (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    is_checked_in TINYINT(1) DEFAULT 0,
    on_break TINYINT(1) DEFAULT 0,
    last_clock_in DATETIME DEFAULT NULL,
    last_clock_out DATETIME DEFAULT NULL,
    last_break_start DATETIME DEFAULT NULL,
    last_break_end DATETIME DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB",

"CREATE TABLE IF NOT EXISTS payrolls (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    department VARCHAR(50) NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    additions DECIMAL(10,2) NOT NULL DEFAULT 0,
    deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
    taxes DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    year INT NOT NULL,
    month INT NOT NULL,
    last_payment_date DATE DEFAULT NULL,
    approved_by INT UNSIGNED DEFAULT NULL,
    approved_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB"

];

foreach ($tables as $sql) {
    if ($mysqli->query($sql) === TRUE) echo " Table created successfully<br>";
    else echo " Error creating table: " . $mysqli->error . "<br>";
}

$mysqli->close();
?>
