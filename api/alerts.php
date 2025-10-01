<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => false, 
    'cookie_samesite' => 'None'
]);

require_once '../config/config.php';

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

$response = ['success' => false, 'alerts' => [], 'message' => 'Invalid request'];

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

try {
    $stmt = $mysqli->prepare("
        SELECT id, message, type, created_at 
        FROM employee_alerts 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $alerts = $result->fetch_all(MYSQLI_ASSOC);

    $response = [
        'success' => true,
        'alerts' => $alerts,
        'message' => count($alerts) ? 'Alerts fetched successfully' : 'No alerts found'
    ];
} catch (Exception $e) {
    $response = [
        'success' => false,
        'alerts' => [],
        'message' => 'Error fetching alerts: ' . $e->getMessage()
    ];
}

echo json_encode($response);
exit;
