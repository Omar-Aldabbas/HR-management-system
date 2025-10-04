<?php
require_once __DIR__ . '/../config/config.php';

$targets = [
    [7, 'Q4 Sales Goal', 'Achieve 100,000 EGP in total sales for Q4', 100000, 25000, '2025-12-31', 'in_progress', 5],
    [6, 'HR Recruitment Drive', 'Hire 5 new employees by end of year', 5, 2, '2025-12-31', 'in_progress', 5],
    [8, 'Feature Development', 'Deliver the new internal portal module', 1, 0, '2025-11-30', 'pending', 7],
    [5, 'System Optimization', 'Enhance system performance by 20%', 1, 0, '2025-12-15', 'pending', NULL],
];

$stmt = $mysqli->prepare("
    INSERT INTO targets (user_id, title, description, target_amount, achieved_amount, deadline, status, approved_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");

foreach ($targets as $t) {
    [$user_id, $title, $description, $target_amount, $achieved_amount, $deadline, $status, $approved_by] = $t;
    $stmt->bind_param("issddssi", $user_id, $title, $description, $target_amount, $achieved_amount, $deadline, $status, $approved_by);
    $stmt->execute();
}

$stmt->close();
$mysqli->close();

echo "Targets table seeded successfully.";
