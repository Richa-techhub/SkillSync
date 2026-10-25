
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
            i.internship_id,
            i.company_id,
            c.company_name,
            i.title,
            i.description,
            i.location,
            i.duration,
            i.stipend,
            i.start_date,
            i.deadline,
            i.status
         FROM internship i
         INNER JOIN company c
            ON i.company_id = c.company_id
         ORDER BY i.internship_id DESC"
    );

    $internships = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(200, [
        'success' => true,
        'message' => 'Internships retrieved successfully.',
        'data' => $internships
    ]);
} catch (PDOException $e) {
    error_log('Admin internships API error: ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'Unable to retrieve internships.'
    ]);
}
