<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure'   => false,
    'cookie_samesite' => 'Strict'
]);

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

include '../config/config.php';

$user_id   = $_SESSION['user_id'];
$user_role = $_SESSION['role'] ?? 'employee';
$response  = ['success' => false, 'message' => 'Unknown error'];
$method    = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $stmt = $mysqli->prepare("
            SELECT id, name AS full_name, email, phone, department, position,
                   address, city, state, country, postal_code, avatar, role
            FROM users WHERE id=? LIMIT 1
        ");
        if (!$stmt) throw new Exception($mysqli->error);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result && $result->num_rows === 1) {
            $response = ['success' => true, 'data' => $result->fetch_assoc()];
        } else {
            $response['message'] = 'User not found';
        }
    } elseif ($method === 'POST') {
        if ($user_role !== 'employee') throw new Exception('You cannot update personal info');

        $full_name   = trim($_POST['full_name'] ?? '');
        $email       = trim($_POST['email'] ?? '');
        $phone       = trim($_POST['phone'] ?? '');
        $address     = trim($_POST['address'] ?? '');
        $city        = trim($_POST['city'] ?? '');
        $state       = trim($_POST['state'] ?? '');
        $country     = trim($_POST['country'] ?? '');
        $postal_code = trim($_POST['postal_code'] ?? '');
        $avatarPath  = null;

        if (!$full_name || !$email) throw new Exception('Full name and email are required');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new Exception('Invalid email');

        if (!empty($_FILES['avatar']['name'])) {
            $ext = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg','jpeg','png','gif'];
            if (!in_array($ext, $allowed)) throw new Exception('Invalid image format');

            $uploadDir = __DIR__ . '/../uploads/avatars/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

            $newFileName = $user_id . '_' . time() . '.' . $ext;
            $fullPath = $uploadDir . $newFileName;

            if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $fullPath)) throw new Exception('Failed to upload avatar');

            $avatarPath = 'uploads/avatars/' . $newFileName;
        }

        $sql = "UPDATE users SET name=?, email=?, phone=?, address=?, city=?, state=?, country=?, postal_code=?";
        $params = [$full_name, $email, $phone, $address, $city, $state, $country, $postal_code];
        $types = "ssssssss";

        if ($avatarPath) {
            $sql .= ", avatar=?";
            $params[] = $avatarPath;
            $types .= "s";
        }

        $sql .= " WHERE id=?";
        $params[] = $user_id;
        $types .= "i";

        $stmt = $mysqli->prepare($sql);
        if (!$stmt) throw new Exception($mysqli->error);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            $_SESSION['name']  = $full_name;
            $_SESSION['email'] = $email;
            $_SESSION['phone'] = $phone;
            if ($avatarPath) $_SESSION['avatar'] = $avatarPath;

            $stmt2 = $mysqli->prepare("
                SELECT id, name AS full_name, email, phone, department, position,
                       address, city, state, country, postal_code, avatar
                FROM users WHERE id=? LIMIT 1
            ");
            $stmt2->bind_param("i", $user_id);
            $stmt2->execute();
            $result2 = $stmt2->get_result();
            $data = $result2->fetch_assoc();

            $response = ['success' => true, 'message' => 'Personal info updated successfully', 'data' => $data];
        } else {
            $response['message'] = 'Failed to update personal info';
        }
    } else {
        $response['message'] = 'Invalid request method';
    }
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
exit;
