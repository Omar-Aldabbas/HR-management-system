<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure'   => false,
    'cookie_samesite' => 'Strict'
]);

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include '../config/config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized', 'redirect' => 'auth.html']);
    exit;
}

$userId   = $_SESSION['user_id'];
$userRole = strtolower($_SESSION['role']);
$input    = json_decode(file_get_contents('php://input'), true) ?? [];
$action   = $input['action'] ?? '';
$response = ['success' => false, 'message' => 'Invalid request'];

if ($action === 'me') {
    echo json_encode([
        'success'  => true,
        'user_id'  => $userId,
        'role'     => $userRole
    ]);
    exit;
}

if ($action === 'create') {
    if ($userRole === 'employee' || $userRole === 'sales') {
        $amount = floatval($input['amount'] ?? 0);
        $reason = trim($input['reason'] ?? '');
        if ($amount > 0 && $reason !== '') {
            $stmt = $mysqli->prepare("INSERT INTO expenses (user_id, amount, reason) VALUES (?, ?, ?)");
            $stmt->bind_param("ids", $userId, $amount, $reason);
            if ($stmt->execute()) $response = ['success' => true, 'message' => 'Expense submitted'];
            else $response['message'] = 'Error submitting expense';
        } else $response['message'] = 'Amount and reason are required';
    } else $response['message'] = 'Not allowed';
}

if ($action === 'list') {
    if ($userRole === 'employee' || $userRole === 'sales') {
        $stmt = $mysqli->prepare("SELECT e.*, u.name AS user_name, u.department, u.position 
                                  FROM expenses e 
                                  JOIN users u ON e.user_id=u.id 
                                  WHERE e.user_id=? 
                                  ORDER BY e.created_at DESC");
        $stmt->bind_param("i", $userId);
    } else {
        $stmt = $mysqli->prepare("SELECT e.*, u.name AS user_name, u.department, u.position, a.name AS approved_by_name 
                                  FROM expenses e 
                                  JOIN users u ON e.user_id=u.id 
                                  LEFT JOIN users a ON e.approved_by=a.id
                                  ORDER BY e.created_at DESC");
    }
    $stmt->execute();
    $expenses = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $response = ['success' => true, 'expenses' => $expenses];
}

if ($action === 'update') {
    $expenseId = intval($input['id'] ?? 0);
    if ($expenseId > 0) {
        if ($userRole === 'employee' || $userRole === 'sales') {
            $amount = floatval($input['amount'] ?? 0);
            $reason = trim($input['reason'] ?? '');
            $stmt = $mysqli->prepare("UPDATE expenses SET amount=?, reason=? WHERE id=? AND user_id=?");
            $stmt->bind_param("dsii", $amount, $reason, $expenseId, $userId);
        } else {
            $status = $input['status'] ?? '';
            if (!in_array($status, ['pending','approved','rejected'], true)) {
                echo json_encode(['success' => false, 'message' => 'Invalid status']);
                exit;
            }
            $stmt = $mysqli->prepare("UPDATE expenses SET status=?, approved_by=? WHERE id=?");
            $stmt->bind_param("sii", $status, $userId, $expenseId);
        }
        if ($stmt->execute()) $response = ['success' => true, 'message' => 'Expense updated'];
        else $response['message'] = 'Error updating expense';
    } else $response['message'] = 'Expense ID is required';
}

if ($action === 'delete') {
    if ($userRole === 'employee' || $userRole === 'sales') {
        $expenseId = intval($input['id'] ?? 0);
        if ($expenseId > 0) {
            $stmt = $mysqli->prepare("DELETE FROM expenses WHERE id=? AND user_id=?");
            $stmt->bind_param("ii", $expenseId, $userId);
            if ($stmt->execute()) $response = ['success' => true, 'message' => 'Expense deleted'];
            else $response['message'] = 'Error deleting expense';
        } else $response['message'] = 'Expense ID is required';
    } else $response['message'] = 'Not allowed';
}

echo json_encode($response);
