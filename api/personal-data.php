<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure'   => false,
    'cookie_samesite' => 'Lax'
]);

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Only POST allowed']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'unauthorized']);
    exit;
}

include '../config/config.php';

$response  = ['success' => false, 'message' => 'Unknown error'];
$input     = json_decode(file_get_contents("php://input"), true) ?? [];
$action    = $input['action'] ?? '';
$user_id   = $_SESSION['user_id'];
$user_role = $_SESSION['role'] ?? 'employee';

try {
    switch ($action) {
        case 'get':
            $stmt = $mysqli->prepare("
                SELECT id, name AS full_name, email, phone, department, position,
                       address, city, state, country, postal_code, avatar, role
                FROM users WHERE id=? LIMIT 1
            ");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result && $result->num_rows === 1) {
                $response = ['success' => true, 'data' => $result->fetch_assoc()];
            } else {
                $response['message'] = 'User not found';
            }
            break;

        case 'update':
            if (!in_array($user_role, ['employee','manager','hr','admin'])) {
                throw new Exception('You cannot update personal info');
            }

            $full_name   = trim($input['full_name'] ?? '');
            $email       = trim($input['email'] ?? '');
            if (!$full_name || !$email) throw new Exception('Full name and email cannot be empty');
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new Exception('Invalid email');

            $phone       = trim($input['phone'] ?? '');
            $address     = trim($input['address'] ?? '');
            $city        = trim($input['city'] ?? '');
            $state       = trim($input['state'] ?? '');
            $country     = trim($input['country'] ?? '');
            $postal_code = trim($input['postal_code'] ?? '');
            $department  = trim($input['department'] ?? '');
            $position    = trim($input['position'] ?? '');
            $avatarPath = null;

            if (!empty($input['avatar']) && str_starts_with($input['avatar'], 'data:image/')) {
                $avatarData = explode(',', $input['avatar'])[1] ?? '';
                $decoded = base64_decode($avatarData);
                if (!$decoded) throw new Exception('Failed to decode avatar');
                if (strpos($input['avatar'], 'image/jpeg') !== false) $ext = 'jpg';
                elseif (strpos($input['avatar'], 'image/png') !== false) $ext = 'png';
                elseif (strpos($input['avatar'], 'image/gif') !== false) $ext = 'gif';
                else throw new Exception('Invalid image format');
                $uploadDir = __DIR__ . '/../uploads/avatars/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                $newFileName = $user_id . '_' . time() . '.' . $ext;
                $fullPath = $uploadDir . $newFileName;
                if (!file_put_contents($fullPath, $decoded)) {
                    throw new Exception('Failed to save avatar');
                }
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

            if (in_array($user_role, ['hr','manager'])) {
                $sql .= ", department=?, position=?";
                $params[] = $department;
                $params[] = $position;
                $types .= "ss";
            }

            $sql .= " WHERE id=?";
            $params[] = $user_id;
            $types .= "i";

            $stmt = $mysqli->prepare($sql);
            $stmt->bind_param($types, ...$params);

            if ($stmt->execute()) {
                $stmt2 = $mysqli->prepare("
                    SELECT id, name AS full_name, email, phone, department, position,
                           address, city, state, country, postal_code, avatar
                    FROM users WHERE id=? LIMIT 1
                ");
                $stmt2->bind_param("i", $user_id);
                $stmt2->execute();
                $data = $stmt2->get_result()->fetch_assoc();
                $response = ['success' => true, 'message' => 'Personal info updated successfully', 'data' => $data];
            } else {
                $response['message'] = 'Failed to update personal info';
            }
            break;

        default:
            $response['message'] = 'Invalid action';
            break;
    }
} catch (Exception $e) {
    $response = ['success' => false, 'message' => $e->getMessage()];
}

echo json_encode($response);
exit;
