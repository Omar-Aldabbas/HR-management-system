<?php
session_start(['cookie_httponly'=>true,'cookie_secure'=>false,'cookie_samesite'=>'lax']);
require_once "../config/config.php";
header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) { echo json_encode(['success'=>false,'error'=>'unauthorized']); exit; }

$input = json_decode(file_get_contents("php://input"), true) ?? [];
$action = $input['action'] ?? '';
$time = date("Y-m-d H:i:s");
$response = ['success'=>false,'message'=>'Unknown action'];

switch($action) {
    case 'clock-in':
        $stmt = $mysqli->prepare("SELECT id FROM attendance WHERE user_id=? AND clock_out IS NULL");
        $stmt->bind_param("i",$user_id);
        $stmt->execute();
        $res = $stmt->get_result();
        if($res->num_rows===0){
            $stmt2 = $mysqli->prepare("INSERT INTO attendance (user_id,clock_in) VALUES (?,?)");
            $stmt2->bind_param("is",$user_id,$time);
            if($stmt2->execute()){
                $stmt3 = $mysqli->prepare("UPDATE user_states SET is_checked_in=1 WHERE user_id=?");
                $stmt3->bind_param("i",$user_id);
                $stmt3->execute();
                $response = ['success'=>true,'clock_in'=>$time];
            } else $response=['success'=>false,'message'=>'Failed to clock in'];
        } else $response['message']='Already clocked in';
        break;

    case 'clock-out':
        $stmt = $mysqli->prepare("SELECT id,clock_in FROM attendance WHERE user_id=? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1");
        $stmt->bind_param("i",$user_id);
        $stmt->execute();
        $res = $stmt->get_result();
        if($row=$res->fetch_assoc()){
            $stmt2=$mysqli->prepare("UPDATE attendance SET clock_out=? WHERE id=?");
            $stmt2->bind_param("si",$time,$row['id']);
            if($stmt2->execute()){
                $stmt3 = $mysqli->prepare("UPDATE user_states SET is_checked_in=0 WHERE user_id=?");
                $stmt3->bind_param("i",$user_id);
                $stmt3->execute();
                $response=['success'=>true,'clock_in'=>$row['clock_in'],'clock_out'=>$time];
            } else $response=['success'=>false,'message'=>'Failed to clock out'];
        } else $response['message']='No active session';
        break;

    case 'break-start':
        $stmt=$mysqli->prepare("SELECT id FROM attendance WHERE user_id=? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1");
        $stmt->bind_param("i",$user_id);
        $stmt->execute();
        $res=$stmt->get_result();
        if($row=$res->fetch_assoc()){
            $stmt2=$mysqli->prepare("INSERT INTO breaks (attendance_id,start_time) VALUES (?,?)");
            $stmt2->bind_param("is",$row['id'],$time);
            if($stmt2->execute()){
                $stmt3 = $mysqli->prepare("UPDATE user_states SET on_break=1 WHERE user_id=?");
                $stmt3->bind_param("i",$user_id);
                $stmt3->execute();
                $response=['success'=>true,'start_time'=>$time];
            } else $response=['success'=>false,'message'=>'Failed to start break'];
        } else $response['message']='No active session';
        break;

    case 'break-end':
        $stmt=$mysqli->prepare("SELECT b.id FROM breaks b JOIN attendance a ON b.attendance_id=a.id WHERE a.user_id=? AND b.end_time IS NULL ORDER BY b.start_time DESC LIMIT 1");
        $stmt->bind_param("i",$user_id);
        $stmt->execute();
        $res=$stmt->get_result();
        if($row=$res->fetch_assoc()){
            $stmt2=$mysqli->prepare("UPDATE breaks SET end_time=? WHERE id=?");
            $stmt2->bind_param("si",$time,$row['id']);
            if($stmt2->execute()){
                $stmt3 = $mysqli->prepare("UPDATE user_states SET on_break=0 WHERE user_id=?");
                $stmt3->bind_param("i",$user_id);
                $stmt3->execute();
                $response=['success'=>true,'end_time'=>$time];
            } else $response=['success'=>false,'message'=>'Failed to end break'];
        } else $response['message']='No active break';
        break;

    case 'history':
    case 'check-active-session':
        $stmt=$mysqli->prepare("SELECT id,clock_in,clock_out FROM attendance WHERE user_id=? ORDER BY clock_in DESC LIMIT 20");
        $stmt->bind_param("i",$user_id);
        $stmt->execute();
        $res=$stmt->get_result();
        $history=[]; $activeSession=null;
        while($row=$res->fetch_assoc()){
            $stmt2=$mysqli->prepare("SELECT start_time,end_time FROM breaks WHERE attendance_id=? ORDER BY start_time ASC");
            $stmt2->bind_param("i",$row['id']);
            $stmt2->execute();
            $brRes=$stmt2->get_result();
            $breaks=$brRes->fetch_all(MYSQLI_ASSOC);
            $totalBreakSec=0; $breakActive=false;
            foreach($breaks as $b){
                if(!empty($b['start_time']) && !empty($b['end_time'])) $totalBreakSec+=strtotime($b['end_time'])-strtotime($b['start_time']);
                else if(!empty($b['start_time']) && empty($b['end_time'])) $breakActive=true;
            }
            $totalHours=$row['clock_out']?round((strtotime($row['clock_out'])-strtotime($row['clock_in']))/3600,2):null;
            $history[]=['date'=>date("d/m/Y",strtotime($row['clock_in'])),'clock_in'=>$row['clock_in'],'clock_out'=>$row['clock_out']??null,'break_minutes'=>round($totalBreakSec/60),'total_hours'=>$totalHours,'break_active'=>$breakActive];
            if(!$row['clock_out'] && !$activeSession) $activeSession=$history[count($history)-1];
        }
        $response=['success'=>true,
                   'history'=>$action==='history'?$history:[],
                   'active_session'=>$activeSession,
                   'is_checked_in'=>$activeSession?true:false,
                   'on_break'=>$activeSession['break_active']??false,
                   'server_time'=>$time];
        break;

    default: $response=['success'=>false,'message'=>'Unknown action'];
}

echo json_encode($response);
exit;
?>
