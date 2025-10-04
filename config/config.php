<?php
$dbhost = "localhost";
$dbuser = "root";
$dbpass = "";
$dbname = "hr_system";

$mysqli = new mysqli($dbhost, $dbuser, $dbpass, $dbname);

if ($mysqli->connect_errno) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database Connection Failed: ' . $mysqli->connect_error
    ]);
    exit();
}
?>
