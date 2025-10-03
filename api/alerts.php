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
    $stmt = $mysqli->prepare("SELECT id, name, role, position, department FROM users WHERE id=? LIMIT 1");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

$currentUser = getCurrentUser($mysqli);
if (!$currentUser) {
    echo json_encode(['success'=>false,'message'=>'User not logged in']);
    exit;
}

$userId = (int)$currentUser['id'];
$userRole = strtolower($currentUser['role']);
$userDept = $currentUser['department'] ?? '';

switch ($action) {

    case 'get':
        echo json_encode(['success'=>true,'data'=>$currentUser]);
        exit;

    case 'list-users':
        if ($userRole === 'manager') {
            $stmt = $mysqli->prepare("SELECT id, name, role, position, department FROM users WHERE department=? AND role='employee'");
            $stmt->bind_param("s",$userDept);
        } elseif (in_array($userRole,['hr','hr_manager'])) {
            $stmt = $mysqli->prepare("SELECT id, name, role, position, department FROM users");
        } else {
            $stmt = $mysqli->prepare("SELECT id, name, role, position, department FROM users WHERE id=?");
            $stmt->bind_param("i",$userId);
        }
        $stmt->execute();
        $res = $stmt->get_result();
        $users = [];
        while($row=$res->fetch_assoc()) $users[]=$row;
        $stmt->close();
        echo json_encode(['success'=>true,'users'=>$users]);
        exit;

    case 'list':
        $alerts = [];

        if (in_array($userRole,['manager','hr','hr_manager'])) {
            $stmt = $mysqli->prepare("
                SELECT a.id,a.sender_id,a.sender_role,a.department,a.message,a.alert_date,u.name AS sender_name
                FROM alerts a
                JOIN users u ON a.sender_id=u.id
                WHERE a.sender_id=?
                ORDER BY a.alert_date DESC
            ");
            $stmt->bind_param("i",$userId);
            $stmt->execute();
            $res = $stmt->get_result();
            while($row=$res->fetch_assoc()) {
                $rStmt = $mysqli->prepare("SELECT u.name FROM alert_recipients ar JOIN users u ON ar.user_id=u.id WHERE ar.alert_id=?");
                $rStmt->bind_param("i",$row['id']);
                $rStmt->execute();
                $rRes = $rStmt->get_result();
                $sentTo=[];
                while($r=$rRes->fetch_assoc()) $sentTo[]=$r['name'];
                $rStmt->close();
                $row['sent_to']=$sentTo;
                $alerts[]=$row;
            }
            $stmt->close();

            $stmt2 = $mysqli->prepare("
                SELECT a.id,a.sender_id,a.sender_role,a.department,a.message,a.alert_date,u.name AS sender_name
                FROM alerts a
                JOIN users u ON a.sender_id=u.id
                JOIN alert_recipients ar ON ar.alert_id=a.id
                WHERE ar.user_id=?
                ORDER BY a.alert_date DESC
            ");
            $stmt2->bind_param("i",$userId);
            $stmt2->execute();
            $res2 = $stmt2->get_result();
            while($row=$res2->fetch_assoc()) {
                $rStmt = $mysqli->prepare("SELECT u.name FROM alert_recipients ar JOIN users u ON ar.user_id=u.id WHERE ar.alert_id=?");
                $rStmt->bind_param("i",$row['id']);
                $rStmt->execute();
                $rRes = $rStmt->get_result();
                $sentTo=[];
                while($r=$rRes->fetch_assoc()) $sentTo[]=$r['name'];
                $rStmt->close();
                $row['sent_to']=$sentTo;
                $alerts[]=$row;
            }
            $stmt2->close();

        } else {
            $stmt = $mysqli->prepare("
                SELECT a.id,a.sender_id,a.sender_role,a.department,a.message,a.alert_date,u.name AS sender_name
                FROM alerts a
                JOIN users u ON a.sender_id=u.id
                JOIN alert_recipients ar ON ar.alert_id=a.id
                WHERE ar.user_id=?
                ORDER BY a.alert_date DESC
            ");
            $stmt->bind_param("i",$userId);
            $stmt->execute();
            $res = $stmt->get_result();
            while($row=$res->fetch_assoc()) {
                $rStmt = $mysqli->prepare("SELECT u.name FROM alert_recipients ar JOIN users u ON ar.user_id=u.id WHERE ar.alert_id=?");
                $rStmt->bind_param("i",$row['id']);
                $rStmt->execute();
                $rRes = $rStmt->get_result();
                $sentTo=[];
                while($r=$rRes->fetch_assoc()) $sentTo[]=$r['name'];
                $rStmt->close();
                $row['sent_to']=$sentTo;
                $alerts[]=$row;
            }
            $stmt->close();
        }

        echo json_encode(['success'=>true,'alerts'=>$alerts]);
        exit;

    case 'send':
        if (!in_array($userRole,['manager','hr','hr_manager'])) {
            echo json_encode(['success'=>false,'message'=>'Permission denied']);
            exit;
        }

        $message = trim($input['message'] ?? '');
        $usersParam = $input['users'] ?? [];
        $departmentParam = trim($input['department'] ?? '');

        if ($message==='') {
            echo json_encode(['success'=>false,'message'=>'Message cannot be empty']);
            exit;
        }

        $toUsers = [];

        if ($departmentParam) {
            $stmt = $mysqli->prepare("SELECT id FROM users WHERE department=? AND id!=?");
            $stmt->bind_param("si",$departmentParam,$userId);
            $stmt->execute();
            $res = $stmt->get_result();
            while($row=$res->fetch_assoc()) $toUsers[]=(int)$row['id'];
            $stmt->close();
        }

        if (!empty($usersParam) && is_array($usersParam)) {
            foreach($usersParam as $uid) if($uid>0 && $uid!=$userId) $toUsers[]=(int)$uid;
        }

        $toUsers = array_values(array_unique($toUsers));

        if (empty($toUsers)) {
            echo json_encode(['success'=>false,'message'=>'No recipients found']);
            exit;
        }

        $mysqli->begin_transaction();
        try {
            $stmt = $mysqli->prepare("INSERT INTO alerts (sender_id,sender_role,department,message) VALUES (?,?,?,?)");
            $stmt->bind_param("isss",$userId,$userRole,$departmentParam,$message);
            $stmt->execute();
            $alertId = $stmt->insert_id;
            $stmt->close();

            $insertRecipient = $mysqli->prepare("INSERT INTO alert_recipients (alert_id,user_id) VALUES (?,?)");
            foreach($toUsers as $uid){
                $insertRecipient->bind_param("ii",$alertId,$uid);
                $insertRecipient->execute();
            }
            $insertRecipient->close();

            $mysqli->commit();

            $sentNames = [];
            $stmt = $mysqli->prepare("SELECT name FROM users WHERE id=?");
            foreach($toUsers as $uid){
                $stmt->bind_param("i",$uid);
                $stmt->execute();
                $sentNames[] = $stmt->get_result()->fetch_assoc()['name'] ?? '';
            }
            $stmt->close();

            echo json_encode(['success'=>true,'message'=>'Alert sent','sent_to'=>$sentNames]);

        } catch(Exception $e){
            $mysqli->rollback();
            echo json_encode(['success'=>false,'message'=>'Failed to send alert','error'=>$e->getMessage()]);
        }
        exit;

    default:
        echo json_encode(['success'=>false,'message'=>'Invalid action']);
        exit;
}
?>
