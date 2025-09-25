<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => false,
    'cookie_samesite' => 'Strict'
]);

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

require_once '../config/config.php';

$response = ['success' => false, 'alerts' => [], 'message' => 'Invalid request'];

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

try {
    $stmt = $mysqli->prepare("SELECT id, message, type, created_at FROM employee_alerts WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $alerts = [];
    while ($row = $result->fetch_assoc()) {
        $alerts[] = $row;
    }

    $response = ['success' => true, 'alerts' => $alerts];
} catch (Exception $e) {
    $response = ['success' => false, 'message' => $e->getMessage()];
}

echo json_encode($response);
