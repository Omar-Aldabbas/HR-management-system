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
$currentUser = $input['currentUser'] ?? null;

$response = ['success' => false, 'message' => 'Missing currentUser info', 'debug' => ['raw_input' => json_encode($input)]];

if (!$currentUser || !isset($currentUser['id'])) {
    echo json_encode($response);
    exit;
}

$userId = (int)$currentUser['id'];
$userRole = strtolower($currentUser['role'] ?? 'employee');
$userDept = $currentUser['department'] ?? '';

switch ($action) {

    case 'list':
        if (in_array($userRole, ['hr','manager'])) {
            $stmt = $mysqli->prepare("
                SELECT a.id,a.user_id,a.sender_id,a.sender_role,a.department,a.message,a.alert_date,u.name AS sender_name
                FROM alerts a 
                JOIN users u ON a.sender_id=u.id
                ORDER BY a.alert_date DESC
            ");
        } else {
            $stmt = $mysqli->prepare("
                SELECT a.id,a.user_id,a.sender_id,a.sender_role,a.department,a.message,a.alert_date,u.name AS sender_name
                FROM alerts a 
                JOIN users u ON a.sender_id=u.id
                WHERE a.user_id=? OR a.department=?
                ORDER BY a.alert_date DESC
            ");
            $stmt->bind_param("is", $userId, $userDept);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $alerts = [];
        while ($row = $result->fetch_assoc()) $alerts[] = $row;
        $response = ['success' => true, 'alerts' => $alerts];
        break;

    case 'list_users':
        if ($userRole === 'manager') {
            $stmt = $mysqli->prepare("SELECT id,name,email,department,role FROM users WHERE department=? AND role='employee'");
            $stmt->bind_param("s", $userDept);
        } else {
            $stmt = $mysqli->prepare("SELECT id,name,email,department,role FROM users");
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $users = [];
        while ($row = $result->fetch_assoc()) $users[] = $row;
        $response = ['success' => true, 'users' => $users];
        break;

    case 'send':
        if (!in_array($userRole, ['hr','manager'])) {
            $response = ['success' => false, 'message' => 'You do not have permission to send alerts', 'debug' => ['currentUser'=>$currentUser, 'raw_input'=>json_encode($input)]];
            break;
        }

        $message = trim($input['message'] ?? '');
        $users = $input['users'] ?? [];
        $department = trim($input['department'] ?? '');

        if (!$message) {
            $response = ['success' => false, 'message' => 'Message cannot be empty'];
            break;
        }

        $toUsers = [];

        if ($userRole === 'manager') {
            $stmt = $mysqli->prepare("SELECT id FROM users WHERE department=? AND role='employee'");
            $stmt->bind_param("s", $userDept);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) $toUsers[] = $row['id'];
            $department = $userDept;
        } else {
            if ($department) {
                $stmt = $mysqli->prepare("SELECT id FROM users WHERE department=?");
                $stmt->bind_param("s", $department);
                $stmt->execute();
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) $toUsers[] = $row['id'];
            }
            if ($users) $toUsers = array_merge($toUsers, $users);
        }

        $toUsers = array_unique($toUsers);
        if (!$toUsers) {
            $response = ['success' => false, 'message' => 'No recipients found'];
            break;
        }

        $stmt = $mysqli->prepare("INSERT INTO alerts (user_id, sender_id, sender_role, department, message, alert_date) VALUES (?,?,?,?,?,NOW())");
        foreach ($toUsers as $uid) {
            $stmt->bind_param("iisss", $uid, $userId, $userRole, $department, $message);
            $stmt->execute();
        }

        $response = ['success' => true, 'message' => 'Alert sent successfully'];
        break;

    default:
        $response = ['success' => false, 'message' => 'Invalid action'];
        break;
}

echo json_encode($response);
exit;
?>
