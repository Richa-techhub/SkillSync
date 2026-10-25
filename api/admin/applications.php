
<?php
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/auth.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

requireRole('Admin');

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
            a.application_id,
            a.student_id,
            s.name AS student_name,
            a.internship_id,
            i.title AS internship_title,
            c.company_name,
            a.application_date,
            a.status,
            a.resume,
            a.cover_letter
         FROM application a
         INNER JOIN student s
            ON a.student_id = s.student_id
         INNER JOIN internship i
            ON a.internship_id = i.internship_id
         INNER JOIN company c
            ON i.company_id = c.company_id
         ORDER BY a.application_id DESC"
    );

    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(200, [
        'success' => true,
        'message' => 'Applications retrieved successfully.',
        'data' => $applications
    ]);
} catch (PDOException $e) {
    error_log('Admin applications API error: ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'Unable to retrieve applications.'
    ]);
}
