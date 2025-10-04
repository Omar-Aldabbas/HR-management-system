<?php
session_set_cookie_params([
  'httponly' => true,
  'secure' => false,
  'samesite' => 'Lax'
]);

session_start();

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}
// ini_set('display_errors', 0);
// error_reporting(0);
include '../config/config.php';



$input = json_decode(file_get_contents('php://input'), true) ?? [];

$action = $input['action'] ?? '';
if (!isset($_SESSION['user_id'])) {
  echo json_encode(['success' => false, 'error' => 'unauthorized']);
  exit;
}
$user_id = (int) $_SESSION['user_id'];
$user_role = $_SESSION['role'] ?? 'employee';
try {
  if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
    throw new Exception('database_connection_missing');
  }
  switch ($action) {
    case 'getEmployeeAnalytics':
      $attendance = [];
      $tasks = [];
      $leaves = [];
      $performance = [];
      $stmt = $mysqli->prepare("SELECT DATE_FORMAT(clock_in, '%b') AS month, COUNT(*) AS total, SUM(CASE WHEN clock_in IS NOT NULL THEN 1 ELSE 0 END) AS present FROM attendance WHERE user_id=? GROUP BY month ORDER BY MIN(clock_in)");
      $stmt->bind_param('i', $user_id);
      $stmt->execute();
      $attendance = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
      $stmt->close();
      $stmt = $mysqli->prepare("SELECT status, COUNT(*) AS total FROM tasks WHERE user_id=? GROUP BY status");
      $stmt->bind_param('i', $user_id);
      $stmt->execute();
      $tasks = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
      $stmt->close();
      $stmt = $mysqli->prepare("SELECT `type` AS leave_type, COUNT(*) AS total FROM leaves WHERE user_id=? GROUP BY `type`");
      $stmt->bind_param('i', $user_id);
      $stmt->execute();
      $leaves = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
      $stmt->close();
      $stmt = $mysqli->prepare("SELECT DATE_FORMAT(created_at, '%b') AS month, COUNT(*) AS completed FROM tasks WHERE user_id=? AND status IN ('finished','completed') GROUP BY month ORDER BY MIN(created_at)");
      $stmt->bind_param('i', $user_id);
      $stmt->execute();
      $performance = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
      $stmt->close();
      echo json_encode(['success' => true, 'attendance' => $attendance, 'tasks' => $tasks, 'leaves' => $leaves, 'performance' => $performance]);
      exit;

    case 'getCompanyAnalytics':
      $attendanceByDept = $mysqli->query("
        SELECT 
          COALESCE(u.department, 'Unassigned') AS department,
          COUNT(*) AS total,
          SUM(CASE WHEN a.clock_in IS NOT NULL THEN 1 ELSE 0 END) AS present
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        GROUP BY u.department
      ")->fetch_all(MYSQLI_ASSOC);

      $employeeDistribution = $mysqli->query("
        SELECT 
          COALESCE(department, 'Unassigned') AS department,
          COUNT(*) AS total
        FROM users
        GROUP BY department
      ")->fetch_all(MYSQLI_ASSOC);

      $taskSummary = $mysqli->query("
        SELECT 
          status, COUNT(*) AS total
        FROM tasks
        GROUP BY status
      ")->fetch_all(MYSQLI_ASSOC);

      $leaveUsage = $mysqli->query("
        SELECT 
          type AS leave_type, COUNT(*) AS total
        FROM leaves
        GROUP BY type
      ")->fetch_all(MYSQLI_ASSOC);

      $productivity = $mysqli->query("
        SELECT 
          COALESCE(u.department, 'Unassigned') AS department,
          ROUND(AVG(t.status = 'finished') * 100, 2) AS completion_rate
        FROM tasks t
        JOIN users u ON t.user_id = u.id
        GROUP BY u.department
      ")->fetch_all(MYSQLI_ASSOC);

      $genderDistribution = $mysqli->query("
        SELECT 
          COALESCE(gender, 'unknown') AS gender,
          COUNT(*) AS total
        FROM users
        GROUP BY gender
      ")->fetch_all(MYSQLI_ASSOC);

      $newHires = $mysqli->query("
        SELECT 
          DATE_FORMAT(date_joined, '%b') AS month,
          COUNT(*) AS hires
        FROM users
        WHERE date_joined IS NOT NULL 
          AND date_joined >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
        GROUP BY month
        ORDER BY MIN(date_joined)
      ")->fetch_all(MYSQLI_ASSOC);

      echo json_encode([
        'success' => true,
        'attendance' => $attendanceByDept,
        'employees' => $employeeDistribution,
        'tasks' => $taskSummary,
        'leaves' => $leaveUsage,
        'productivity' => $productivity,
        'gender' => $genderDistribution,
        'hires' => $newHires
      ]);
      exit;

    default:
      echo json_encode(['success' => false, 'message' => 'Invalid action']);
      exit;
  }
} catch (Exception $e) {
  echo json_encode(['success' => false, 'message' => 'server_error', 'detail' => $e->getMessage()]);
  exit;
}
