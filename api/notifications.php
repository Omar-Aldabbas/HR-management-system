<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => false, 
    'cookie_samesite' => 'None'
]);

// require_once "auth_check.php";

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

include '../config/config.php';

$response = ['success' => false, 'message' => 'Invalid request'];

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'unauthorized', 'redirect' => 'auth.html']);
    exit;
}
$user_id   = (int) $_SESSION['user_id'];
$user_role = $_SESSION['role'] ?? 'employee';


if ($action === 'send') {
    if (!in_array($user_role, ['admin', 'manager'])) {
        $response['message'] = 'Permission denied';
    } else {
        $title      = trim($input['title'] ?? '');
        $message    = trim($input['message'] ?? '');
        $recipients = $input['recipients'] ?? [];

        if ($title === '' || $message === '') {
            $response['message'] = 'Title and message are required';
        } else {
            if (empty($recipients)) {
                // (all users)
                $stmt = $mysqli->prepare(
                    "INSERT INTO notifications (sender_id, recipient_id, title, message)
                     SELECT ?, id, ?, ? FROM users"
                );
                $stmt->bind_param("iss", $user_id, $title, $message);
                $stmt->execute();
            } else {
                // Single User
                $stmt = $mysqli->prepare(
                    "INSERT INTO notifications (sender_id, recipient_id, title, message) 
                     VALUES (?, ?, ?, ?)"
                );
                foreach ($recipients as $recip_id) {
                    $recip_id = (int) $recip_id;
                    // $stmt->bond_param("iiss")
                    $stmt->bind_param("iiss", $user_id, $recip_id, $title, $message);
                    $stmt->execute();
                }
            }
            $response = ['success' => true, 'message' => 'Notification sent'];
        }
    }
}


elseif ($action === 'get') {
    $stmt = $mysqli->prepare(
        "SELECT n.id, n.sender_id, u.name AS sender_name, n.title, n.message, 
                n.is_read, n.created_at
         FROM notifications n
         LEFT JOIN users u ON n.sender_id = u.id
         WHERE n.recipient_id = ? 
         ORDER BY n.created_at DESC"
    );
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $notifications = $result->fetch_all(MYSQLI_ASSOC);

    $response = ['success' => true, 'notifications' => $notifications];
}


elseif ($action === 'mark-read') {
    $notif_id = (int) ($input['id'] ?? 0);

    if ($notif_id > 0) {
        $stmt = $mysqli->prepare(
            "UPDATE notifications 
             SET is_read=1 
             WHERE id=? AND recipient_id=?"
        );
        $stmt->bind_param("ii", $notif_id, $user_id);
        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => 'Notification marked as read'];
        } else {
            $response['message'] = 'Failed to update';
        }
    } elseif (isset($input['all']) && $input['all'] === true) {
        $stmt = $mysqli->prepare(
            "UPDATE notifications SET is_read=1 WHERE recipient_id=?"
        );
        $stmt->bind_param("i", $user_id);
        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => 'All notifications marked as read'];
        } else {
            $response['message'] = 'Failed to update all';
        }
    } else {
        $response['message'] = 'Notification ID required';
    }
}

echo json_encode($response);
?>
