<?php
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => false,
    'cookie_samesite' => 'Strict'
]);

include 'config/config.php';


if (isset($_SESSION['user_id'])) {
    $session_id = session_id();

    $stmt = $mysqli->prepare("DELETE FROM sessions WHERE session_id=?");
    $stmt->bind_param("s", $session_id);
    $stmt->execute();

    // destroy session
    $_SESSION = [];
    session_unset();
    session_destroy();
}

header("Location: login.php");
exit();
?>
