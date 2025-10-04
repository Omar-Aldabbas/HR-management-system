<?php
require_once __DIR__ . '/../config/config.php';

$expenses = [
    [5, 1500.00, 'Server maintenance tools and licenses', 'approved', 4, '2025-10-01 09:00:00'],
    [6, 800.00, 'Team building lunch', 'approved', 4, '2025-10-02 10:00:00'],
    [7, 2500.00, 'Client entertainment expenses', 'approved', 4, '2025-10-03 12:00:00'],
    [8, 600.00, 'Software subscription renewal', 'pending', NULL, '2025-10-04 11:00:00'],
    [5, 900.00, 'Network equipment upgrade', 'pending', NULL, '2025-10-05 08:00:00'],
    [6, 400.00, 'Printing HR forms and materials', 'approved', 4, '2025-10-06 09:00:00'],
    [7, 1200.00, 'Sales event materials', 'approved', 4, '2025-10-07 10:00:00'],
    [8, 350.00, 'Office snacks and coffee supplies', 'approved', 4, '2025-10-08 08:00:00'],
    [5, 2000.00, 'Security software purchase', 'approved', 4, '2025-10-09 09:30:00'],
    [6, 700.00, 'Training course fees for staff', 'pending', NULL, '2025-10-10 10:00:00'],
    [7, 1800.00, 'Travel expenses for client visit', 'approved', 4, '2025-10-11 11:00:00'],
    [8, 500.00, 'UI design tool subscription', 'approved', 4, '2025-10-12 12:00:00'],
    [5, 1000.00, 'Backup server electricity cost', 'pending', NULL, '2025-10-13 08:30:00'],
    [6, 950.00, 'Office supplies purchase', 'approved', 4, '2025-10-14 09:45:00'],
    [7, 2100.00, 'Conference participation fee', 'approved', 4, '2025-10-15 08:15:00'],
    [8, 400.00, 'Software plugin update', 'pending', NULL, '2025-10-16 10:00:00'],
    [5, 1250.00, 'IT training course for team', 'approved', 4, '2025-10-17 09:00:00'],
    [6, 600.00, 'Recruitment campaign advertising', 'approved', 4, '2025-10-18 08:30:00'],
    [7, 2750.00, 'Sales roadshow materials', 'approved', 4, '2025-10-19 10:00:00'],
    [8, 550.00, 'Laptop repair service', 'approved', 4, '2025-10-20 11:00:00'],
    [5, 1700.00, 'Firewall software renewal', 'approved', 4, '2025-10-21 08:00:00'],
    [6, 880.00, 'HR documentation printing', 'pending', NULL, '2025-10-22 09:00:00'],
    [7, 1900.00, 'Team sales dinner', 'approved', 4, '2025-10-23 12:00:00'],
    [8, 620.00, 'New headphones for developers', 'approved', 4, '2025-10-24 10:00:00'],
    [5, 1400.00, 'Server room cooling maintenance', 'approved', 4, '2025-10-25 09:00:00'],
    [6, 720.00, 'Employee engagement gifts', 'approved', 4, '2025-10-26 08:30:00'],
    [7, 3100.00, 'Promotional banner printing', 'approved', 4, '2025-10-27 10:00:00'],
    [8, 450.00, 'Domain renewal fees', 'approved', 4, '2025-10-28 08:45:00'],
    [5, 1950.00, 'Backup system license upgrade', 'approved', 4, '2025-10-29 09:30:00'],
    [6, 680.00, 'Workstation cleaning supplies', 'pending', NULL, '2025-10-30 09:00:00'],
    [7, 2300.00, 'Client travel and accommodation', 'approved', 4, '2025-10-31 08:00:00'],
    [8, 750.00, 'Code review software purchase', 'approved', 4, '2025-11-01 09:00:00'],
];

$stmt = $mysqli->prepare("
    INSERT INTO expenses (user_id, amount, reason, status, approved_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
");

foreach ($expenses as $e) {
    [$user_id, $amount, $reason, $status, $approved_by, $created_at] = $e;
    $stmt->bind_param("idssis", $user_id, $amount, $reason, $status, $approved_by, $created_at);
    $stmt->execute();
}

$stmt->close();
$mysqli->close();

echo "Expenses table seeded successfully.";
