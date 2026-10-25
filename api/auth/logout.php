
<?php
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]);
}

$user = requireLogin();

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input) || empty($input['csrf_token'])) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'CSRF token is required.'
    ]);
}

if (
    empty($_SESSION['csrf_token']) ||
    !is_string($input['csrf_token']) ||
    !hash_equals($_SESSION['csrf_token'], $input['csrf_token'])
) {
    jsonResponse(403, [
        'success' => false,
        'message' => 'Invalid CSRF token.'
    ]);
}

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();

    setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => $params['path'],
        'domain' => $params['domain'],
        'secure' => $params['secure'],
        'httponly' => $params['httponly'],
        'samesite' => $params['samesite'] ?? 'Lax'
    ]);
}

session_destroy();

jsonResponse(200, [
    'success' => true,
    'message' => 'Logout successful.'
]);
