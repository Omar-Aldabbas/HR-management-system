<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure'   => false,
    'cookie_samesite' => 'None'
]);

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include '../config/config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'unauthorized', 'redirect' => 'auth.html']);
    exit;
}

$userId   = $_SESSION['user_id'];
$userRole = strtolower($_SESSION['role']);
$input    = json_decode(file_get_contents('php://input'), true) ?? [];
$action   = $input['action'] ?? '';
$response = ['success' => false, 'message' => 'Invalid request'];

switch ($action) {
    case 'get-user':
        $stmt = $mysqli->prepare("SELECT id, name AS full_name, role, department, position, avatar, email FROM users WHERE id=?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        $response = $user 
            ? ['success' => true, 'data' => $user] 
            : ['success' => false, 'message' => 'User not found', 'redirect' => 'auth.html'];
        break;

    case 'create':
        $amount = floatval($input['amount'] ?? 0);
        $reason = trim($input['reason'] ?? '');
        if ($amount > 0 && $reason !== '') {
            $stmt = $mysqli->prepare("INSERT INTO expenses (user_id, amount, reason) VALUES (?, ?, ?)");
            $stmt->bind_param("ids", $userId, $amount, $reason);
            $response = $stmt->execute()
                ? ['success' => true, 'message' => 'Expense submitted']
                : ['success' => false, 'message' => 'Error submitting expense'];
        } else {
            $response['message'] = 'Amount and reason are required';
        }
        break;

    case 'list':
        $stmt = $mysqli->prepare("
            SELECT e.*, u.name AS user_name, u.department, u.position 
            FROM expenses e 
            JOIN users u ON e.user_id=u.id 
            WHERE e.user_id=? 
            ORDER BY e.created_at DESC
        ");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $expenses = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $response = ['success' => true, 'expenses' => $expenses];
        break;

    case 'update':
        $expenseId = intval($input['id'] ?? 0);
        if ($expenseId <= 0) {
            $response['message'] = 'Expense ID is required';
            break;
        }

        if (in_array($userRole, ['employee','sales'])) {
            $amount = floatval($input['amount'] ?? 0);
            $reason = trim($input['reason'] ?? '');
            $stmt = $mysqli->prepare("UPDATE expenses SET amount=?, reason=? WHERE id=? AND user_id=?");
            $stmt->bind_param("dsii", $amount, $reason, $expenseId, $userId);
        } else { // manager/admin
            $status = $input['status'] ?? '';
            if (!in_array($status, ['pending','approved','rejected'], true)) {
                echo json_encode(['success' => false, 'message' => 'Invalid status']);
                exit;
            }
            $stmt = $mysqli->prepare("UPDATE expenses SET status=?, approved_by=? WHERE id=?");
            $stmt->bind_param("sii", $status, $userId, $expenseId);
        }

        $response = $stmt->execute()
            ? ['success' => true, 'message' => 'Expense updated']
            : ['success' => false, 'message' => 'Error updating expense'];
        break;

    case 'delete':
        $expenseId = intval($input['id'] ?? 0);
        if ($expenseId <= 0) {
            $response['message'] = 'Expense ID is required';
            break;
        }
        $stmt = $mysqli->prepare("DELETE FROM expenses WHERE id=? AND user_id=? AND status='pending'");
        $stmt->bind_param("ii", $expenseId, $userId);
        $response = $stmt->execute() && $stmt->affected_rows > 0
            ? ['success' => true, 'message' => 'Expense cancelled']
            : ['success' => false, 'message' => 'Only pending expenses can be cancelled'];
        break;

    default:
        $response['message'] = 'Invalid action';
        break;
}

echo json_encode($response);
exit;
