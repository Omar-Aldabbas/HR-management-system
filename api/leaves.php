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

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$response = ['success' => false, 'message' => 'Invalid request'];
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';
$userId = $_SESSION['user_id'];
$userRole = $_SESSION['role'];
$userDept = $_SESSION['department'] ?? '';

if ($action === 'apply') {
    $type = $input['type'] ?? 'other';
    $start = $input['start_date'] ?? '';
    $end = $input['end_date'] ?? '';
    if ($start && $end) {
        $stmt = $mysqli->prepare("INSERT INTO leaves (user_id, type, start_date, end_date, status, applied_at) VALUES (?, ?, ?, ?, 'pending', NOW())");
        $stmt->bind_param("isss", $userId, $type, $start, $end);
        if ($stmt->execute()) $response = ['success' => true, 'message' => 'Leave applied'];
        else $response['message'] = 'Error applying for leave';
    } else $response['message'] = 'Start and end dates are required';
}

if ($action === 'list') {
    $query = "SELECT l.*, u.name AS user_name, u.department, u.role, a.name AS approver_name, a.position AS approver_position, l.action_message, l.action_date
              FROM leaves l
              JOIN users u ON u.id = l.user_id
              LEFT JOIN users a ON a.id = l.approved_by";
    if ($userRole === 'employee') $query .= " WHERE l.user_id=?";
    elseif ($userRole === 'manager') $query .= " WHERE u.department=?";
    $query .= " ORDER BY l.applied_at DESC";
    $stmt = $mysqli->prepare($query);
    if ($userRole === 'employee') $stmt->bind_param("i", $userId);
    elseif ($userRole === 'manager') $stmt->bind_param("s", $userDept);
    $stmt->execute();
    $result = $stmt->get_result();
    $leaves = [];
    while ($row = $result->fetch_assoc()) {
        $stmt2 = $mysqli->prepare("SELECT SUM(DATEDIFF(end_date,start_date)+1) as total_days FROM leaves WHERE user_id=? AND status='approved' AND YEAR(start_date)=YEAR(CURDATE())");
        $stmt2->bind_param("i", $row['user_id']);
        $stmt2->execute();
        $res2 = $stmt2->get_result()->fetch_assoc();
        $row['total_days_this_year'] = $res2['total_days'] ?? 0;
        $leaves[] = $row;
    }
    $response = ['success'=>true,'leaves'=>$leaves];
}

if ($action === 'update') {
    $leaveId = $input['id'] ?? 0;
    $status = $input['status'] ?? '';
    $message = trim($input['message'] ?? '');
    if ($leaveId && in_array($status, ['approved','rejected']) && in_array($userRole, ['hr','admin','manager'])) {
        $stmt = $mysqli->prepare("UPDATE leaves SET status=?, approved_by=?, action_message=?, action_date=NOW() WHERE id=?");
        $stmt->bind_param("sisi", $status, $userId, $message, $leaveId);
        if ($stmt->execute()) $response = ['success'=>true,'message'=>'Leave updated'];
        else $response['message'] = 'Error updating leave';
    }
}

if ($action === 'delete') {
    $leaveId = $input['id'] ?? 0;
    if ($leaveId && $userRole === 'employee') {
        $stmt = $mysqli->prepare("DELETE FROM leaves WHERE id=? AND user_id=? AND status='pending'");
        $stmt->bind_param("ii", $leaveId, $userId);
        if ($stmt->execute()) $response = ['success'=>true,'message'=>'Leave deleted'];
        else $response['message'] = 'Error deleting leave';
    }
}

echo json_encode($response);
?>
