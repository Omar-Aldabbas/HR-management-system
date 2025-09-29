<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => false,
    'cookie_samesite' => 'Strict'
]);

require_once "auth_check.php";

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

include '../config/config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized', 'redirect' => 'auth.html']);
    exit;
}

$response = ['success' => false, 'message' => 'Invalid request'];

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';


$user_id = $_SESSION['user_id'];
$user_role = $_SESSION['role'];

function getAttendanceReport($mysqli, $filter_user_id = null, $month = null) {
    $query = "SELECT u.id, u.name, SUM(TIMESTAMPDIFF(MINUTE, a.clock_in, a.clock_out))/60 AS total_hours
              FROM attendance a
              JOIN users u ON u.id = a.user_id
              WHERE 1=1";

    $params = [];
    $types = '';

    if ($filter_user_id) {
        $query .= " AND a.user_id=?";
        $params[] = $filter_user_id;
        $types .= 'i';
    }

    if ($month) {
        $query .= " AND DATE_FORMAT(a.clock_in,'%Y-%m')=?";
        $params[] = $month;
        $types .= 's';
    }

    $query .= " GROUP BY u.id, u.name";

    $stmt = $mysqli->prepare($query);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function getTasksReport($mysqli, $filter_user_id = null, $status = null) {
    $query = "SELECT u.id, u.name, t.status, COUNT(*) AS total_tasks
              FROM tasks t
              JOIN users u ON u.id = t.user_id
              WHERE 1=1";

    $params = [];
    $types = '';

    if ($filter_user_id) {
        $query .= " AND t.user_id=?";
        $params[] = $filter_user_id;
        $types .= 'i';
    }

    if ($status) {
        $query .= " AND t.status=?";
        $params[] = $status;
        $types .= 's';
    }

    $query .= " GROUP BY u.id, u.name, t.status";

    $stmt = $mysqli->prepare($query);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function getExpensesReport($mysqli, $filter_user_id = null, $status = null) {
    $query = "SELECT u.id, u.name, e.status, SUM(e.amount) AS total_amount
              FROM expenses e
              JOIN users u ON u.id = e.user_id
              WHERE 1=1";

    $params = [];
    $types = '';

    if ($filter_user_id) {
        $query .= " AND e.user_id=?";
        $params[] = $filter_user_id;
        $types .= 'i';
    }

    if ($status) {
        $query .= " AND e.status=?";
        $params[] = $status;
        $types .= 's';
    }

    $query .= " GROUP BY u.id, u.name, e.status";

    $stmt = $mysqli->prepare($query);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function getLeavesReport($mysqli, $filter_user_id = null, $type = null) {
    $query = "SELECT u.id, u.name, l.type, COUNT(*) AS total_leaves
              FROM leaves l
              JOIN users u ON u.id = l.user_id
              WHERE 1=1";

    $params = [];
    $types = '';

    if ($filter_user_id) {
        $query .= " AND l.user_id=?";
        $params[] = $filter_user_id;
        $types .= 'i';
    }

    if ($type) {
        $query .= " AND l.type=?";
        $params[] = $type;
        $types .= 's';
    }

    $query .= " GROUP BY u.id, u.name, l.type";

    $stmt = $mysqli->prepare($query);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function getTargetsReport($mysqli, $filter_user_id = null) {
    $query = "SELECT u.id, u.name, t.target_amount, t.achieved_amount
              FROM targets t
              JOIN users u ON u.id = t.user_id
              WHERE 1=1";

    $params = [];
    $types = '';

    if ($filter_user_id) {
        $query .= " AND t.user_id=?";
        $params[] = $filter_user_id;
        $types .= 'i';
    }

    $stmt = $mysqli->prepare($query);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

$report_type = $input['report_type'] ?? '';
$filter_user_id = $input['user_id'] ?? null;
$status = $input['status'] ?? null;
$type = $input['type'] ?? null;
$month = $input['month'] ?? null;

if ($user_role === 'employee') {
    $filter_user_id = $user_id;  
}

switch ($report_type) {
    case 'attendance':
        $data = getAttendanceReport($mysqli, $filter_user_id, $month);
        break;
    case 'tasks':
        $data = getTasksReport($mysqli, $filter_user_id, $status);
        break;
    case 'expenses':
        $data = getExpensesReport($mysqli, $filter_user_id, $status);
        break;
    case 'leaves':
        $data = getLeavesReport($mysqli, $filter_user_id, $type);
        break;
    case 'targets':
        $data = getTargetsReport($mysqli, $filter_user_id);
        break;
    default:
        $response['message'] = 'Invalid report type';
        echo json_encode($response);
        exit;
}

$response = [
    'success' => true,
    'report_type' => $report_type,
    'data' => $data
];

echo json_encode($response);
?>
