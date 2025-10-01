<?php

session_set_cookie_params([
    'httponly' => true,
    'secure' => false, // true only if HTTPS
    'samesite' => 'None'
]);

session_start();

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

$response = ['success' => false, 'message' => 'Invalid request'];

switch ($action) {
    case 'check-session':
        if (isLoggedIn()) {
            $user = getCurrentUser($mysqli);
            $response = [
                'success' => true,
                'loggedIn' => true,
                'user' => $user,
                'redirect' => 'home.html'
            ];
        } else {
            $response = [
                'success' => false,
                'error' => 'unauthorized',
                'message' => 'Not logged in'
            ];
        }
        http_response_code(200);
        break;

    case 'login':
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (!$email || !$password) {
            $response = ['success' => false, 'message' => 'Email and password are required'];
            http_response_code(400);
            break;
        }

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

            $response = [
                'success' => true,
                'message' => 'Login successful',
                'user' => $user,
                'redirect' => 'home.html'
            ];
            http_response_code(200);
        } else {
            $response = ['success' => false, 'error' => 'unauthorized', 'message' => 'Invalid email or password'];
            http_response_code(401);
        }
        break;

    case 'logout':
        if (isLoggedIn()) {
            setcookie(session_name(), '', time() - 3600, '/');
            session_destroy();
        }
        $response = ['success' => true, 'message' => 'Logged out'];
        http_response_code(200);
        break;

    case 'signup':
        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $confirm = $input['confirm_password'] ?? '';

        if (!$name || !$email || !$password || !$confirm) {
            $response = ['success' => false, 'message' => 'All fields are required'];
            http_response_code(400);
            break;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $response = ['success' => false, 'message' => 'Invalid email'];
            http_response_code(400);
            break;
        }
        if ($password !== $confirm) {
            $response = ['success' => false, 'message' => 'Passwords do not match'];
            http_response_code(400);
            break;
        }

        $stmt = $mysqli->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            $response = ['success' => false, 'message' => 'Email already registered'];
            http_response_code(409);
            break;
        }

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
            $response = [
                'success' => true,
                'message' => 'Account created. Please log in',
                'user' => ['employee_id' => $employee_id, 'name' => $name, 'email' => $email, 'role' => $role]
            ];
            http_response_code(201);
        } else {
            $response = ['success' => false, 'message' => 'Error creating account'];
            http_response_code(500);
        }
        break;

    case 'forgot':
        $email = trim($input['email'] ?? '');
        if (!$email) {
            $response = ['success' => false, 'message' => 'Email is required'];
            http_response_code(400);
            break;
        }
        $stmt = $mysqli->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $exists = $stmt->get_result()->num_rows === 1;
        $response = $exists
            ? ['success' => true, 'message' => 'Password reset link sent (mock)']
            : ['success' => false, 'message' => 'Email not found'];
        http_response_code(200);
        break;

    case 'change-password':
        if (!isLoggedIn()) {
            $response = ['success' => false, 'error' => 'unauthorized', 'message' => 'Not authenticated'];
            http_response_code(401);
            break;
        }

        $current = $input['current_password'] ?? '';
        $new = $input['new_password'] ?? '';
        $confirm = $input['confirm_password'] ?? '';
        if (!$current || !$new || !$confirm) {
            $response = ['success' => false, 'message' => 'All password fields are required'];
            http_response_code(400);
            break;
        }
        if ($new !== $confirm) {
            $response = ['success' => false, 'message' => 'New passwords do not match'];
            http_response_code(400);
            break;
        }

        $stmt = $mysqli->prepare("SELECT password FROM users WHERE id=? LIMIT 1");
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        if (!$user || !password_verify($current, $user['password'])) {
            $response = ['success' => false, 'message' => 'Current password is incorrect'];
            http_response_code(401);
            break;
        }

        $stmt2 = $mysqli->prepare("UPDATE users SET password=? WHERE id=?");
        $hashed = password_hash($new, PASSWORD_BCRYPT);
        $stmt2->bind_param("si", $hashed, $_SESSION['user_id']);
        $response = $stmt2->execute()
            ? ['success' => true, 'message' => 'Password changed successfully']
            : ['success' => false, 'message' => 'Failed to update password'];
        http_response_code(200);
        break;

    default:
        $response = ['success' => false, 'message' => 'Invalid action'];
        http_response_code(400);
        break;
}

echo json_encode($response);
