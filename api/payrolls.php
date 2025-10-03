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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

include '../config/config.php';

$input = json_decode(file_get_contents("php://input"), true) ?? [];
$action = $input['action'] ?? '';

function getCurrentUser($mysqli) {
    if (!isset($_SESSION['user_id'])) return null;
    $stmt = $mysqli->prepare("SELECT id, employee_id, name, role, position, department, email 
                              FROM users WHERE id=? LIMIT 1");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

$currentUser = getCurrentUser($mysqli);
if (!$currentUser) {
    echo json_encode(['success'=>false, 'message'=>'User not logged in']);
    exit;
}

$role = strtolower($currentUser['role']);
$department = $currentUser['department'];

switch ($action) {

    case 'list':
        if (in_array($role, ['hr', 'hr_manager'])) {
            $stmt = $mysqli->prepare("
                SELECT p.*, u.name, u.department, u.role
                FROM payrolls p
                JOIN users u ON p.user_id = u.id
                ORDER BY p.year DESC, p.month DESC
            ");
        } elseif ($role === 'manager') {
            $stmt = $mysqli->prepare("
                SELECT p.*, u.name, u.department, u.role
                FROM payrolls p
                JOIN users u ON p.user_id = u.id
                WHERE u.department = ?
                ORDER BY p.year DESC, p.month DESC
            ");
            $stmt->bind_param("s", $department);
        } else {
            $stmt = $mysqli->prepare("
                SELECT p.*, u.name, u.department, u.role
                FROM payrolls p
                JOIN users u ON p.user_id = u.id
                WHERE p.user_id = ?
                ORDER BY p.year DESC, p.month DESC
            ");
            $stmt->bind_param("i", $currentUser['id']);
        }

        $stmt->execute();
        $res = $stmt->get_result();
        $payrolls = [];
        while ($row = $res->fetch_assoc()) {
            $row['net_salary'] = $row['base_salary'] + $row['additions'] - $row['deductions'] - $row['taxes'];
            $payrolls[] = $row;
        }
        $stmt->close();

        echo json_encode(['success'=>true, 'payrolls'=>$payrolls]);
        exit;

    case 'add':
        if (!in_array($role, ['hr', 'hr_manager'])) {
            echo json_encode(['success'=>false, 'message'=>'Permission denied']);
            exit;
        }

        $userId     = (int)($input['user_id'] ?? 0);
        $year       = (int)($input['year'] ?? date('Y'));
        $month      = (int)($input['month'] ?? date('n'));
        $base       = floatval($input['base_salary'] ?? 0);
        $additions  = floatval($input['additions'] ?? 0);
        $deductions = floatval($input['deductions'] ?? 0);
        $taxes      = floatval($input['taxes'] ?? 0);
        $approvedBy = $currentUser['id'];

        $stmt = $mysqli->prepare("
            INSERT INTO payrolls (user_id, year, month, base_salary, additions, deductions, taxes, approved_by, approved_at)
            VALUES (?,?,?,?,?,?,?,?,NOW())
        ");
        $stmt->bind_param("iiiidddd", $userId, $year, $month, $base, $additions, $deductions, $taxes, $approvedBy);
        $success = $stmt->execute();
        $stmt->close();

        echo json_encode([
            'success'=>$success,
            'message'=>$success ? 'Payroll added' : 'Failed to add payroll'
        ]);
        exit;

    case 'update':
        if (!in_array($role, ['hr', 'hr_manager'])) {
            echo json_encode(['success'=>false, 'message'=>'Permission denied']);
            exit;
        }

        $id         = (int)($input['id'] ?? 0);
        $base       = floatval($input['base_salary'] ?? 0);
        $additions  = floatval($input['additions'] ?? 0);
        $deductions = floatval($input['deductions'] ?? 0);
        $taxes      = floatval($input['taxes'] ?? 0);
        $approvedBy = $currentUser['id'];

        $stmt = $mysqli->prepare("
            UPDATE payrolls
            SET base_salary=?, additions=?, deductions=?, taxes=?, approved_by=?, approved_at=NOW()
            WHERE id=?
        ");
        $stmt->bind_param("ddddii", $base, $additions, $deductions, $taxes, $approvedBy, $id);
        $success = $stmt->execute();
        $stmt->close();

        echo json_encode([
            'success'=>$success,
            'message'=>$success ? 'Payroll updated' : 'Failed to update payroll'
        ]);
        exit;

    default:
        echo json_encode(['success'=>false, 'message'=>'Invalid action']);
        exit;
}
?>
