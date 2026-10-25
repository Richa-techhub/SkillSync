
<?php
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/auth.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Admin-only access
$user = requireRole('Admin');

if ($method !== 'GET') {
    header('Allow: GET');
    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed. Use GET.'
    ]);
}

try {
    $stmt = $pdo->query(
        "SELECT
            s.student_id,
            s.user_id,
            s.name,
            s.phone,
            s.department,
            s.year,
            s.CGPA,
            s.resume,
            u.email,
            u.account_status,
            u.created_at
         FROM student s
         INNER JOIN user_account u
            ON s.user_id = u.user_id
         ORDER BY s.student_id DESC"
    );

    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(200, [
        'success' => true,
        'message' => 'Students retrieved successfully.',
        'data' => $students
    ]);
} catch (PDOException $e) {
    error_log('Admin students API error: ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'Unable to retrieve students.'
    ]);
}
