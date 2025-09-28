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
header("Content-Type: application/json");

include '../config/config.php';


//New way to check if auth Same as !isset($_SESSION['user_id'])
// $user_id = $_SESSION['user_id'] ?? null;
// if (!$user_id) {
//     echo json_encode(['success' => false, 'message' => 'Unauthorized']);
//     exit;
// }

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'UnAuthorized', 'redirect' => 'auth.html']);
    exit;
}

$response = ['success' => false, 'message' => 'Invalid request'];
$input = json_decode(file_get_contents("php://input"), true);
$action = $input['action'] ?? '';

function getUserStatus($mysqli, $uid) {
    $stmt = $mysqli->prepare("SELECT clock_in, clock_out FROM attendance WHERE user_id=? ORDER BY clock_in DESC LIMIT 1");
    $stmt->bind_param("i", $uid);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows === 1) {
        $row = $res->fetch_assoc();
        return !$row['clock_out'] ? 'Working' : 'Left';
    }
    return 'Not started';
}

if ($action === 'clock-in') {
    $stmt = $mysqli->prepare("SELECT id FROM attendance WHERE user_id=? AND clock_out IS NULL");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) {
        $stmt2 = $mysqli->prepare("INSERT INTO attendance (user_id, clock_in) VALUES (?, NOW())");
        $stmt2->bind_param("i", $user_id);
        if ($stmt2->execute()) {
            $response = ['success' => true, 'clock_in' => date("Y-m-d H:i:s")];
        }
    } else {
        $response = ['success' => false, 'message' => 'Already clocked in'];
    }
} elseif ($action === 'clock-out') {
    $stmt = $mysqli->prepare("SELECT id, clock_in FROM attendance WHERE user_id=? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows === 1) {
        $row = $res->fetch_assoc();
        $clock_in = new DateTime($row['clock_in']);
        $clock_out = new DateTime();
        $stmt2 = $mysqli->prepare("SELECT SUM(TIMESTAMPDIFF(SECOND, start_time, IFNULL(end_time, NOW()))) AS total_seconds FROM breaks WHERE attendance_id=?");
        $stmt2->bind_param("i", $row['id']);
        $stmt2->execute();
        $br = $stmt2->get_result()->fetch_assoc();
        $breakSeconds = $br['total_seconds'] ?? 0;
        $totalHours = ($clock_out->getTimestamp() - $clock_in->getTimestamp() - $breakSeconds) / 3600;
        $totalHours = round($totalHours, 2);
        $stmt3 = $mysqli->prepare("UPDATE attendance SET clock_out=NOW(), total_hours=? WHERE id=?");
        $stmt3->bind_param("di", $totalHours, $row['id']);
        if ($stmt3->execute()) $response = ['success' => true, 'total_hours' => $totalHours];
    } else {
        $response = ['success' => false, 'message' => 'No active session'];
    }
} elseif ($action === 'break-start') {
    $stmt = $mysqli->prepare("SELECT id FROM attendance WHERE user_id=? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows === 1) {
        $attendance_id = $res->fetch_assoc()['id'];
        $stmt2 = $mysqli->prepare("INSERT INTO breaks (attendance_id, start_time) VALUES (?, NOW())");
        $stmt2->bind_param("i", $attendance_id);
        if ($stmt2->execute()) $response = ['success' => true];
    }
} elseif ($action === 'break-end') {
    $stmt = $mysqli->prepare("SELECT b.id FROM breaks b JOIN attendance a ON b.attendance_id=a.id WHERE a.user_id=? AND b.end_time IS NULL ORDER BY b.start_time DESC LIMIT 1");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows === 1) {
        $break_id = $res->fetch_assoc()['id'];
        $stmt2 = $mysqli->prepare("UPDATE breaks SET end_time=NOW() WHERE id=?");
        $stmt2->bind_param("i", $break_id);
        if ($stmt2->execute()) $response = ['success' => true];
    }
} elseif ($action === 'check-break') {
    $stmt = $mysqli->prepare("SELECT start_time FROM breaks b JOIN attendance a ON b.attendance_id=a.id WHERE a.user_id=? AND b.end_time IS NULL ORDER BY b.start_time DESC LIMIT 1");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows === 1) {
        $row = $res->fetch_assoc();
        $response = ['success' => true, 'onBreak' => true, 'start_time' => $row['start_time']];
    } else {
        $response = ['success' => true, 'onBreak' => false];
    }
} elseif ($action === 'history') {
    $stmt = $mysqli->prepare("
        SELECT a.id, a.clock_in, a.clock_out, a.total_hours,
               IFNULL(SUM(TIMESTAMPDIFF(SECOND, b.start_time, IFNULL(b.end_time, NOW()))), 0) AS total_break_seconds
        FROM attendance a
        LEFT JOIN breaks b ON a.id = b.attendance_id
        WHERE a.user_id = ?
        GROUP BY a.id
        ORDER BY a.clock_in DESC
        LIMIT 20
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $history = [];
    while ($row = $res->fetch_assoc()) {
        $stmt2 = $mysqli->prepare("SELECT start_time, end_time, TIMESTAMPDIFF(SECOND, start_time, IFNULL(end_time, NOW())) AS duration FROM breaks WHERE attendance_id = ?");
        $stmt2->bind_param("i", $row['id']);
        $stmt2->execute();
        $brRes = $stmt2->get_result();
        $breaks = [];
        $totalBreakSeconds = 0;
        while ($br = $brRes->fetch_assoc()) {
            $br['duration'] = (int)$br['duration'];
            $breaks[] = $br;
            $totalBreakSeconds += $br['duration'];
        }
        $history[] = [
            'date' => date("Y-m-d", strtotime($row['clock_in'])),
            'clock_in' => $row['clock_in'],
            'clock_out' => $row['clock_out'],
            'total_hours' => $row['total_hours'],
            'breaks' => $breaks,
            'total_break_seconds' => $totalBreakSeconds
        ];
    }
    $response = ['success' => true, 'history' => $history];
} elseif ($action === 'department' || $action === 'all') {
    $stmt = $mysqli->prepare("SELECT role, department_id FROM users WHERE id=?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $me = $stmt->get_result()->fetch_assoc();
    $employees = [];
    if ($action === 'department' && $me['role'] === 'manager') {
        $stmt2 = $mysqli->prepare("SELECT id, name FROM users WHERE department_id=? AND role='employee'");
        $stmt2->bind_param("i", $me['department_id']);
        $stmt2->execute();
        $res2 = $stmt2->get_result();
        while ($row = $res2->fetch_assoc()) $employees[] = ['name' => $row['name'], 'status' => getUserStatus($mysqli, $row['id'])];
    }
    if ($action === 'all' && $me['role'] === 'hr') {
        $res2 = $mysqli->query("SELECT id, name FROM users WHERE role IN ('manager','employee')");
        while ($row = $res2->fetch_assoc()) $employees[] = ['name' => $row['name'], 'status' => getUserStatus($mysqli, $row['id'])];
    }
    $response = ['success' => true, 'employees' => $employees];
}

echo json_encode($response);
