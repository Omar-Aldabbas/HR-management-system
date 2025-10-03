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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

include '../config/config.php';

$input = json_decode(file_get_contents("php://input"), true) ?? [];
$action = $input['action'] ?? '';

function getCurrentUser($mysqli) {
    if (!isset($_SESSION['user_id'])) return null;
    $stmt = $mysqli->prepare("SELECT id, employee_id, name, role, position, department, email FROM users WHERE id=? LIMIT 1");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

$currentUser = getCurrentUser($mysqli);
if (!$currentUser) {
    echo json_encode(['success'=>false, 'message'=>'User not logged in']);
    exit;
}

switch ($action) {

    case 'get':
        echo json_encode(['success'=>true, 'data'=>$currentUser]);
        exit;

    case 'list':
        $role = strtolower($currentUser['role']);
        $department = $currentUser['department'];

        if ($role === 'manager') {
            $stmt = $mysqli->prepare("SELECT id, employee_id, name, role, position, department, email FROM users WHERE department=? AND role='employee'");
            $stmt->bind_param("s", $department);
        } elseif (in_array($role, ['hr','hr_manager'])) {
            $stmt = $mysqli->prepare("SELECT id, employee_id, name, role, position, department, email FROM users");
        } else {
            $stmt = $mysqli->prepare("SELECT id, employee_id, name, role, position, department, email FROM users WHERE id=?");
            $stmt->bind_param("i", $currentUser['id']);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $users = [];
        while ($row = $result->fetch_assoc()) $users[] = $row;
        $stmt->close();

        echo json_encode(['success'=>true, 'users'=>$users]);
        exit;

    default:
        echo json_encode(['success'=>false, 'message'=>'Invalid action']);
        exit;
}
?>
