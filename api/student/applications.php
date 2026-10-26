
<?php
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/auth.php';

$user = requireRole('Student');

try {
    // Find the student profile for the logged-in user.
    $studentStmt = $pdo->prepare(
        'SELECT student_id FROM student WHERE user_id = ?'
    );
    $studentStmt->execute([$user['user_id']]);
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        jsonResponse(404, [
            'success' => false,
            'message' => 'Student profile not found'
        ]);
    }

    $studentId = $student['student_id'];
    $method = $_SERVER['REQUEST_METHOD'];

    // GET: Retrieve this student's applications.
    if ($method === 'GET') {
        $stmt = $pdo->prepare(
            "SELECT
                a.application_id,
                a.internship_id,
                i.title AS internship_title,
                c.company_name,
                i.location,
                i.duration,
                i.stipend,
                a.application_date,
                a.status,
                a.resume,
                a.cover_letter
            FROM application a
            JOIN internship i
                ON a.internship_id = i.internship_id
            JOIN company c
                ON i.company_id = c.company_id
            WHERE a.student_id = ?
            ORDER BY a.application_date DESC, a.application_id DESC"
        );

        $stmt->execute([$studentId]);

        jsonResponse(200, [
            'success' => true,
            'applications' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    // POST: Submit a new internship application.
    if ($method === 'POST') {
        requireCsrf();

        $data = requestData();

        $internshipId = filter_var(
            $data['internship_id'] ?? null,
            FILTER_VALIDATE_INT
        );

        if (!$internshipId || $internshipId < 1) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'A valid internship_id is required'
            ]);
        }

        $resume = trim((string)($data['resume'] ?? ''));
        $coverLetter = trim((string)($data['cover_letter'] ?? ''));

        // Check that the internship exists and is open.
        $internshipStmt = $pdo->prepare(
            "SELECT internship_id
             FROM internship
             WHERE internship_id = ?
               AND LOWER(status) IN ('open', 'active')
               AND (deadline IS NULL OR deadline >= CURDATE())"
        );

        $internshipStmt->execute([$internshipId]);

        if (!$internshipStmt->fetch(PDO::FETCH_ASSOC)) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'This internship is unavailable or its deadline has passed'
            ]);
        }

        // Prevent duplicate applications by the same student.
        $duplicateStmt = $pdo->prepare(
            'SELECT application_id
             FROM application
             WHERE student_id = ? AND internship_id = ?
             LIMIT 1'
        );

        $duplicateStmt->execute([$studentId, $internshipId]);

        if ($duplicateStmt->fetch(PDO::FETCH_ASSOC)) {
            jsonResponse(409, [
                'success' => false,
                'message' => 'You have already applied for this internship'
            ]);
        }

        // Insert the application. The trg_auto_discard_ineligible_applicant trigger automatically
        // evaluates the student CGPA against internship.min_cgpa and sets status to 'Rejected' if below criteria.
        $insertStmt = $pdo->prepare(
            'INSERT INTO application
                (student_id, internship_id, application_date, resume, cover_letter)
             VALUES (?, ?, CURDATE(), ?, ?)'
        );

        $insertStmt->execute([
            $studentId,
            $internshipId,
            $resume !== '' ? $resume : null,
            $coverLetter !== '' ? $coverLetter : null
        ]);

        $appId = (int)$pdo->lastInsertId();
        $statusStmt = $pdo->prepare('SELECT status FROM application WHERE application_id = ?');
        $statusStmt->execute([$appId]);
        $savedApp = $statusStmt->fetch(PDO::FETCH_ASSOC);
        $finalStatus = $savedApp['status'] ?? 'Pending';
        $isDiscarded = (strtolower($finalStatus) === 'rejected');

        jsonResponse(201, [
            'success' => true,
            'message' => $isDiscarded
                ? 'Application recorded, but automatically discarded because your CGPA does not meet the minimum criteria.'
                : 'Application submitted successfully',
            'status' => $finalStatus,
            'auto_discarded' => $isDiscarded,
            'application_id' => $appId
        ]);
    }

    header('Allow: GET, POST');
    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed'
    ]);

} catch (PDOException $e) {
    error_log('Student applications API error: ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'A database error occurred while processing the application'
    ]);
}
