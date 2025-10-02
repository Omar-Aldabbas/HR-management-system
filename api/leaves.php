<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure'   => false,
    'cookie_samesite' => 'Strict'
]);

include '../config/config.php';

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? '';
$userId = $_SESSION['user_id'];
$userRole = strtolower($_SESSION['role'] ?? 'employee');
$userDept = $_SESSION['department'] ?? '';

$response = ['success' => false, 'message' => 'Invalid request'];

switch ($action) {
    case 'apply':
        if (!in_array($userRole, ['employee','manager','hr','hr_manager'])) break;
        $type = trim($input['type'] ?? 'other');
        $start = trim($input['start_date'] ?? '');
        $end = trim($input['end_date'] ?? '');
        if (!$start || !$end) break;
        $stmt = $mysqli->prepare("INSERT INTO leaves (user_id, type, start_date, end_date, status, applied_at) VALUES (?, ?, ?, ?, 'pending', NOW())");
        $stmt->bind_param("isss", $userId, $type, $start, $end);
        $response = $stmt->execute() ? ['success' => true, 'message' => 'Leave applied'] : ['success' => false, 'message' => 'Error applying for leave'];
        break;

    case 'list':
        $sql = "SELECT l.*, u.name AS user_name, u.department, u.role, a.name AS approver_name, a.role AS approver_role
                FROM leaves l
                JOIN users u ON l.user_id = u.id
                LEFT JOIN users a ON l.approved_by = a.id";
        $params = [];
        $types = "";

        if (in_array($userRole, ['employee','hr'])) {
            $sql .= " WHERE l.user_id = ?";
            $params[] = $userId;
            $types .= "i";
        } elseif ($userRole === 'manager') {
            $sql .= " WHERE u.department = ? AND l.user_id != ?";
            $params[] = $userDept;
            $params[] = $userId;
            $types .= "si";
        }

        $sql .= " ORDER BY l.applied_at DESC";
        $stmt = $mysqli->prepare($sql);
        if ($params) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $leaves = [];
        while ($row = $result->fetch_assoc()) $leaves[] = $row;
        $response = ['success' => true, 'message' => 'Leaves fetched', 'leaves' => $leaves];
        break;

    case 'update':
        $leaveId = intval($input['id'] ?? 0);
        $status = trim($input['status'] ?? '');
        $message = trim($input['message'] ?? '');
        if (!$leaveId || !in_array($status, ['approved','rejected'])) break;

        if ($userRole === 'manager') break;

        $stmt = $mysqli->prepare("SELECT l.user_id, u.role FROM leaves l JOIN users u ON l.user_id=u.id WHERE l.id=?");
        $stmt->bind_param("i", $leaveId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) break;

        $targetRole = strtolower($row['role']);
        if ($userRole === 'hr' && $targetRole === 'manager') break;

        $stmt = $mysqli->prepare("UPDATE leaves SET status=?, approved_by=?, action_message=?, action_date=NOW() WHERE id=?");
        $stmt->bind_param("sisi", $status, $userId, $message, $leaveId);
        $response = $stmt->execute() ? ['success' => true, 'message' => 'Leave updated'] : ['success' => false, 'message' => 'Error updating leave'];
        break;

    case 'delete':
        $leaveId = intval($input['id'] ?? 0);
        if (!$leaveId) break;
        $stmt = $mysqli->prepare("DELETE FROM leaves WHERE id=? AND user_id=? AND status='pending'");
        $stmt->bind_param("ii", $leaveId, $userId);
        $response = $stmt->execute() ? ['success' => true, 'message' => 'Leave deleted'] : ['success' => false, 'message' => 'Error deleting leave'];
        break;

    default:
        $response['message'] = 'Invalid action';
        break;
}

echo json_encode($response);
exit;
?>
