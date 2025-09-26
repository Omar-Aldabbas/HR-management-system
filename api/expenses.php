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

if ($action === 'create') {
    if ($userRole !== 'employee') {
        $response['message'] = 'Only employees can submit expenses';
    } else {
        $amount = $input['amount'] ?? 0;
        $reason = trim($input['reason'] ?? '');
        if ($amount <= 0 || !$reason) {
            $response['message'] = 'Amount and reason are required';
        } else {
            $stmt = $mysqli->prepare("INSERT INTO expenses (user_id, amount, reason) VALUES (?, ?, ?)");
            $stmt->bind_param("ids", $userId, $amount, $reason);
            if ($stmt->execute()) {
                $response = ['success' => true, 'message' => 'Expense submitted'];
            } else {
                $response['message'] = 'Error submitting expense';
            }
        }
    }
}

if ($action === 'list') {
    if ($userRole === 'employee') {
        $stmt = $mysqli->prepare("SELECT * FROM expenses WHERE user_id=? ORDER BY created_at DESC");
        $stmt->bind_param("i", $userId);
    } else {
        $stmt = $mysqli->prepare("SELECT e.*, u.name AS user_name FROM expenses e JOIN users u ON e.user_id=u.id ORDER BY e.created_at DESC");
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $expenses = [];
    while ($row = $result->fetch_assoc()) {
        $expenses[] = $row;
    }
    $response = ['success' => true, 'expenses' => $expenses];
}

if ($action === 'update') {
    $expenseId = $input['id'] ?? 0;
    if ($expenseId) {
        if ($userRole === 'employee') {
            $amount = $input['amount'] ?? 0;
            $reason = trim($input['reason'] ?? '');
            $stmt = $mysqli->prepare("UPDATE expenses SET amount=?, reason=? WHERE id=? AND user_id=?");
            $stmt->bind_param("dsii", $amount, $reason, $expenseId, $userId);
        } else {
            $status = $input['status'] ?? '';
            if (!in_array($status, ['pending','approved','rejected'])) {
                echo json_encode(['success' => false, 'message' => 'Invalid status']);
                exit;
            }
            $stmt = $mysqli->prepare("UPDATE expenses SET status=? WHERE id=?");
            $stmt->bind_param("si", $status, $expenseId);
        }
        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => 'Expense updated'];
        } else {
            $response['message'] = 'Error updating expense';
        }
    } else {
        $response['message'] = 'Expense ID is required';
    }
}

if ($action === 'delete') {
    if ($userRole === 'employee') {
        $expenseId = $input['id'] ?? 0;
        if ($expenseId) {
            $stmt = $mysqli->prepare("DELETE FROM expenses WHERE id=? AND user_id=?");
            $stmt->bind_param("ii", $expenseId, $userId);
            if ($stmt->execute()) {
                $response = ['success' => true, 'message' => 'Expense deleted'];
            } else {
                $response['message'] = 'Error deleting expense';
            }
        } else {
            $response['message'] = 'Expense ID is required';
        }
    } else {
        $response['message'] = 'Only employees can delete expenses';
    }
}

echo json_encode($response);
?>
