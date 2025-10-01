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
$action = $input['action'] ?? '';

$user_id = $_SESSION['user_id'];
$role = $_SESSION['role'] ?? 'employee';
$response = ['success' => false, 'message' => 'Invalid request'];

switch ($action) {
    case 'create':
        if (!in_array($role, ['manager', 'admin'])) {
            $response['message'] = 'Permission denied';
        } else {
            $title = trim($input['title'] ?? '');
            $description = trim($input['description'] ?? '');
            $start_time = $input['start_time'] ?? '';
            $end_time = $input['end_time'] ?? '';
            $participants = $input['participants'] ?? '';

            if (!$title || !$start_time || !$end_time) {
                $response['message'] = 'Title, start time, and end time are required';
            } else {
                $stmt = $mysqli->prepare("INSERT INTO meetings (organizer_id, title, description, start_time, end_time, participants) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("isssss", $user_id, $title, $description, $start_time, $end_time, $participants);
                $response = $stmt->execute()
                    ? ['success' => true, 'message' => 'Meeting created successfully']
                    : ['success' => false, 'message' => 'Error creating meeting'];
            }
        }
        break;

    case 'get':
        $stmt = $mysqli->prepare("SELECT * FROM meetings WHERE organizer_id=? OR FIND_IN_SET(?, participants) ORDER BY start_time ASC");
        $stmt->bind_param("ii", $user_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $meetings = [];
        while ($row = $result->fetch_assoc()) $meetings[] = $row;
        $response = ['success' => true, 'meetings' => $meetings];
        break;

    case 'update':
        $meeting_id = $input['meeting_id'] ?? 0;
        if (!$meeting_id) {
            $response['message'] = 'Meeting ID required';
        } else {
            $stmt = $mysqli->prepare("SELECT organizer_id FROM meetings WHERE id=? LIMIT 1");
            $stmt->bind_param("i", $meeting_id);
            $stmt->execute();
            $res = $stmt->get_result();
            if ($res->num_rows !== 1) {
                $response['message'] = 'Meeting not found';
            } else {
                $meeting = $res->fetch_assoc();
                if ($meeting['organizer_id'] != $user_id && $role !== 'admin') {
                    $response['message'] = 'Permission denied';
                } else {
                    $title = trim($input['title'] ?? '');
                    $description = trim($input['description'] ?? '');
                    $start_time = $input['start_time'] ?? '';
                    $end_time = $input['end_time'] ?? '';
                    $participants = $input['participants'] ?? '';

                    $stmt2 = $mysqli->prepare("UPDATE meetings SET title=?, description=?, start_time=?, end_time=?, participants=? WHERE id=?");
                    $stmt2->bind_param("sssssi", $title, $description, $start_time, $end_time, $participants, $meeting_id);
                    $response = $stmt2->execute()
                        ? ['success' => true, 'message' => 'Meeting updated successfully']
                        : ['success' => false, 'message' => 'Error updating meeting'];
                }
            }
        }
        break;

    case 'delete':
        $meeting_id = $input['meeting_id'] ?? 0;
        if (!$meeting_id) {
            $response['message'] = 'Meeting ID required';
        } else {
            $stmt = $mysqli->prepare("SELECT organizer_id FROM meetings WHERE id=? LIMIT 1");
            $stmt->bind_param("i", $meeting_id);
            $stmt->execute();
            $res = $stmt->get_result();
            if ($res->num_rows !== 1) {
                $response['message'] = 'Meeting not found';
            } else {
                $meeting = $res->fetch_assoc();
                if ($meeting['organizer_id'] != $user_id && $role !== 'admin') {
                    $response['message'] = 'Permission denied';
                } else {
                    $stmt2 = $mysqli->prepare("DELETE FROM meetings WHERE id=?");
                    $stmt2->bind_param("i", $meeting_id);
                    $response = $stmt2->execute()
                        ? ['success' => true, 'message' => 'Meeting deleted successfully']
                        : ['success' => false, 'message' => 'Error deleting meeting'];
                }
            }
        }
        break;

    default:
        $response['message'] = 'Invalid action';
        break;
}

echo json_encode($response);
exit;
