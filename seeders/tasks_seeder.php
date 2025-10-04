<?php
require_once __DIR__ . '/../config/config.php';

$tasks = [
    [5, 'System Backup', 'Perform full server backup and verify integrity.', 'finished', 'high', '2025-10-05', '2025-10-01 08:00:00', '2025-10-02 10:00:00'],
    [6, 'Employee Evaluation', 'Complete Q3 performance reviews for all HR staff.', 'in_progress', 'medium', '2025-10-10', '2025-10-02 09:00:00', '2025-10-03 11:00:00'],
    [7, 'Client Meeting', 'Prepare and lead sales presentation for new client.', 'pending', 'high', '2025-10-08', '2025-10-03 12:00:00', '2025-10-04 10:00:00'],
    [8, 'Bug Fixes', 'Resolve reported UI and API bugs in HR portal.', 'in_progress', 'high', '2025-10-09', '2025-10-04 08:30:00', '2025-10-05 09:30:00'],
    [5, 'Security Audit', 'Conduct full system security scan and patch vulnerabilities.', 'pending', 'high', '2025-10-12', '2025-10-05 10:00:00', '2025-10-06 10:00:00'],
    [6, 'Recruitment Campaign', 'Post new job ads and start shortlisting candidates.', 'in_progress', 'medium', '2025-10-15', '2025-10-06 08:00:00', '2025-10-07 08:00:00'],
    [7, 'Sales Report Q3', 'Compile and submit Q3 sales report to management.', 'finished', 'medium', '2025-10-04', '2025-10-01 09:30:00', '2025-10-02 09:30:00'],
    [8, 'New Feature Design', 'Design UI mockups for the payroll module.', 'pending', 'high', '2025-10-18', '2025-10-08 09:00:00', '2025-10-08 12:00:00'],
    [5, 'System Maintenance', 'Perform scheduled maintenance on production servers.', 'in_progress', 'high', '2025-10-20', '2025-10-09 08:00:00', '2025-10-10 09:00:00'],
    [6, 'Policy Update', 'Review and update HR leave policies.', 'pending', 'low', '2025-10-25', '2025-10-10 10:00:00', '2025-10-11 08:00:00'],
    [7, 'Market Analysis', 'Analyze competitor performance and trends.', 'in_progress', 'medium', '2025-10-22', '2025-10-12 09:00:00', '2025-10-13 09:00:00'],
    [8, 'Testing Automation', 'Set up automated test scripts for main modules.', 'pending', 'high', '2025-10-30', '2025-10-14 08:00:00', '2025-10-15 08:00:00'],
    [5, 'System Optimization', 'Improve database query efficiency by 15%.', 'pending', 'high', '2025-10-28', '2025-10-16 09:00:00', '2025-10-17 09:00:00'],
    [6, 'Training Session', 'Organize employee soft skills training.', 'finished', 'medium', '2025-10-10', '2025-10-05 08:00:00', '2025-10-06 08:00:00'],
    [7, 'Client Follow-ups', 'Follow up with all leads from the October fair.', 'pending', 'high', '2025-10-25', '2025-10-18 10:00:00', '2025-10-19 08:00:00'],
    [8, 'UI Enhancements', 'Improve dashboard responsiveness and layout.', 'in_progress', 'medium', '2025-10-22', '2025-10-18 09:00:00', '2025-10-19 10:00:00'],
];

$stmt = $mysqli->prepare("
    INSERT INTO tasks (user_id, title, description, status, priority, deadline, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");

foreach ($tasks as $t) {
    [$user_id, $title, $description, $status, $priority, $deadline, $created_at, $updated_at] = $t;
    $stmt->bind_param("isssssss", $user_id, $title, $description, $status, $priority, $deadline, $created_at, $updated_at);
    $stmt->execute();
}

$stmt->close();
$mysqli->close();

echo "Tasks table seeded successfully.";
