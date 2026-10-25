
<?php
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/auth.php';

$user = requireRole('Student');

$method = $_SERVER['REQUEST_METHOD'];

try {
    // Find the logged-in student's profile.
    $stmt = $pdo->prepare(
        'SELECT student_id FROM student WHERE user_id = ?'
    );
    $stmt->execute([$user['user_id']]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        jsonResponse(404, [
            'success' => false,
            'message' => 'Student profile not found'
        ]);
    }

    $studentId = (int) $student['student_id'];

    if ($method === 'GET') {
        $stmt = $pdo->prepare(
            'SELECT s.skill_id, s.skill_name, s.skill_category,
                    ss.proficiency_level
             FROM student_skill ss
             JOIN skill s ON s.skill_id = ss.skill_id
             WHERE ss.student_id = ?
             ORDER BY s.skill_name'
        );
        $stmt->execute([$studentId]);
        $mySkills = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $allStmt = $pdo->query(
            'SELECT skill_id, skill_name, skill_category
             FROM skill
             ORDER BY skill_name'
        );
        $allSkills = $allStmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(200, [
            'success' => true,
            'skills' => $mySkills,
            'available_skills' => $allSkills
        ]);
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!is_array($data)) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'A valid JSON body is required'
            ]);
        }

        $skillId = filter_var(
            $data['skill_id'] ?? null,
            FILTER_VALIDATE_INT
        );
        $level = trim((string) ($data['proficiency_level'] ?? ''));

        $allowedLevels = ['Beginner', 'Intermediate', 'Advanced'];

        if (!$skillId || !in_array($level, $allowedLevels, true)) {
            jsonResponse(422, [
                'success' => false,
                'message' => 'Provide a valid skill_id and proficiency_level: Beginner, Intermediate, or Advanced'
            ]);
        }

        $stmt = $pdo->prepare(
            'SELECT skill_id FROM skill WHERE skill_id = ?'
        );
        $stmt->execute([$skillId]);

        if (!$stmt->fetch()) {
            jsonResponse(404, [
                'success' => false,
                'message' => 'Skill not found'
            ]);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO student_skill
                (student_id, skill_id, proficiency_level)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
                proficiency_level = VALUES(proficiency_level)'
        );
        $stmt->execute([$studentId, $skillId, $level]);

        jsonResponse(200, [
            'success' => true,
            'message' => 'Skill added or updated successfully'
        ]);
    }

    if ($method === 'DELETE') {
        $data = json_decode(file_get_contents('php://input'), true);
        $skillId = filter_var(
            $data['skill_id'] ?? null,
            FILTER_VALIDATE_INT
        );

        if (!$skillId) {
            jsonResponse(400, [
                'success' => false,
                'message' => 'Provide a valid skill_id in the JSON body'
            ]);
        }

        $stmt = $pdo->prepare(
            'DELETE FROM student_skill
             WHERE student_id = ? AND skill_id = ?'
        );
        $stmt->execute([$studentId, $skillId]);

        jsonResponse(200, [
            'success' => true,
            'message' => $stmt->rowCount() > 0
                ? 'Skill removed successfully'
                : 'Skill was not assigned to this student'
        ]);
    }

    header('Allow: GET, POST, DELETE');
    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed'
    ]);

} catch (PDOException $e) {
    error_log('Student skills API error: ' . $e->getMessage());
    jsonResponse(500, [
        'success' => false,
        'message' => 'Database error while processing skills'
    ]);
}
