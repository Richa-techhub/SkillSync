<?php
header('Content-Type: application/json; charset=utf-8');
if (isset($_GET['db']) && $_GET['db'] === '1') {
    require_once __DIR__ . '/common/bootstrap.php';
    try {
        $pdo->query('SELECT 1');
        echo json_encode(['success' => true, 'message' => 'API and database connection are working']);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database check failed']);
    }
    exit;
}
echo json_encode(['success' => true, 'message' => 'SkillSync API is running']);
