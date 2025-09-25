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
header('Content-Type: application/json');

include '../config/config.php';

$response = ['success' => false, 'message' => 'Invalid request'];

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in', 'redirect' => 'auth.html']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

$user_id = $_SESSION['user_id'];

if ($action === 'list') {
    $stmt = $mysqli->prepare("SELECT id, title, description, status, deadline FROM tasks WHERE user_id=? ORDER BY id DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $tasks = [];
    while ($row = $result->fetch_assoc()) {
        $tasks[] = $row;
    }

    $response = ['success' => true, 'tasks' => $tasks];
}

if ($action === 'add') {
    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $deadline = $input['deadline'] ?? null;

    if (!$title) {
        $response['message'] = 'Title is required';
    } else {
        $stmt = $mysqli->prepare("INSERT INTO tasks (user_id, title, description, deadline) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("isss", $user_id, $title, $description, $deadline);
        if ($stmt->execute()) {
            $response = ['success' => true, 'message' => 'Task added'];
        } else {
            $response['message'] = 'Error adding task';
        }
    }
}

if ($action === 'update') {
    $task_id = $input['task_id'] ?? 0;
    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $status = $input['status'] ?? '';
    $deadline = $input['deadline'] ?? null;

    $stmt = $mysqli->prepare("UPDATE tasks SET title=?, description=?, status=?, deadline=? WHERE id=? AND user_id=?");
    $stmt->bind_param("ssssii", $title, $description, $status, $deadline, $task_id, $user_id);
    if ($stmt->execute()) {
        $response = ['success' => true, 'message' => 'Task updated'];
    } else {
        $response['message'] = 'Error updating task';
    }
}

if ($action === 'delete') {
    $task_id = $input['task_id'] ?? 0;

    $stmt = $mysqli->prepare("DELETE FROM tasks WHERE id=? AND user_id=?");
    $stmt->bind_param("ii", $task_id, $user_id);
    if ($stmt->execute()) {
        $response = ['success' => true, 'message' => 'Task deleted'];
    } else {
        $response['message'] = 'Error deleting task';
    }
}

echo json_encode($response);
?>
