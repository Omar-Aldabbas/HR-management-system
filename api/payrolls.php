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
    $stmt = $mysqli->prepare("SELECT id, name, role, department FROM users WHERE id=? LIMIT 1");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

$currentUser = getCurrentUser($mysqli);
if (!$currentUser) {
    echo json_encode(['success'=>false,'message'=>'User not logged in']);
    exit;
}

$userId = $currentUser['id'];
$userRole = strtolower($currentUser['role']);
$userDept = strtolower($currentUser['department']);

switch($action) {

    case 'list':
        if (in_array($userRole, ['admin', 'hr']) || ($userRole === 'manager' && $userDept === 'hr')) {
            $stmt = $mysqli->prepare("
                SELECT p.*, u.name, u.department, u.role,
                    IFNULL(SUM(e.amount),0) AS approved_expenses,
                    a.name AS approved_by_name
                FROM payrolls p
                JOIN users u ON u.id=p.user_id
                LEFT JOIN users a ON a.id=p.approved_by
                LEFT JOIN expenses e ON e.user_id=u.id AND e.status='approved'
                GROUP BY p.id
                ORDER BY p.year DESC, p.month DESC
            ");
        } else {
            $stmt = $mysqli->prepare("
                SELECT p.*, u.name, u.department, u.role,
                    IFNULL(SUM(e.amount),0) AS approved_expenses,
                    a.name AS approved_by_name
                FROM payrolls p
                JOIN users u ON u.id=p.user_id
                LEFT JOIN users a ON a.id=p.approved_by
                LEFT JOIN expenses e ON e.user_id=u.id AND e.status='approved'
                WHERE p.user_id=?
                GROUP BY p.id
                ORDER BY p.year DESC, p.month DESC
            ");
            $stmt->bind_param('i', $userId);
        }

        $stmt->execute();
        $res = $stmt->get_result();
        $payrolls = [];
        while ($row = $res->fetch_assoc()) {
            $row['net_salary'] = $row['base_salary'] + $row['additions'] + $row['approved_expenses'] - $row['deductions'] - $row['taxes'];
            $payrolls[] = $row;
        }
        echo json_encode(['success'=>true,'payrolls'=>$payrolls]);
        exit;

    case 'add':
        if (!in_array($userRole, ['hr','admin'])) {
            echo json_encode(['success'=>false,'message'=>'Permission denied']);
            exit;
        }
        $userIdToAdd = (int)($input['user_id'] ?? 0);
        $year = (int)($input['year'] ?? date('Y'));
        $month = (int)($input['month'] ?? date('n'));
        $base = floatval($input['base_salary'] ?? 0);
        $additions = floatval($input['additions'] ?? 0);
        $deductions = floatval($input['deductions'] ?? 0);
        $taxes = floatval($input['taxes'] ?? 0);

        $stmt = $mysqli->prepare("
            INSERT INTO payrolls (user_id, department, base_salary, additions, deductions, taxes, approved_by, year, month, created_at)
            VALUES (?, (SELECT department FROM users WHERE id=?), ?, ?, ?, ?, NULL, ?, ?, NOW())
        ");
        $stmt->bind_param("iiddddii",$userIdToAdd,$userIdToAdd,$base,$additions,$deductions,$taxes,$year,$month);
        $success = $stmt->execute();
        $stmt->close();
        echo json_encode(['success'=>$success,'message'=>$success?'Payroll added successfully':'Failed to add payroll']);
        exit;

    case 'update':
        if (!in_array($userRole,['hr','admin'])) {
            echo json_encode(['success'=>false,'message'=>'Permission denied']);
            exit;
        }
        $id = (int)($input['id'] ?? 0);
        $base = floatval($input['base_salary'] ?? 0);
        $additions = floatval($input['additions'] ?? 0);
        $deductions = floatval($input['deductions'] ?? 0);
        $taxes = floatval($input['taxes'] ?? 0);

        $stmt = $mysqli->prepare("
            UPDATE payrolls
            SET base_salary=?, additions=?, deductions=?, taxes=?, updated_at=NOW()
            WHERE id=?
        ");
        $stmt->bind_param("ddddi",$base,$additions,$deductions,$taxes,$id);
        $success = $stmt->execute();
        $stmt->close();
        echo json_encode(['success'=>$success,'message'=>$success?'Payroll updated successfully':'Failed to update payroll']);
        exit;

    case 'approve':
        $payrollId = (int)($input['id'] ?? 0);
        $stmt = $mysqli->prepare("SELECT user_id, department FROM payrolls WHERE id=? LIMIT 1");
        $stmt->bind_param("i", $payrollId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$row) { echo json_encode(['success'=>false,'message'=>'Payroll not found']); exit; }

        $payrollUserId = $row['user_id'];
        $payrollDept = strtolower($row['department']);

        $canApprove = false;
        if ($userRole === 'admin') $canApprove = true;
        elseif ($userRole === 'manager' && $userDept === 'hr') $canApprove = true;
        elseif ($userRole === 'hr' && $userDept === 'hr' && $payrollUserId !== $userId) $canApprove = true;

        if (!$canApprove) {
            echo json_encode(['success'=>false,'message'=>'Permission denied']);
            exit;
        }

        $stmt = $mysqli->prepare("UPDATE payrolls SET approved_by=?, approved_at=NOW() WHERE id=?");
        $stmt->bind_param("ii", $userId, $payrollId);
        $success = $stmt->execute();
        $stmt->close();
        echo json_encode(['success'=>$success,'message'=>$success?'Payroll approved':'Failed to approve payroll']);
        exit;

    default:
        echo json_encode(['success'=>false,'message'=>'Invalid action']);
        exit;
}
?>
