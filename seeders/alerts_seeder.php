<?php
require_once __DIR__ . '/../config/config.php';

$alerts = [
    [7, 'Monthly sales target has been updated. Please review the new quota.', '5,4,8', 3, 'Sales', '2025-10-01 09:00:00'],
    [4, 'Company holiday announced for next Friday.', '5,7,8', 3, 'All', '2025-10-02 10:00:00'],
    [7, 'Reminder: Submit client reports by EOD.', '5,4,8', 3, 'Sales', '2025-10-03 08:30:00'],
    [4, 'New HR policy update available on the portal.', '5,7,8', 3, 'HR', '2025-10-04 09:45:00'],
    [7, 'Sales meeting scheduled for Monday at 10 AM.', '5,4,8', 3, 'Sales', '2025-10-05 11:15:00'],
    [4, 'Performance review cycle starts next week.', '5,7,8', 3, 'All', '2025-10-06 08:00:00'],
    [7, 'Important: Client visit preparation required.', '5,4,8', 3, 'Sales', '2025-10-07 09:00:00'],
    [4, 'Training session for new policies tomorrow.', '5,7,8', 3, 'HR', '2025-10-08 10:30:00'],
    [7, 'Quarterly results presentation on Friday.', '5,4,8', 3, 'Sales', '2025-10-09 11:00:00'],
    [4, 'Work-from-home forms must be updated.', '5,7,8', 3, 'HR', '2025-10-10 08:30:00'],
];

$alertStmt = $mysqli->prepare("
    INSERT INTO alerts (sender_id, sender_role, department, message, alert_date)
    VALUES (?, ?, ?, ?, ?)
");

$recipientStmt = $mysqli->prepare("
    INSERT INTO alert_recipients (alert_id, user_id, read_status)
    VALUES (?, ?, ?)
");

$logStmt = $mysqli->prepare("
    INSERT INTO alerts_log (sender_id, message, recipients, recipients_count, department, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
");

foreach ($alerts as $alert) {
    [$sender_id, $message, $recipients, $recipients_count, $department, $created_at] = $alert;

    $sender_role = $sender_id == 4 ? 'hr_manager' : 'manager';

    $alertStmt->bind_param("issss", $sender_id, $sender_role, $department, $message, $created_at);
    $alertStmt->execute();
    $alert_id = $mysqli->insert_id;

    $recipient_ids = explode(',', $recipients);
    foreach ($recipient_ids as $user_id) {
        $read_status = 0;
        $recipientStmt->bind_param("iii", $alert_id, $user_id, $read_status);
        $recipientStmt->execute();
    }

    $logStmt->bind_param("ississ", $sender_id, $message, $recipients, $recipients_count, $department, $created_at);
    $logStmt->execute();
}

$alertStmt->close();
$recipientStmt->close();
$logStmt->close();
$mysqli->close();

echo "Alerts, alert_recipients, and alerts_log tables seeded successfully.";
