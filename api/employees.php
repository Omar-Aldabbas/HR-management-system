<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => false,
    'cookie_samesite' => 'Strict'
]);

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

include '../config/config.php';

$response = ['success' => false, 'message' => 'Invalid request'];

$input  = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$user_id   = (int) $_SESSION['user_id'];
$user_role = $_SESSION['role'] ?? 'employee';

if ($action === 'fetch') {
    if (!in_array($user_role, ['admin','manager','hr'])) {
        $response['message'] = 'Permission denied';
    } else {
        $result = $mysqli->query("SELECT id, name, email, role, position, department, created_at FROM users WHERE role='employee'");
        $employees = $result->fetch_all(MYSQLI_ASSOC);
        $response  = ['success' => true, 'employees' => $employees];
    }
}

elseif ($action === 'add') {
    if (!in_array($user_role, ['admin','hr'])) {
        $response['message'] = 'Permission denied';
    } else {
        $name       = trim($input['name'] ?? '');
        $email      = trim($input['email'] ?? '');
        $position   = trim($input['position'] ?? '');
        $department = trim($input['department'] ?? '');
        $password   = trim($input['password'] ?? '');

        if (!$name || !$email || !$password) {
            $response['message'] = 'Name, email, and password are required';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $response['message'] = 'Invalid email address';
        } else {
            $hashed = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $mysqli->prepare("INSERT INTO users (name, email, role, position, department, password) VALUES (?, ?, 'employee', ?, ?, ?)");
            $stmt->bind_param("sssss", $name, $email, $position, $department, $hashed);

            if ($stmt->execute()) {
                $response = ['success' => true, 'message' => 'Employee added'];
            } else {
                $response['message'] = 'Failed to add employee';
            }
        }
    }
}


elseif ($action === 'update') {
    if (!in_array($user_role, ['admin','hr'])) {
        $response['message'] = 'Permission denied';
    } else {
        $emp_id     = (int) ($input['id'] ?? 0);
        $name       = trim($input['name'] ?? '');
        $email      = trim($input['email'] ?? '');
        $position   = trim($input['position'] ?? '');
        $department = trim($input['department'] ?? '');

        if (!$emp_id || !$name || !$email) {
            $response['message'] = 'ID, name, and email required';
        } else {
            $stmt = $mysqli->prepare("UPDATE users SET name=?, email=?, position=?, department=? WHERE id=? AND role='employee'");
            $stmt->bind_param("ssssi", $name, $email, $position, $department, $emp_id);

            if ($stmt->execute()) {
                $response = ['success' => true, 'message' => 'Employee updated'];
            } else {
                $response['message'] = 'Failed to update employee';
            }
        }
    }
}


elseif ($action === 'delete') {
    if ($user_role !== 'admin') {
        $response['message'] = 'Permission denied';
    } else {
        $emp_id = (int) ($input['id'] ?? 0);
        if ($emp_id) {
            $stmt = $mysqli->prepare("DELETE FROM users WHERE id=? AND role='employee'");
            $stmt->bind_param("i", $emp_id);
            if ($stmt->execute()) {
                $response = ['success' => true, 'message' => 'Employee deleted'];
            } else {
                $response['message'] = 'Failed to delete employee';
            }
        } else {
            $response['message'] = 'Employee ID required';
        }
    }
}


elseif ($action === 'notify') {
    if (!in_array($user_role, ['admin','manager','hr'])) {
        $response['message'] = 'Permission denied';
    } else {
        $title      = trim($input['title'] ?? '');
        $message    = trim($input['message'] ?? '');
        $recipients = $input['recipients'] ?? [];

        if (!$title || !$message) {
            $response['message'] = 'Title and message required';
        } elseif (empty($recipients)) {
            $response['message'] = 'At least one recipient required';
        } else {
            $stmt = $mysqli->prepare("INSERT INTO notifications (sender_id, recipient_id, title, message) VALUES (?, ?, ?, ?)");
            foreach ($recipients as $recip_id) {
                $recip_id = (int) $recip_id;
                $stmt->bind_param("iiss", $user_id, $recip_id, $title, $message);
                $stmt->execute();
            }
            $response = ['success' => true, 'message' => 'Notification sent to employees'];
        }
    }
}

echo json_encode($response);
