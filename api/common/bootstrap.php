<?php
require_once __DIR__ . '/cors.php';
// Adapt this file to reuse your existing database connection.
// Expected: a PDO instance stored in $pdo.
header('Content-Type: application/json; charset=utf-8');
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

// Update the path below if your project uses a different database config.
// Do not put database credentials in a publicly accessible API file.
$configPath = dirname(__DIR__, 2) . '/config/database.php';
if (is_file($configPath)) {
    require_once $configPath;
}
// If your existing config creates a differently named connection variable,
// assign it to $pdo here. Example: $pdo = $conn; (only if $conn is PDO).
if (!isset($pdo) || !($pdo instanceof PDO)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection is not configured for this API. Adapt api/common/bootstrap.php to your existing connection.'
    ]);
    exit;
}
