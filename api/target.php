<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure'   => false,
    'cookie_samesite' => 'Strict'
]);
// require_once "auth_check.php";

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

include '../config/config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'unauthorized', 'redirect' => 'auth.html']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? '';
$userId = $_SESSION['user_id'];
$userRole = $_SESSION['role'] ?? 'employee';

$response = ['success' => false, 'message' => 'Invalid request'];

switch ($action) {

    case 'create':
        if (!in_array($userRole, ['manager','admin'])) break;

        $empId = $input['user_id'] ?? 0;
        $title = $input['title'] ?? '';
        $desc = $input['description'] ?? '';
        $targetAmount = $input['target_amount'] ?? 0;
        $deadline = $input['deadline'] ?? '';

        if (!$empId || !$title || !$targetAmount || !$deadline) break;

        $stmt = $mysqli->prepare("INSERT INTO targets (user_id, title, description, target_amount, deadline) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("issds", $empId, $title, $desc, $targetAmount, $deadline);
        $response = $stmt->execute()
            ? ['success' => true, 'message' => 'Target created']
            : ['success' => false, 'message' => 'Error creating target'];
        break;

    case 'list':
        if ($userRole === 'employee') {
            $stmt = $mysqli->prepare("SELECT * FROM targets WHERE user_id=? ORDER BY deadline DESC");
            $stmt->bind_param("i", $userId);
        } else {
            $stmt = $mysqli->prepare("SELECT t.*, u.name AS user_name FROM targets t JOIN users u ON t.user_id=u.id ORDER BY t.deadline DESC");
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $targets = [];
        while ($row = $result->fetch_assoc()) $targets[] = $row;
        $response = ['success' => true, 'targets' => $targets];
        break;

    case 'update':
        $targetId = $input['id'] ?? 0;
        if (!$targetId) break;

        if ($userRole === 'employee') {
            $achieved = $input['achieved_amount'] ?? 0;
            $stmt = $mysqli->prepare("UPDATE targets SET achieved_amount=? WHERE id=? AND user_id=?");
            $stmt->bind_param("dii", $achieved, $targetId, $userId);
        } else {
            $title = $input['title'] ?? '';
            $desc = $input['description'] ?? '';
            $targetAmount = $input['target_amount'] ?? 0;
            $achieved = $input['achieved_amount'] ?? 0;
            $deadline = $input['deadline'] ?? '';
            $status = $input['status'] ?? 'pending';
            $stmt = $mysqli->prepare("UPDATE targets SET title=?, description=?, target_amount=?, achieved_amount=?, deadline=?, status=? WHERE id=?");
            $stmt->bind_param("ssddssi", $title, $desc, $targetAmount, $achieved, $deadline, $status, $targetId);
        }

        $response = $stmt->execute()
            ? ['success' => true, 'message' => 'Target updated']
            : ['success' => false, 'message' => 'Error updating target'];
        break;

    case 'delete':
        if (!in_array($userRole, ['manager','admin'])) break;

        $targetId = $input['id'] ?? 0;
        if (!$targetId) break;

        $stmt = $mysqli->prepare("DELETE FROM targets WHERE id=?");
        $stmt->bind_param("i", $targetId);
        $response = $stmt->execute()
            ? ['success' => true, 'message' => 'Target deleted']
            : ['success' => false, 'message' => 'Error deleting target'];
        break;

    default:
        $response['message'] = 'Invalid action';
        break;
}

echo json_encode($response);
exit;
