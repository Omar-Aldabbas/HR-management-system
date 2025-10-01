<?php
// date_default_timezone_set('Asia/Amman');
session_start([
    'cookie_httponly' => true,
    'cookie_secure'   => false,
    'cookie_samesite' => 'Strict'
]);

// require_once "auth_check.php";
require_once "../config/config.php";

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'unauthorized']);
    exit;
}

$input  = json_decode(file_get_contents("php://input"), true) ?? [];
$action = $input['action'] ?? '';
$response = ['success' => false, 'message' => 'Unknown action'];

switch ($action) {

    case 'clock-in':
        $clockIn = $input['clock_in'] ?? null;
        if (!$clockIn) { $response['message'] = 'Missing clock_in'; break; }

        $stmt = $mysqli->prepare("SELECT id FROM attendance WHERE user_id=? AND clock_out IS NULL");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($res->num_rows === 0) {
            $stmt2 = $mysqli->prepare("INSERT INTO attendance (user_id, clock_in) VALUES (?, ?)");
            $stmt2->bind_param("is", $user_id, $clockIn);
            $response = $stmt2->execute()
                ? ['success' => true, 'clock_in' => $clockIn]
                : ['success' => false, 'message' => 'Failed to clock in'];
        } else {
            $response['message'] = 'Already clocked in';
        }
        break;

    case 'clock-out':
        $clockOut = $input['clock_out'] ?? null;
        if (!$clockOut) { $response['message'] = 'Missing clock_out'; break; }

        $stmt = $mysqli->prepare("SELECT id FROM attendance WHERE user_id=? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($row = $res->fetch_assoc()) {
            $stmt2 = $mysqli->prepare("UPDATE attendance SET clock_out=? WHERE id=?");
            $stmt2->bind_param("si", $clockOut, $row['id']);
            $response = $stmt2->execute()
                ? ['success' => true, 'clock_out' => $clockOut]
                : ['success' => false, 'message' => 'Failed to clock out'];
        } else {
            $response['message'] = 'No active session';
        }
        break;

    case 'break-start':
        $startTime = $input['start_time'] ?? null;
        if (!$startTime) { $response['message'] = 'Missing start_time'; break; }

        $stmt = $mysqli->prepare("SELECT id FROM attendance WHERE user_id=? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($row = $res->fetch_assoc()) {
            $stmt2 = $mysqli->prepare("INSERT INTO breaks (attendance_id, start_time) VALUES (?, ?)");
            $stmt2->bind_param("is", $row['id'], $startTime);
            $response = $stmt2->execute()
                ? ['success' => true, 'message' => 'Break started']
                : ['success' => false, 'message' => 'Failed to start break'];
        } else {
            $response['message'] = 'No active session';
        }
        break;

    case 'break-end':
        $endTime = $input['end_time'] ?? null;
        if (!$endTime) { $response['message'] = 'Missing end_time'; break; }

        $stmt = $mysqli->prepare("
            SELECT b.id 
            FROM breaks b 
            JOIN attendance a ON b.attendance_id = a.id 
            WHERE a.user_id=? AND b.end_time IS NULL 
            ORDER BY b.start_time DESC 
            LIMIT 1
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($row = $res->fetch_assoc()) {
            $stmt2 = $mysqli->prepare("UPDATE breaks SET end_time=? WHERE id=?");
            $stmt2->bind_param("si", $endTime, $row['id']);
            $response = $stmt2->execute()
                ? ['success' => true, 'message' => 'Break ended']
                : ['success' => false, 'message' => 'Failed to end break'];
        } else {
            $response['message'] = 'No active break';
        }
        break;

    case 'history':
        $stmt = $mysqli->prepare("SELECT id, clock_in, clock_out FROM attendance WHERE user_id=? ORDER BY clock_in DESC LIMIT 20");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $history = [];

        while ($row = $res->fetch_assoc()) {
            $stmt2 = $mysqli->prepare("SELECT start_time, end_time FROM breaks WHERE attendance_id=?");
            $stmt2->bind_param("i", $row['id']);
            $stmt2->execute();
            $brRes = $stmt2->get_result();
            $breaks = $brRes->fetch_all(MYSQLI_ASSOC);

            $history[] = [
                'date' => date("Y-m-d", strtotime($row['clock_in'])),
                'clock_in' => $row['clock_in'],
                'clock_out' => $row['clock_out'],
                'breaks' => $breaks
            ];
        }
        $response = ['success' => true, 'history' => $history];
        break;

    default:
        $response['message'] = 'Unknown action';
}

echo json_encode($response);
exit;
