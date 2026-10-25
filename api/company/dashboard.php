
<?php

require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/auth.php';

$user = requireRole('Company');

try {
    // Find the logged-in company's ID
    $stmt = $pdo->prepare(
        'SELECT company_id
         FROM company
         WHERE user_id = ?'
    );
    $stmt->execute([$user['user_id']]);
    $companyId = $stmt->fetchColumn();

    if (!$companyId) {
        jsonResponse(404, [
            'success' => false,
            'message' => 'Company profile not found.'
        ]);
    }

    // Count internships belonging to this company
    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM internship
         WHERE company_id = ?'
    );
    $stmt->execute([$companyId]);
    $internshipCount = (int) $stmt->fetchColumn();

    // Count applications to this company's internships
    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM application a
         JOIN internship i
           ON i.internship_id = a.internship_id
         WHERE i.company_id = ?'
    );
    $stmt->execute([$companyId]);
    $applicationCount = (int) $stmt->fetchColumn();

    jsonResponse(200, [
        'success' => true,
        'data' => [
            'company_id' => (int) $companyId,
            'total_internships' => $internshipCount,
            'total_applications' => $applicationCount
        ]
    ]);

} catch (PDOException $e) {
    jsonResponse(500, [
        'success' => false,
        'message' => 'A database error occurred.'
    ]);
}
