<?php
require_once __DIR__ . '/../config/config.php';

$meetings = [
    [7, 'Kickoff Meeting', 'Introduction and overview of upcoming quarter objectives.', '2025-10-06 09:00:00', '2025-10-06 10:30:00', '1,2,3,4', '2025-10-04 21:00:00'],
    [7, 'Weekly Sync', 'Progress updates, challenges, and planning for the week ahead.', '2025-10-07 09:00:00', '2025-10-07 09:45:00', '1,2,3,4', '2025-10-04 21:00:00'],
    [7, 'Project Brainstorm', 'Brainstorming session for the new system automation project.', '2025-10-08 14:00:00', '2025-10-08 15:30:00', '1,2,3,4', '2025-10-04 21:00:00'],
    [7, 'Midweek Check-In', 'Reviewing midweek task status and resolving blockers.', '2025-10-09 10:00:00', '2025-10-09 10:45:00', '1,2,3,4', '2025-10-04 21:00:00'],
    [7, 'Performance Review', 'Weekly performance review and feedback discussion.', '2025-10-10 11:00:00', '2025-10-10 12:00:00', '1,2,3,4', '2025-10-04 21:00:00'],
    [7, 'Team Coordination', 'Team collaboration and coordination for upcoming projects.', '2025-10-11 09:30:00', '2025-10-11 10:30:00', '1,2,3,4', '2025-10-04 21:00:00'],
    [7, 'End of Week Wrap-Up', 'Summary of week’s accomplishments and planning for next week.', '2025-10-12 15:00:00', '2025-10-12 16:00:00', '1,2,3,4', '2025-10-04 21:00:00'],
    [7, 'Client Feedback Discussion', 'Analyzing client feedback and improvement plans.', '2025-10-13 13:00:00', '2025-10-13 14:30:00', '1,2,3,4', '2025-10-04 21:00:00'],
    [7, 'Tech Updates', 'Discussing technical updates and workflow improvements.', '2025-10-14 10:30:00', '2025-10-14 11:30:00', '1,2,3,4', '2025-10-04 21:00:00'],
    [7, 'Monthly Wrap-Up', 'Final review of all tasks, performance, and next month’s goals.', '2025-10-31 09:00:00', '2025-10-31 10:30:00', '1,2,3,4', '2025-10-04 21:00:00']
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

echo "Meetings table seeded successfully with manager ID 7 and employees 1,2,3,4 🎯";
