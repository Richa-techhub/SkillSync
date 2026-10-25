
<?php
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/auth.php';

$user = requireRole('Company');

try {
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
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $stmt = $pdo->prepare(
            "SELECT
                internship_id,
                title,
                description,
                location,
                duration,
                stipend,
                start_date,
                deadline,
                status
             FROM internship
             WHERE company_id = ?
             ORDER BY internship_id DESC"
        );

        $stmt->execute([$companyId]);

        jsonResponse(200, [
            'success' => true,
            'internships' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        jsonResponse(400, [
            'success' => false,
            'message' => 'A valid JSON request body is required'
        ]);
    }

    if ($method === 'POST') {
        $required = [
            'title', 'description', 'location', 'duration',
            'stipend', 'start_date', 'deadline'
        ];

        foreach ($required as $field) {
            if (!isset($input[$field]) || trim((string)$input[$field]) === '') {
                jsonResponse(400, [
                    'success' => false,
                    'message' => "Missing required field: $field"
                ]);
            }
        }

        if (!is_numeric($input['stipend']) || (float)$input['stipend'] < 0) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'Stipend must be a non-negative number'
            ]);
        }

        $startDate = DateTime::createFromFormat('!Y-m-d', $input['start_date']);
        $deadline = DateTime::createFromFormat('!Y-m-d', $input['deadline']);

        if (
            !$startDate || $startDate->format('Y-m-d') !== $input['start_date'] ||
            !$deadline || $deadline->format('Y-m-d') !== $input['deadline']
        ) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'Dates must use YYYY-MM-DD format'
            ]);
        }

        $stmt = $pdo->prepare(
            "INSERT INTO internship
                (company_id, title, description, location, duration,
                 stipend, start_date, deadline, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Open')"
        );

        $stmt->execute([
            $companyId,
            trim($input['title']),
            trim($input['description']),
            trim($input['location']),
            trim($input['duration']),
            $input['stipend'],
            $input['start_date'],
            $input['deadline']
        ]);

        jsonResponse(201, [
            'success' => true,
            'message' => 'Internship created successfully',
            'internship_id' => (int)$pdo->lastInsertId()
        ]);
    }

    if ($method === 'PUT') {
        $internshipId = filter_var(
            $input['internship_id'] ?? null,
            FILTER_VALIDATE_INT
        );

        if (!$internshipId || $internshipId < 1) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'A valid internship_id is required'
            ]);
        }

        $allowed = [
            'title', 'description', 'location', 'duration',
            'stipend', 'start_date', 'deadline', 'status'
        ];

        $updates = [];
        $values = [];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $input)) {
                if (is_string($input[$field]) && trim($input[$field]) === '') {
                    jsonResponse(400, [
                        'success' => false,
                        'message' => "$field cannot be empty"
                    ]);
                }

                $updates[] = "$field = ?";
                $values[] = $input[$field];
            }
        }

        if (!$updates) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'No internship fields provided to update'
            ]);
        }

        if (
            array_key_exists('stipend', $input) &&
            (!is_numeric($input['stipend']) || (float)$input['stipend'] < 0)
        ) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'Stipend must be a non-negative number'
            ]);
        }

        if (
            array_key_exists('status', $input) &&
            !in_array($input['status'], ['Open', 'Closed', 'Completed'], true)
        ) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'Status must be Open, Closed, or Completed'
            ]);
        }

        foreach (['start_date', 'deadline'] as $field) {
            if (array_key_exists($field, $input)) {
                $date = DateTime::createFromFormat('!Y-m-d', $input[$field]);

                if (!$date || $date->format('Y-m-d') !== $input[$field]) {
                    jsonResponse(400, [
                        'success' => false,
                        'message' => "$field must use YYYY-MM-DD format"
                    ]);
                }
            }
        }

        $values[] = $internshipId;
        $values[] = $companyId;

        $sql = 'UPDATE internship SET ' . implode(', ', $updates) .
               ' WHERE internship_id = ? AND company_id = ?';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        if ($stmt->rowCount() === 0) {
            $check = $pdo->prepare(
                'SELECT internship_id FROM internship
                 WHERE internship_id = ? AND company_id = ?'
            );
            $check->execute([$internshipId, $companyId]);

            if (!$check->fetch()) {
                jsonResponse(404, [
                    'success' => false,
                    'message' => 'Internship not found for this company'
                ]);
            }
        }

        jsonResponse(200, [
            'success' => true,
            'message' => 'Internship updated successfully'
        ]);
    }

    header('Allow: GET, POST, PUT');
    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed'
    ]);

} catch (PDOException $e) {
    error_log('Company internships API error: ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'Database error while processing company internships'
    ]);
}
