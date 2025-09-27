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
    if (!in_array($userRole, ['employee', 'hr'])) {
        $response['message'] = 'Only employees or HR can apply for leave';
    } else {
        $type = $input['type'] ?? 'other';
        $start = $input['start_date'] ?? '';
        $end = $input['end_date'] ?? '';
        if ($start && $end) {
            $stmt = $mysqli->prepare("INSERT INTO leaves (user_id, type, start_date, end_date, status, applied_at) VALUES (?, ?, ?, ?, 'pending', NOW())");
            $stmt->bind_param("isss", $userId, $type, $start, $end);
            if ($stmt->execute()) {
                $response = ['success' => true, 'message' => 'Leave applied'];
            } else {
                $response['message'] = 'Error applying for leave';
            }
        } else {
            $response['message'] = 'Start and end dates are required';
        }
    }
}

if ($action === 'list') {
    $sql = "SELECT l.*, u.name AS user_name, u.department, u.role,
                a.name AS approver_name, a.role AS approver_position, l.action_message, l.action_date
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            LEFT JOIN users a ON l.approved_by = a.id";

    $params = [];
    $types = "";

    if ($userRole === 'employee' || $userRole === "sales") {
        $sql .= " WHERE l.user_id = ?";
        $params[] = $userId;
        $types .= "i";
    } elseif ($userRole === 'manager') {
        $sql .= " WHERE u.department = ? AND l.user_id != ?";
        $params[] = $userDept;
        $params[] = $userId;
        $types .= "si";
    } elseif ($userRole === 'hr') {
        $sql .= " ORDER BY l.applied_at DESC";
        $stmt = $mysqli->prepare($sql);
        $stmt->execute();
        $result = $stmt->get_result();
        $leaves = [];
        while ($row = $result->fetch_assoc()) {
            $leaves[] = $row;
        }
        $response = ['success' => true, 'leaves' => $leaves];
        echo json_encode($response);
        exit;
    }

    $sql .= " ORDER BY l.applied_at DESC";
    $stmt = $mysqli->prepare($sql);
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    $leaves = [];
    while ($row = $result->fetch_assoc()) {
        $leaves[] = $row;
    }
    $response = ['success' => true, 'leaves' => $leaves];
}

if ($action === 'update') {
    $leaveId = $input['id'] ?? 0;
    if ($leaveId) {
        $status = $input['status'] ?? '';
        $message = $input['message'] ?? '';
        if (!in_array($status, ['approved', 'rejected'])) {
            $response['message'] = 'Invalid status';
        } elseif (!in_array($userRole, ['manager', 'hr'])) {
            $response['message'] = 'You are not authorized to update leaves';
        } else {
            $stmt = $mysqli->prepare("UPDATE leaves SET status=?, approved_by=?, action_message=?, action_date=NOW() WHERE id=?");
            $stmt->bind_param("sisi", $status, $userId, $message, $leaveId);
            if ($stmt->execute()) {
                $response = ['success' => true, 'message' => 'Leave updated'];
            } else {
                $response['message'] = 'Error updating leave';
            }
        }
    } else {
        $response['message'] = 'Leave ID is required';
    }
}

if ($action === 'delete') {
    $leaveId = $input['id'] ?? 0;
    if ($leaveId) {
        $stmt = $mysqli->prepare("DELETE FROM leaves WHERE id=? AND user_id=? AND status='pending'");
        $stmt->bind_param("ii", $leaveId, $userId);
        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => 'Leave deleted'];
        } else {
            $response['message'] = 'Error deleting leave';
        }
    } else {
        $response['message'] = 'Leave ID is required';
    }
}

echo json_encode($response);
?>
