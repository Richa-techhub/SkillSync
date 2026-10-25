<?php
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/auth.php';

$user = requireRole('Company');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}

try {
    // Find the company profile for the logged-in user.
    $companyStmt = $pdo->prepare(
        'SELECT company_id FROM company WHERE user_id = ?'
    );
    $companyStmt->execute([$user['user_id']]);
    $company = $companyStmt->fetch(PDO::FETCH_ASSOC);

    if (!$company) {
        jsonResponse(404, [
            'success' => false,
            'message' => 'Company profile not found'
        ]);
    }

    // Return applicants only for internships owned by this company.
    $stmt = $pdo->prepare(
        "SELECT
            a.application_id,
            a.student_id,
            s.name AS student_name,
            s.department,
            s.year,
            s.CGPA,
            ua.email AS student_email,
            i.internship_id,
            i.title AS internship_title,
            a.application_date,
            a.status,
            a.resume,
            a.cover_letter
         FROM application a
         JOIN student s
            ON a.student_id = s.student_id
         JOIN user_account ua
            ON s.user_id = ua.user_id
         JOIN internship i
            ON a.internship_id = i.internship_id
         WHERE i.company_id = ?
         ORDER BY a.application_date DESC, a.application_id DESC"
    );

    $stmt->execute([$company['company_id']]);

    jsonResponse(200, [
        'success' => true,
        'applicants' => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);

} catch (PDOException $e) {
    error_log('Company applicants API error: ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'Database error while retrieving applicants'
    ]);
}\
