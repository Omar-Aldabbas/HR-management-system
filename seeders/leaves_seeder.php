<?php
require_once __DIR__ . '/../config/config.php';

$leaves = [
    [5, 'vacation', '2025-10-10', '2025-10-15', 'approved', '2025-10-01 09:00:00', 6, 'Approved for family vacation', '2025-10-02 10:00:00'],
    [6, 'sick', '2025-10-03', '2025-10-05', 'approved', '2025-10-02 08:30:00', 7, 'Get well soon', '2025-10-02 09:30:00'],
    [7, 'casual', '2025-10-12', '2025-10-13', 'pending', '2025-10-04 12:00:00', NULL, NULL, NULL],
    [8, 'other', '2025-10-07', '2025-10-07', 'rejected', '2025-10-05 10:00:00', 6, 'Request denied due to workload', '2025-10-05 15:00:00'],
    [5, 'sick', '2025-11-02', '2025-11-04', 'pending', '2025-10-10 08:00:00', NULL, NULL, NULL],
    [6, 'vacation', '2025-11-15', '2025-11-20', 'approved', '2025-10-08 11:00:00', 5, 'Enjoy your vacation', '2025-10-09 09:00:00'],
    [7, 'sick', '2025-10-20', '2025-10-22', 'approved', '2025-10-18 07:30:00', 6, 'Approved for medical reason', '2025-10-18 09:00:00'],
    [8, 'vacation', '2025-11-01', '2025-11-05', 'approved', '2025-10-12 10:00:00', 7, 'Enjoy your trip', '2025-10-13 08:45:00'],
    [5, 'casual', '2025-12-01', '2025-12-02', 'pending', '2025-10-20 09:00:00', NULL, NULL, NULL],
    [6, 'other', '2025-12-10', '2025-12-11', 'rejected', '2025-10-21 08:00:00', 7, 'Not approved due to team shortage', '2025-10-21 12:00:00'],
    [7, 'vacation', '2025-10-25', '2025-10-30', 'approved', '2025-10-18 09:00:00', 5, 'Approved for rest period', '2025-10-18 10:00:00'],
    [8, 'sick', '2025-10-14', '2025-10-16', 'approved', '2025-10-13 08:15:00', 6, 'Approved sick leave', '2025-10-13 09:00:00'],
    [5, 'vacation', '2025-11-22', '2025-11-26', 'approved', '2025-10-20 09:00:00', 6, 'Approved for travel', '2025-10-21 10:00:00'],
    [6, 'casual', '2025-10-19', '2025-10-19', 'approved', '2025-10-18 14:00:00', 5, 'Approved', '2025-10-18 15:00:00'],
    [7, 'sick', '2025-11-03', '2025-11-04', 'pending', '2025-10-25 10:30:00', NULL, NULL, NULL],
    [8, 'vacation', '2025-12-20', '2025-12-25', 'pending', '2025-10-28 08:30:00', NULL, NULL, NULL],
];

$stmt = $mysqli->prepare("
    INSERT INTO leaves (user_id, type, start_date, end_date, status, applied_at, approved_by, action_message, action_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
");

foreach ($leaves as $l) {
    [$user_id, $type, $start_date, $end_date, $status, $applied_at, $approved_by, $action_message, $action_date] = $l;
    $stmt->bind_param("isssssiss", $user_id, $type, $start_date, $end_date, $status, $applied_at, $approved_by, $action_message, $action_date);
    $stmt->execute();
}

$stmt->close();
$mysqli->close();

echo "Leaves table seeded successfully.";
