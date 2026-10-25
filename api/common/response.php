<?php
declare(strict_types=1);

function jsonResponse(int $status, array $body): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        $body,
        JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

function requestData(): array {
    $raw = file_get_contents('php://input');

    if ($raw === '' || $raw === false) {
        return [];
    }

    $data = json_decode($raw, true);

    if (!is_array($data)) {
        jsonResponse(400, [
            'success' => false,
            'message' => 'Body must be valid JSON.'
        ]);
    }

    return $data;
}

function requireMethod(array $allowed): void {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    if (!in_array($method, $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        jsonResponse(405, [
            'success' => false,
            'message' => 'Method not allowed.'
        ]);
    }
}

function requireCsrf(): void {
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $expected = $_SESSION['csrf_token'] ?? '';

    if (
        !is_string($sent) ||
        !is_string($expected) ||
        $sent === '' ||
        $expected === '' ||
        !hash_equals($expected, $sent)
    ) {
        jsonResponse(403, [
            'success' => false,
            'message' => 'Missing or invalid CSRF token. Log in again and send X-CSRF-Token.'
        ]);
    }
}

function dbError(Throwable $e, string $context = 'API'): void {
    error_log('SkillSync ' . $context . ': ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'A server/database error occurred. Check the XAMPP PHP error log.'
    ]);
}
