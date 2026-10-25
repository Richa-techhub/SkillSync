
<?php
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/auth.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method !== 'POST') {
    header('Allow: POST');
    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]);
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (stripos($contentType, 'application/json') !== 0) {
    jsonResponse(415, [
        'success' => false,
        'message' => 'Content-Type must be application/json.'
    ]);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Invalid JSON request.'
    ]);
}

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Email and password are required.'
    ]);
}

try {
    $stmt = $pdo->prepare(
        'SELECT user_id, email, password_hash, role, account_status
         FROM user_account
         WHERE email = ?
         LIMIT 1'
    );

    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(401, [
            'success' => false,
            'message' => 'Invalid email or password.'
        ]);
    }

    if (strcasecmp($user['account_status'], 'Active') !== 0) {
        jsonResponse(403, [
            'success' => false,
            'message' => 'Your account is not active.'
        ]);
    }

    session_regenerate_id(true);

    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

    jsonResponse(200, [
        'success' => true,
        'message' => 'Login successful.',
        'data' => [
            'user_id' => $user['user_id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'csrf_token' => $_SESSION['csrf_token']
        ]
    ]);

} catch (PDOException $e) {
    error_log('Login API error: ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'An internal server error occurred.'
    ]);
}
