
<?php

require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/auth.php';

$user = requireRole('Admin');

try {
    $queries = [
        'total_students' => "
            SELECT COUNT(*) FROM student s
            INNER JOIN user_account u ON s.user_id = u.user_id
            WHERE u.account_status = 'Active'
        ",
        'total_companies' => "
            SELECT COUNT(*) FROM company c
            INNER JOIN user_account u ON c.user_id = u.user_id
            WHERE u.account_status = 'Active'
        ",
        'total_internships' => "
            SELECT COUNT(*) FROM internship
        ",
        'open_internships' => "
            SELECT COUNT(*) FROM internship WHERE status = 'Open'
        ",
        'total_applications' => "
            SELECT COUNT(*) FROM application
        ",
        'pending_applications' => "
            SELECT COUNT(*) FROM application WHERE status = 'Pending'
        ",
        'total_interviews' => "
            SELECT COUNT(*) FROM interview
        "
    ];

    $data = [];

    foreach ($queries as $key => $sql) {
        $data[$key] = (int) $pdo->query($sql)->fetchColumn();
    }

    jsonResponse(200, [
        'success' => true,
        'message' => 'Admin dashboard statistics retrieved successfully.',
        'data' => $data
    ]);

} catch (PDOException $e) {
    error_log('Admin dashboard API error: ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'Unable to retrieve admin dashboard statistics.'
    ]);
}
