
<?php
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/auth.php';

$user = requireLogin();

$stmt = $pdo->prepare(
    'SELECT user_id, email, role, account_status
     FROM user_account
     WHERE user_id = ?
     LIMIT 1'
);
$stmt->execute([(int) $user['user_id']]);
$account = $stmt->fetch();

if (!$account || $account['account_status'] !== 'Active') {
    $_SESSION = [];
    session_destroy();

    jsonResponse(401, [
        'success' => false,
        'message' => 'Session is no longer valid.'
    ]);
}

$data = [
    'user_id' => (int) $account['user_id'],
    'email' => $account['email'],
    'role' => $account['role']
];

if ($account['role'] === 'Student') {
    $stmt = $pdo->prepare(
        'SELECT student_id, name, phone, department, year, CGPA, resume
         FROM student
         WHERE user_id = ?
         LIMIT 1'
    );
    $stmt->execute([(int) $account['user_id']]);
    $profile = $stmt->fetch();

    if ($profile) {
        $data['profile'] = $profile;
    }
} elseif ($account['role'] === 'Company') {
    $stmt = $pdo->prepare(
        'SELECT company_id, company_name, phone, website, location, industry
         FROM company
         WHERE user_id = ?
         LIMIT 1'
    );
    $stmt->execute([(int) $account['user_id']]);
    $profile = $stmt->fetch();

    if ($profile) {
        $data['profile'] = $profile;
    }
} elseif ($account['role'] === 'Admin') {
    $stmt = $pdo->prepare(
        'SELECT admin_id, name
         FROM admin
         WHERE user_id = ?
         LIMIT 1'
    );
    $stmt->execute([(int) $account['user_id']]);
    $profile = $stmt->fetch();

    if ($profile) {
        $data['profile'] = $profile;
    }
}

jsonResponse(200, [
    'success' => true,
    'message' => 'Authenticated user retrieved successfully.',
    'data' => $data
]);
