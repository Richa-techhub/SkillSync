
<?php
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/auth.php';

requireRole('Student');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed'
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
            COALESCE(i.min_cgpa, 0.00) AS min_cgpa,
            i.start_date,
            i.deadline,
            i.status
         FROM internship i
         JOIN company c ON c.company_id = i.company_id
         WHERE LOWER(i.status) = 'open'
         ORDER BY i.deadline ASC, i.internship_id DESC"
    );

    jsonResponse(200, [
        'success' => true,
        'internships' => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);

} catch (PDOException $e) {
    error_log('Student internships API error: ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'Database error while retrieving internships'
    ]);
}
