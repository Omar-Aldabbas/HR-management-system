<?php
require_once __DIR__ . '/../config/config.php';

$sales = [
    [5, 1, '2025-10-01 11:00:00', 15000.00, 'Al Futtaim Group', 'Omar Nasser', 'ERP Software Suite', 3],
    [5, 1, '2025-10-02 15:30:00', 12000.00, 'Emirates Tech', 'Hassan Ali', 'CRM Cloud Package', 2],
    [6, 2, '2025-10-01 10:00:00', 8000.00, 'Future Vision', 'Salma Youssef', 'Recruitment System', 1],
    [7, 3, '2025-10-03 16:15:00', 22000.00, 'Dubai Motors', 'Khalifa Al Said', 'Sales Tracking Platform', 4],
    [8, 1, '2025-10-04 09:45:00', 5000.00, 'Innovatech', 'Lina Adel', 'Mobile App Subscription', 10],
    [5, 2, '2025-10-05 13:20:00', 18000.00, 'TechnoHub', 'Yasser Kamal', 'Cloud Hosting Plan', 3],
    [6, 1, '2025-10-06 14:10:00', 9500.00, 'Bright Solutions', 'Mona Zayed', 'HR Portal', 1],
    [7, 2, '2025-10-06 17:40:00', 25000.00, 'SmartBuild', 'Ahmed Saad', 'Sales Dashboard Suite', 5],
    [8, 3, '2025-10-06 12:25:00', 4000.00, 'QuickServe', 'Nada Mostafa', 'Support Subscription', 8],
    [5, 1, '2025-10-06 15:30:00', 10000.00, 'NextGen Tech', 'Ziad Omar', 'Analytics Tool', 2]
];

$stmt = $mysqli->prepare("
    INSERT INTO sales (user_id, target_id, sale_date, amount, company_name, client, product_name, quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");

foreach ($sales as $s) {
    [$user_id, $target_id, $sale_date, $amount, $company_name, $client, $product_name, $quantity] = $s;
    $stmt->bind_param("iisdsssi", $user_id, $target_id, $sale_date, $amount, $company_name, $client, $product_name, $quantity);
    $stmt->execute();
}

$stmt->close();
$mysqli->close();

echo "Sales table seeded successfully.";
