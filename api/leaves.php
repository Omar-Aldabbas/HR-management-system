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

if ($action === 'apply') {
    if ($userRole !== 'employee') {
        $response['message'] = 'Only employees can apply for leave';
    } else {
        $type = $input['type'] ?? 'other';
        $start = $input['start_date'] ?? '';
        $end = $input['end_date'] ?? '';
        if (!$start || !$end) {
            $response['message'] = 'Start and end dates are required';
        } else {
            $stmt = $mysqli->prepare("INSERT INTO leaves (user_id, type, start_date, end_date) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("isss", $userId, $type, $start, $end);
            if ($stmt->execute()) {
                $response = ['success' => true, 'message' => 'Leave applied'];
            } else {
                $response['message'] = 'Error applying for leave';
            }
        }
    }
}

if ($action === 'list') {
    if ($userRole === 'employee') {
        $stmt = $mysqli->prepare("SELECT * FROM leaves WHERE user_id=? ORDER BY start_date DESC");
        $stmt->bind_param("i", $userId);
    } else { 
        $stmt = $mysqli->prepare("SELECT l.*, u.name AS user_name FROM leaves l JOIN users u ON l.user_id=u.id ORDER BY l.start_date DESC");
    }
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
    if (!$leaveId) {
        $response['message'] = 'Leave ID is required';
    } else {
        if ($userRole === 'employee') {
            $stmt = $mysqli->prepare("UPDATE leaves SET status='cancelled' WHERE id=? AND user_id=? AND status='pending'");
            $stmt->bind_param("ii", $leaveId, $userId);
        } else {
            $status = $input['status'] ?? '';
            if (!in_array($status, ['approved','rejected'])) {
                $response['message'] = 'Invalid status';
                echo json_encode($response);
                exit;
            }
            $stmt = $mysqli->prepare("UPDATE leaves SET status=? WHERE id=?");
            $stmt->bind_param("si", $status, $leaveId);
        }

        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => 'Leave updated'];
        } else {
            $response['message'] = 'Error updating leave';
        }
    }
}

if ($action === 'delete') {
    if ($userRole !== 'employee') {
        $response['message'] = 'Only employees can delete leave requests';
    } else {
        $leaveId = $input['id'] ?? 0;
        if (!$leaveId) {
            $response['message'] = 'Leave ID is required';
        } else {
            $stmt = $mysqli->prepare("DELETE FROM leaves WHERE id=? AND user_id=? AND status='pending'");
            $stmt->bind_param("ii", $leaveId, $userId);
            if ($stmt->execute()) {
                $response = ['success' => true, 'message' => 'Leave deleted'];
            } else {
                $response['message'] = 'Error deleting leave';
            }
        }
    }
}

echo json_encode($response);
?>
