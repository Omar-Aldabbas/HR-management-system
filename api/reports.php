<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure'   => false,
    'cookie_samesite' => 'Strict'
]);
// require_once "auth_check.php";
include '../config/config.php';

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'unauthorized', 'redirect' => 'auth.html']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$report_type = $input['report_type'] ?? '';
$filter_user_id = $input['user_id'] ?? null;
$status = $input['status'] ?? null;
$type = $input['type'] ?? null;
$month = $input['month'] ?? null;

$user_id = $_SESSION['user_id'];
$user_role = $_SESSION['role'] ?? 'employee';
if ($user_role === 'employee') $filter_user_id = $user_id;

$response = ['success' => false, 'message' => 'Invalid report type'];

function runQuery($mysqli, $query, $params = [], $types = '') {
    $stmt = $mysqli->prepare($query);
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

switch ($report_type) {
    case 'attendance':
        $data = runQuery(
            $mysqli,
            "SELECT u.id, u.name, SUM(TIMESTAMPDIFF(MINUTE, a.clock_in, a.clock_out))/60 AS total_hours
             FROM attendance a
             JOIN users u ON u.id = a.user_id
             WHERE 1=1" . ($filter_user_id ? " AND a.user_id=?" : "") . ($month ? " AND DATE_FORMAT(a.clock_in,'%Y-%m')=?" : "") .
             " GROUP BY u.id, u.name",
            array_filter([$filter_user_id, $month], fn($v) => $v !== null),
            ($filter_user_id ? 'i' : '') . ($month ? 's' : '')
        );
        break;

    case 'tasks':
        $data = runQuery(
            $mysqli,
            "SELECT u.id, u.name, t.status, COUNT(*) AS total_tasks
             FROM tasks t
             JOIN users u ON u.id = t.user_id
             WHERE 1=1" . ($filter_user_id ? " AND t.user_id=?" : "") . ($status ? " AND t.status=?" : "") .
             " GROUP BY u.id, u.name, t.status",
            array_filter([$filter_user_id, $status], fn($v) => $v !== null),
            ($filter_user_id ? 'i' : '') . ($status ? 's' : '')
        );
        break;

    case 'expenses':
        $data = runQuery(
            $mysqli,
            "SELECT u.id, u.name, e.status, SUM(e.amount) AS total_amount
             FROM expenses e
             JOIN users u ON u.id = e.user_id
             WHERE 1=1" . ($filter_user_id ? " AND e.user_id=?" : "") . ($status ? " AND e.status=?" : "") .
             " GROUP BY u.id, u.name, e.status",
            array_filter([$filter_user_id, $status], fn($v) => $v !== null),
            ($filter_user_id ? 'i' : '') . ($status ? 's' : '')
        );
        break;

    case 'leaves':
        $data = runQuery(
            $mysqli,
            "SELECT u.id, u.name, l.type, COUNT(*) AS total_leaves
             FROM leaves l
             JOIN users u ON u.id = l.user_id
             WHERE 1=1" . ($filter_user_id ? " AND l.user_id=?" : "") . ($type ? " AND l.type=?" : "") .
             " GROUP BY u.id, u.name, l.type",
            array_filter([$filter_user_id, $type], fn($v) => $v !== null),
            ($filter_user_id ? 'i' : '') . ($type ? 's' : '')
        );
        break;

    case 'targets':
        $data = runQuery(
            $mysqli,
            "SELECT u.id, u.name, t.target_amount, t.achieved_amount
             FROM targets t
             JOIN users u ON u.id = t.user_id
             WHERE 1=1" . ($filter_user_id ? " AND t.user_id=?" : ""),
            array_filter([$filter_user_id], fn($v) => $v !== null),
            $filter_user_id ? 'i' : ''
        );
        break;

    default:
        echo json_encode($response);
        exit;
}

echo json_encode([
    'success' => true,
    'report_type' => $report_type,
    'data' => $data
]);
exit;
