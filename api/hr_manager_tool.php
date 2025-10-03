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
    $stmt = $mysqli->prepare("SELECT id, name, role, department, position, email FROM users WHERE id=? LIMIT 1");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

$currentUser = getCurrentUser($mysqli);
if (!$currentUser) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

switch ($action) {
    case 'get-user':
        echo json_encode(['success' => true, 'data' => $currentUser]);
        exit;

    case 'list-users':
        $role = strtolower($currentUser['role']);
        if ($role === 'hr' || $role === 'hr_manager') {
            $stmt = $mysqli->prepare("SELECT id, name, email, role, position, department FROM users");
        } elseif ($role === 'manager') {
            $dept = $currentUser['department'];
            $stmt = $mysqli->prepare("SELECT id, name, email, role, position, department FROM users WHERE department=?");
            $stmt->bind_param("s", $dept);
        } else {
            $stmt = $mysqli->prepare("SELECT id, name, email, role, position, department FROM users WHERE id=?");
            $stmt->bind_param("i", $currentUser['id']);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $users = [];
        while ($row = $result->fetch_assoc()) $users[] = $row;
        $stmt->close();
        echo json_encode(['success' => true, 'users' => $users]);
        exit;

    case 'update-user':
        if (!in_array($currentUser['role'], ['hr', 'hr_manager'])) {
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
        $userId = intval($input['id'] ?? 0);
        $position = trim($input['position'] ?? '');
        $department = trim($input['department'] ?? '');
        if (!$userId || !$position || !$department) {
            echo json_encode(['success' => false, 'message' => 'Missing fields']);
            exit;
        }
        $stmt = $mysqli->prepare("UPDATE users SET position=?, department=? WHERE id=?");
        $stmt->bind_param("ssi", $position, $department, $userId);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['success' => true, 'message' => 'User updated']);
        exit;

    case 'assign-task':
        if ($currentUser['role'] !== 'manager') {
            echo json_encode(['success' => false, 'message' => 'Only managers can assign tasks']);
            exit;
        }
        $employeeId = intval($input['employee_id'] ?? 0);
        $title = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');
        $deadline = trim($input['deadline'] ?? '');
        $priority = in_array($input['priority'] ?? '', ['low','medium','high']) ? $input['priority'] : 'medium';
        if (!$employeeId || !$title) {
            echo json_encode(['success'=>false, 'message'=>'Missing fields']);
            exit;
        }
        $stmt = $mysqli->prepare("INSERT INTO tasks (user_id, title, description, status, priority, deadline, created_at) VALUES (?, ?, ?, 'pending', ?, ?, NOW())");
        $stmt->bind_param("issss", $employeeId, $title, $description, $priority, $deadline);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['success'=>true, 'message'=>'Task assigned successfully']);
        exit;

    case 'assign-target':
        if ($currentUser['role'] !== 'manager') {
            echo json_encode(['success'=>false, 'message'=>'Only managers can assign targets']);
            exit;
        }
        $employeeId = intval($input['employee_id'] ?? 0);
        $title = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');
        $targetAmount = floatval($input['target_amount'] ?? 0);
        $deadline = trim($input['deadline'] ?? '');
        if (!$employeeId || !$title || !$targetAmount) {
            echo json_encode(['success'=>false, 'message'=>'Missing fields']);
            exit;
        }
        $stmt = $mysqli->prepare("INSERT INTO targets (user_id, title, description, target_amount, deadline, status, approved_by) VALUES (?, ?, ?, ?, ?, 'pending', ?)");
        $stmt->bind_param("issdsi", $employeeId, $title, $description, $targetAmount, $deadline, $currentUser['id']);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['success'=>true, 'message'=>'Target assigned successfully']);
        exit;

    case 'schedule-meeting':
        if ($currentUser['role'] !== 'manager') {
            echo json_encode(['success'=>false, 'message'=>'Only managers can schedule meetings']);
            exit;
        }
        $title = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');
        $startTime = trim($input['start_time'] ?? '');
        $endTime = trim($input['end_time'] ?? '');
        $participants = $input['participants'] ?? [];
        if (!$title || !$startTime || !$endTime || empty($participants)) {
            echo json_encode(['success'=>false, 'message'=>'Missing fields']);
            exit;
        }
        $participantsStr = implode(',', array_map('intval', $participants));
        $stmt = $mysqli->prepare("INSERT INTO meetings (organizer_id, title, description, start_time, end_time, participants, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->bind_param("isssss", $currentUser['id'], $title, $description, $startTime, $endTime, $participantsStr);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['success'=>true, 'message'=>'Meeting scheduled successfully']);
        exit;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        exit;
}
