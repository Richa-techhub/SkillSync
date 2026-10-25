
<?php

require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/auth.php';

$user = requireRole('Company');

try {
    // Find the company linked to the logged-in account
    $stmt = $pdo->prepare(
        'SELECT company_id, company_name, phone, website, location, industry
         FROM company
         WHERE user_id = ?'
    );
    $stmt->execute([$user['user_id']]);
    $company = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$company) {
        jsonResponse(404, [
            'success' => false,
            'message' => 'Company profile not found.'
        ]);
    }

    // GET: Return the company profile
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        jsonResponse(200, [
            'success' => true,
            'data' => $company
        ]);
    }

    // PUT: Update the company profile
    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'Invalid JSON request body.'
            ]);
        }

        $allowedFields = [
            'company_name',
            'phone',
            'website',
            'location',
            'industry'
        ];

        $updates = [];
        $values = [];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $input)) {
                $value = $input[$field];

                if ($value !== null && !is_string($value)) {
                    jsonResponse(400, [
                        'success' => false,
                        'message' => "Field '$field' must be a string or null."
                    ]);
                }

                $updates[] = "$field = ?";
                $values[] = $value;
            }
        }

        if (empty($updates)) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'No valid profile fields provided.'
            ]);
        }

        $values[] = $user['user_id'];

        $sql = 'UPDATE company SET ' . implode(', ', $updates)
             . ' WHERE user_id = ?';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        // Fetch the updated profile
        $stmt = $pdo->prepare(
            'SELECT company_id, company_name, phone, website, location, industry
             FROM company
             WHERE user_id = ?'
        );
        $stmt->execute([$user['user_id']]);

        jsonResponse(200, [
            'success' => true,
            'message' => 'Company profile updated successfully.',
            'data' => $stmt->fetch(PDO::FETCH_ASSOC)
        ]);
    }

    header('Allow: GET, PUT');

    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed.'
    ]);

} catch (PDOException $e) {
    jsonResponse(500, [
        'success' => false,
        'message' => 'A database error occurred.'
    ]);
}
