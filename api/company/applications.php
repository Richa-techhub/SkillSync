
<?php
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/auth.php';

$user = requireRole('Company');

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}

try {
    // Find the company belonging to the logged-in user.
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

    $companyId = (int) $company['company_id'];

    // GET: View applications for this company's internships.
    if ($method === 'GET') {
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
             ORDER BY a.application_date DESC,
                      a.application_id DESC"
        );

        $stmt->execute([$companyId]);

        jsonResponse(200, [
            'success' => true,
            'applications' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    // POST: Update an application's status.
    $data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($data)) {
        jsonResponse(400, [
            'success' => false,
            'message' => 'Invalid JSON request body'
        ]);
    }

    // Validate the session CSRF token.
    $csrfToken = $data['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $sessionToken = $_SESSION['csrf_token'] ?? '';

    if (
        !is_string($csrfToken) ||
        !is_string($sessionToken) ||
        $sessionToken === '' ||
        !hash_equals($sessionToken, $csrfToken)
    ) {
        jsonResponse(403, [
            'success' => false,
            'message' => 'Invalid or missing CSRF token'
        ]);
    }

    $applicationId = filter_var(
        $data['application_id'] ?? null,
        FILTER_VALIDATE_INT
    );

    $status = $data['status'] ?? '';

    $allowedStatuses = [
        'Pending',
        'Shortlisted',
        'Accepted',
        'Rejected'
    ];

    if (
        !$applicationId ||
        $applicationId < 1 ||
        !is_string($status) ||
        !in_array($status, $allowedStatuses, true)
    ) {
        jsonResponse(400, [
            'success' => false,
            'message' => 'Provide a valid application_id and status'
        ]);
    }

    // Confirm the application belongs to this company's internship.
    $checkStmt = $pdo->prepare(
        "SELECT a.application_id
         FROM application a
         JOIN internship i
            ON a.internship_id = i.internship_id
         WHERE a.application_id = ?
           AND i.company_id = ?"
    );
    $checkStmt->execute([$applicationId, $companyId]);

    if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
        jsonResponse(404, [
            'success' => false,
            'message' => 'Application not found for this company'
        ]);
    }

    $updateStmt = $pdo->prepare(
        'UPDATE application
         SET status = ?
         WHERE application_id = ?'
    );
    $updateStmt->execute([$status, $applicationId]);

    jsonResponse(200, [
        'success' => true,
        'message' => 'Application status updated successfully',
        'application_id' => $applicationId,
        'status' => $status
    ]);

} catch (PDOException $e) {
    error_log('Company applications API error: ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'Database error while processing applications'
    ]);
}
