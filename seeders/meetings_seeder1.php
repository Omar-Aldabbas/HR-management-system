<?php
require_once __DIR__ . '/../config/config.php';

$meetings = [
    [7, 'Weekly Sales Review', 'Reviewing last week’s sales numbers and setting targets for the next week.', '2025-10-06 09:00:00', '2025-10-06 10:00:00', '4,5,6,8', '2025-10-04 20:00:00'],
    [7, 'Client Strategy Session', 'Discussing preparation for upcoming client pitch and project updates.', '2025-10-07 14:00:00', '2025-10-07 15:30:00', '4,5,8', '2025-10-04 20:00:00'],
    [7, 'Monthly HR Coordination', 'HR updates, training plans, and staff performance discussion.', '2025-10-08 11:00:00', '2025-10-08 12:00:00', '4,5,6', '2025-10-04 20:00:00'],
    [7, 'Product Launch Discussion', 'Finalize the marketing plan and rollout schedule for the new product line.', '2025-10-09 10:30:00', '2025-10-09 12:00:00', '4,5,8', '2025-10-04 20:00:00'],
    [7, 'Quarterly Planning', 'Plan department goals and strategies for the upcoming quarter.', '2025-10-10 09:30:00', '2025-10-10 11:00:00', '4,5,6,8', '2025-10-04 20:00:00'],
    [7, 'Team Building Session', 'Brainstorming and collaboration activities to boost team morale.', '2025-10-11 15:00:00', '2025-10-11 16:30:00', '4,5,6,8', '2025-10-04 20:00:00'],
    [7, 'Finance Review', 'Discussing quarterly budget and spending performance.', '2025-10-12 10:00:00', '2025-10-12 11:30:00', '4,5', '2025-10-04 20:00:00'],
    [7, 'Marketing Sync', 'Aligning marketing team with product roadmap and deadlines.', '2025-10-13 09:00:00', '2025-10-13 10:00:00', '4,8', '2025-10-04 20:00:00'],
    [7, 'Recruitment Review', 'Discussing hiring progress and onboarding plans for new employees.', '2025-10-14 13:00:00', '2025-10-14 14:00:00', '4,5,6', '2025-10-04 20:00:00'],
    [7, 'Weekly Stand-Up', 'Short check-in to review ongoing tasks and blockers.', '2025-10-15 09:00:00', '2025-10-15 09:30:00', '4,5,6,8', '2025-10-04 20:00:00'],
    [7, 'Client Follow-Up', 'Meeting to discuss client feedback and improvements.', '2025-10-16 14:00:00', '2025-10-16 15:00:00', '4,8', '2025-10-04 20:00:00'],
    [7, 'Performance Evaluation', 'Mid-month performance and KPI check.', '2025-10-17 11:00:00', '2025-10-17 12:00:00', '4,5,6,8', '2025-10-04 20:00:00'],
    [7, 'Tech Sync-Up', 'Discussing technical upgrades and bug fixes.', '2025-10-18 10:30:00', '2025-10-18 11:30:00', '5,6,8', '2025-10-04 20:00:00'],
    [7, 'Product Feedback Session', 'Collect feedback from internal teams about product usability.', '2025-10-19 13:00:00', '2025-10-19 14:00:00', '4,5,6,8', '2025-10-04 20:00:00'],
    [7, 'Leadership Check-In', 'Manager’s private session with department heads.', '2025-10-20 09:00:00', '2025-10-20 10:30:00', '4,5', '2025-10-04 20:00:00'],
    [7, 'HR & Admin Review', 'Operational meeting for internal policy review.', '2025-10-21 10:00:00', '2025-10-21 11:00:00', '4,6', '2025-10-04 20:00:00'],
    [7, 'Project Status Update', 'Tracking progress on current internal projects.', '2025-10-22 14:30:00', '2025-10-22 15:30:00', '4,5,8', '2025-10-04 20:00:00'],
    [7, 'End of Month Wrap-Up', 'Summary of all deliverables, challenges, and achievements.', '2025-10-30 15:00:00', '2025-10-30 16:30:00', '4,5,6,8', '2025-10-04 20:00:00']
];

$stmt = $mysqli->prepare("
    INSERT INTO meetings (organizer_id, title, description, start_time, end_time, participants, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");

foreach ($meetings as $meeting) {
    [$organizer_id, $title, $description, $start_time, $end_time, $participants, $created_at] = $meeting;
    $stmt->bind_param("issssss", $organizer_id, $title, $description, $start_time, $end_time, $participants, $created_at);
    $stmt->execute();
}

$stmt->close();
$mysqli->close();

echo "Meetings table seeded successfully with many meetings 🎯";
