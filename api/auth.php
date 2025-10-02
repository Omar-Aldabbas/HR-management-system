<?php
session_set_cookie_params([
    'httponly' => true,
    'secure' => false,
    'samesite' => 'Lax'
]);
session_start();

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include '../config/config.php';

$input = json_decode(file_get_contents("php://input"), true) ?? [];
$action = $input['action'] ?? '';

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function getCurrentUser($mysqli) {
    if (!isLoggedIn()) return null;
    $stmt = $mysqli->prepare("SELECT id, employee_id, name, role, position, email FROM users WHERE id=? LIMIT 1");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

$response = ["success" => false, "message" => "Invalid request"];

switch ($action) {

    case "check-session":
        if (isLoggedIn()) {
            $user = getCurrentUser($mysqli);
            $response = ["success" => true, "loggedIn" => true, "user" => $user, "redirect" => "home.html"];
        } else {
            $response = ["success" => false, "error" => "unauthorized", "message" => "Not logged in"];
        }
        break;

    case "login":
        $email = trim($input["email"] ?? "");
        $password = $input["password"] ?? "";

        if (!$email || !$password) {
            $response = ["success" => false, "message" => "Email and password required"];
            break;
        }

        $stmt = $mysqli->prepare("SELECT id, name, password, role, position, employee_id, email FROM users WHERE email=? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        if ($user && password_verify($password, $user["password"])) {
            session_regenerate_id(true);
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['name'] = $user['name'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['position'] = $user['position'] ?? '';

            $response = ["success" => true, "message" => "Login successful", "user" => $user, "redirect" => "home.html"];
        } else {
            $response = ["success" => false, "error" => "unauthorized", "message" => "Invalid email or password"];
        }
        break;

    case "logout":
        if (isLoggedIn()) {
            setcookie(session_name(), '', time() - 3600, '/');
            session_destroy();
        }
        $response = ["success" => true, "message" => "Logged out"];
        break;

    case "signup":
        $name = trim($input["name"] ?? "");
        $email = trim($input["email"] ?? "");
        $password = $input["password"] ?? "";
        $confirm = $input["confirm_password"] ?? "";

        if (!$name || !$email || !$password || !$confirm) {
            $response = ["success" => false, "message" => "All fields required"];
            break;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $response = ["success" => false, "message" => "Invalid email"];
            break;
        }

        if ($password !== $confirm) {
            $response = ["success" => false, "message" => "Passwords do not match"];
            break;
        }

        $stmt = $mysqli->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            $response = ["success" => false, "message" => "Email already registered"];
            break;
        }

        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $role = "employee";

        do {
            $employee_id = "EMP" . rand(1000, 9999);
            $stmt_check = $mysqli->prepare("SELECT id FROM users WHERE employee_id=? LIMIT 1");
            $stmt_check->bind_param("s", $employee_id);
            $stmt_check->execute();
        } while ($stmt_check->get_result()->num_rows > 0);

        $stmt2 = $mysqli->prepare("INSERT INTO users (employee_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)");
        $stmt2->bind_param("sssss", $employee_id, $name, $email, $hashed, $role);

        if ($stmt2->execute()) {
            $uid = $stmt2->insert_id;
            $response = ["success" => true, "message" => "Account created. Please log in", "user" => ["employee_id" => $employee_id, "name" => $name, "email" => $email, "role" => $role]]; 
        } else {
            $response = ["success" => false, "message" => "Error creating account"];
        }
        break;

    default:
        $response = ["success" => false, "message" => "Invalid action"];
        break;
}

echo json_encode($response);
exit;
