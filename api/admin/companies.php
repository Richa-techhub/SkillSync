
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
            c.company_id,
            c.user_id,
            c.company_name,
            c.phone,
            c.website,
            c.location,
            c.industry,
            u.email,
            u.account_status,
            u.created_at
         FROM company c
         INNER JOIN user_account u
            ON c.user_id = u.user_id
         ORDER BY c.company_id DESC"
    );

    $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(200, [
        'success' => true,
        'message' => 'Companies retrieved successfully.',
        'data' => $companies
    ]);
} catch (PDOException $e) {
    error_log('Admin companies API error: ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'Unable to retrieve companies.'
    ]);
}
