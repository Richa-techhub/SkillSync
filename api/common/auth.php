<?php
require_once __DIR__ . '/response.php';
function requireLogin(): array {
    if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
        jsonResponse(401, ['success' => false, 'message' => 'Authentication required']);
    }
    return ['user_id' => $_SESSION['user_id'], 'role' => $_SESSION['role']];
}
function requireRole(string $role): array {
    $user = requireLogin();
    if (strtolower((string)$user['role']) !== strtolower($role)) {
        jsonResponse(403, ['success' => false, 'message' => 'Access denied']);
    }
    return $user;
}
