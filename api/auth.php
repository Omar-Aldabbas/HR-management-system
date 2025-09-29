<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure'   => false,
    'cookie_samesite' => 'Strict'
]);

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include '../config/config.php';

$response = ['success' => false, 'message' => 'Invalid request'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? '';

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function getCurrentUser($mysqli) {
    if (!isLoggedIn()) return null;
    $stmt = $mysqli->prepare("SELECT id, name, role, position, email FROM users WHERE id=? LIMIT 1");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

function assignSession($user) {
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['name'] = $user['name'];
    $_SESSION['position'] = $user['position'];
}

switch ($action) {

    case 'check-session':
        if (isLoggedIn()) {
            $user = getCurrentUser($mysqli);
            $response = ['success' => true, 'loggedIn' => true, 'user' => $user];
        } else {
            $response = ['success' => true, 'loggedIn' => false];
        }
        break;

    case 'login':
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        if ($email && $password) {
            $stmt = $mysqli->prepare("SELECT id, name, password, role, position FROM users WHERE email=? LIMIT 1");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $user = $stmt->get_result()->fetch_assoc();
            if ($user && password_verify($password, $user['password'])) {
                assignSession($user);
                $stmt2 = $mysqli->prepare("REPLACE INTO sessions (session_id, user_id, ip_address, user_agent, last_activity) VALUES (?, ?, ?, ?, NOW())");
                $session_id = session_id();
                $ip = $_SERVER['REMOTE_ADDR'] ?? '';
                $agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
                $stmt2->bind_param("siss", $session_id, $user['id'], $ip, $agent);
                $stmt2->execute();
                $response = ['success' => true, 'message' => 'Login successful', 'user' => $user];
            } else {
                $response['message'] = 'Invalid email or password';
            }
        } else {
            $response['message'] = 'Email and password are required';
        }
        break;

    case 'logout':
        if (isLoggedIn()) {
            setcookie(session_name(), '', time() - 3600, '/');
            session_destroy();
        }
        $response = ['success' => true, 'message' => 'Logged out'];
        break;

    case 'signup':
        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $confirm_password = $input['confirm_password'] ?? '';
        if (!$name || !$email || !$password || !$confirm_password) { $response['message'] = 'All fields are required'; break; }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $response['message'] = 'Invalid email'; break; }
        if ($password !== $confirm_password) { $response['message'] = 'Passwords do not match'; break; }
        $stmt = $mysqli->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) { $response['message'] = 'Email already registered'; break; }
        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $role = 'employee';
        do {
            $employee_id = 'EMP' . rand(1000, 9999);
            $stmt_check = $mysqli->prepare("SELECT id FROM users WHERE employee_id=? LIMIT 1");
            $stmt_check->bind_param("s", $employee_id);
            $stmt_check->execute();
            $exists = $stmt_check->get_result()->num_rows > 0;
        } while ($exists);
        $stmt2 = $mysqli->prepare("INSERT INTO users (employee_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)");
        $stmt2->bind_param("sssss", $employee_id, $name, $email, $hashed, $role);
        if ($stmt2->execute()) {
            $response = ['success' => true, 'message' => 'Account created. Please log in', 'user' => ['employee_id'=>$employee_id,'name'=>$name,'email'=>$email,'role'=>$role]];
        } else { $response['message'] = 'Error creating account'; }
        break;

    case 'forgot':
        $email = trim($input['email'] ?? '');
        if ($email) {
            $stmt = $mysqli->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            if ($stmt->get_result()->num_rows === 1) {
                $response = ['success'=>true,'message'=>'Password reset link sent (mock)'];
            } else { $response['message'] = 'Email not found'; }
        } else { $response['message'] = 'Email is required'; }
        break;

    case 'change-password':
        if (!isLoggedIn()) { $response=['success'=>false,'message'=>'Not authenticated']; break; }
        $currentPassword = $input['current_password'] ?? '';
        $newPassword = $input['new_password'] ?? '';
        $confirmPassword = $input['confirm_password'] ?? '';
        if (!$currentPassword || !$newPassword || !$confirmPassword) { $response['message']='All password fields are required'; break; }
        if ($newPassword !== $confirmPassword) { $response['message']='New passwords do not match'; break; }
        $stmt = $mysqli->prepare("SELECT password FROM users WHERE id=? LIMIT 1");
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        if (!$user || !password_verify($currentPassword, $user['password'])) { $response['message']='Current password is incorrect'; break; }
        $hashed = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt2 = $mysqli->prepare("UPDATE users SET password=? WHERE id=?");
        $stmt2->bind_param("si",$hashed,$_SESSION['user_id']);
        if ($stmt2->execute()) { $response=['success'=>true,'message'=>'Password changed successfully']; }
        else { $response['message']='Failed to update password'; }
        break;

    default:
        $response['message'] = 'Invalid action';
        break;
}

echo json_encode($response);
