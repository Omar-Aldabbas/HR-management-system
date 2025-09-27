<?php
header('Content-Type: application/json');
include'../config/config.php';

$name = 'Test User';
$email = 'test' . rand(1000, 9999) . '@example.com';
$password = 'password123';
$role = 'employee';
$employeeId = 'EMP' . rand(1000, 9999);

$hashed = password_hash($password, PASSWORD_BCRYPT);

$stmt = $mysqli->prepare("INSERT INTO users (employee_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $employeeId, $name, $email, $hashed, $role);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Test user created',
        'user' => [
            'employee_id' => $employeeId,
            'name' => $name,
            'email' => $email,
            'role' => $role
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error creating test user: ' . $stmt->error
    ]);
}
?>
