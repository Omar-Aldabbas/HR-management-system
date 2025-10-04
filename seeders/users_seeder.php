<?php
require_once __DIR__ . '/../config/config.php';

$users = [
    ['EMP001', 'Ahmed Ali', 'ahmed@company.com', 'password123', 'admin', 'System Administrator', 'Male', 'IT'],
    ['EMP002', 'Sara Mohamed', 'sara@company.com', 'password123', 'hr_manager', 'HR Manager', 'Female', 'HR'],
    ['EMP003', 'Khaled Youssef', 'khaled@company.com', 'password123', 'manager', 'Sales Manager', 'Male', 'Sales'],
    ['EMP004', 'Layla Hassan', 'layla@company.com', 'password123', 'employee', 'Software Developer', 'Female', 'IT'],
];

$stmt = $mysqli->prepare("
    INSERT INTO users (employee_id, name, email, password, role, position, gender, department, date_joined)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
");

foreach ($users as $u) {
    [$employee_id, $name, $email, $password, $role, $position, $gender, $department] = $u;
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt->bind_param("ssssssss", $employee_id, $name, $email, $hashed, $role, $position, $gender, $department);
    $stmt->execute();
}

$stmt->close();
$mysqli->close();

echo "Users table seeded successfully.";
