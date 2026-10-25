
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

    // GET: List interviews for applications to this company's internships
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare(
            'SELECT
                i.interview_id,
                i.application_id,
                i.interview_date,
                i.interview_time,
                i.mode,
                i.result,
                i.remarks,
                a.status AS application_status,
                s.name AS student_name,
                x.title AS internship_title
             FROM interview i
             JOIN application a
               ON a.application_id = i.application_id
             JOIN internship x
               ON x.internship_id = a.internship_id
             JOIN student s
               ON s.student_id = a.student_id
             WHERE x.company_id = ?
             ORDER BY i.interview_date DESC, i.interview_time DESC'
        );

        $stmt->execute([$companyId]);

        jsonResponse(200, [
            'success' => true,
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    // POST: Schedule an interview for an authorized application
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'Invalid JSON request body.'
            ]);
        }

        $required = [
            'application_id',
            'interview_date',
            'interview_time',
            'mode'
        ];

        foreach ($required as $field) {
            if (!isset($input[$field]) || $input[$field] === '') {
                jsonResponse(400, [
                    'success' => false,
                    'message' => "Missing required field: $field"
                ]);
            }
        }

        $applicationId = filter_var(
            $input['application_id'],
            FILTER_VALIDATE_INT
        );

        if (!$applicationId) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'Invalid application_id.'
            ]);
        }

        $date = DateTime::createFromFormat(
            '!Y-m-d',
            (string) $input['interview_date']
        );

        if (!$date || $date->format('Y-m-d') !== $input['interview_date']) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'interview_date must use YYYY-MM-DD format.'
            ]);
        }

        $time = DateTime::createFromFormat(
            '!H:i',
            (string) $input['interview_time']
        );

        if (!$time || $time->format('H:i') !== $input['interview_time']) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'interview_time must use 24-hour HH:MM format.'
            ]);
        }

        $allowedModes = ['Online', 'Offline', 'Hybrid'];

        if (!in_array($input['mode'], $allowedModes, true)) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'mode must be Online, Offline, or Hybrid.'
            ]);
        }

        // Verify the application belongs to this company
        $stmt = $pdo->prepare(
            'SELECT a.application_id
             FROM application a
             JOIN internship x
               ON x.internship_id = a.internship_id
             WHERE a.application_id = ?
               AND x.company_id = ?'
        );
        $stmt->execute([$applicationId, $companyId]);

        if (!$stmt->fetchColumn()) {
            jsonResponse(404, [
                'success' => false,
                'message' => 'Application not found for this company.'
            ]);
        }

        // One interview per application in the current database schema
        $stmt = $pdo->prepare(
            'SELECT interview_id
             FROM interview
             WHERE application_id = ?'
        );
        $stmt->execute([$applicationId]);

        if ($stmt->fetchColumn()) {
            jsonResponse(409, [
                'success' => false,
                'message' => 'An interview already exists for this application.'
            ]);
        }

        $result = $input['result'] ?? null;
        $remarks = $input['remarks'] ?? null;

        if ($result !== null && !is_string($result)) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'result must be a string or null.'
            ]);
        }

        if ($remarks !== null && !is_string($remarks)) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'remarks must be a string or null.'
            ]);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO interview
                (application_id, interview_date, interview_time, mode, result, remarks)
             VALUES (?, ?, ?, ?, ?, ?)'
        );

        $stmt->execute([
            $applicationId,
            $input['interview_date'],
            $input['interview_time'],
            $input['mode'],
            $result,
            $remarks
        ]);

        jsonResponse(201, [
            'success' => true,
            'message' => 'Interview scheduled successfully.',
            'data' => [
                'interview_id' => (int) $pdo->lastInsertId(),
                'application_id' => $applicationId
            ]
        ]);
    }

    // PUT: Update an existing interview belonging to this company
    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'Invalid JSON request body.'
            ]);
        }

        $interviewId = filter_var(
            $input['interview_id'] ?? null,
            FILTER_VALIDATE_INT
        );

        if (!$interviewId) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'A valid interview_id is required.'
            ]);
        }

        $stmt = $pdo->prepare(
            'SELECT i.interview_id
             FROM interview i
             JOIN application a
               ON a.application_id = i.application_id
             JOIN internship x
               ON x.internship_id = a.internship_id
             WHERE i.interview_id = ?
               AND x.company_id = ?'
        );
        $stmt->execute([$interviewId, $companyId]);

        if (!$stmt->fetchColumn()) {
            jsonResponse(404, [
                'success' => false,
                'message' => 'Interview not found for this company.'
            ]);
        }

        $allowedFields = [
            'interview_date',
            'interview_time',
            'mode',
            'result',
            'remarks'
        ];

        $updates = [];
        $values = [];

        foreach ($allowedFields as $field) {
            if (!array_key_exists($field, $input)) {
                continue;
            }

            $value = $input[$field];

            if (in_array($field, ['interview_date', 'interview_time', 'mode'], true)
                && !is_string($value)) {
                jsonResponse(400, [
                    'success' => false,
                    'message' => "$field must be a string."
                ]);
            }

            if (in_array($field, ['result', 'remarks'], true)
                && $value !== null && !is_string($value)) {
                jsonResponse(400, [
                    'success' => false,
                    'message' => "$field must be a string or null."
                ]);
            }

            if ($field === 'interview_date') {
                $date = DateTime::createFromFormat('!Y-m-d', $value);

                if (!$date || $date->format('Y-m-d') !== $value) {
                    jsonResponse(400, [
                        'success' => false,
                        'message' => 'interview_date must use YYYY-MM-DD format.'
                    ]);
                }
            }

            if ($field === 'interview_time') {
                $time = DateTime::createFromFormat('!H:i', $value);

                if (!$time || $time->format('H:i') !== $value) {
                    jsonResponse(400, [
                        'success' => false,
                        'message' => 'interview_time must use 24-hour HH:MM format.'
                    ]);
                }
            }

            if ($field === 'mode'
                && !in_array($value, ['Online', 'Offline', 'Hybrid'], true)) {
                jsonResponse(400, [
                    'success' => false,
                    'message' => 'mode must be Online, Offline, or Hybrid.'
                ]);
            }

            $updates[] = "$field = ?";
            $values[] = $value;
        }

        if (empty($updates)) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'No interview fields provided to update.'
            ]);
        }

        $values[] = $interviewId;

        $stmt = $pdo->prepare(
            'UPDATE interview SET ' . implode(', ', $updates)
            . ' WHERE interview_id = ?'
        );

        $stmt->execute($values);

        jsonResponse(200, [
            'success' => true,
            'message' => 'Interview updated successfully.'
        ]);
    }

    header('Allow: GET, POST, PUT');

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
