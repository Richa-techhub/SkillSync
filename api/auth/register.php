<?php
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]);
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== 0) {
    jsonResponse(415, [
        'success' => false,
        'message' => 'Send the request as JSON.'
    ]);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Invalid JSON request.'
    ]);
}

$role = trim($input['role'] ?? 'Student');
if (!in_array($role, ['Student', 'Company'], true)) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Role must be Student or Company. Admin accounts must be created by administrator.'
    ]);
}

$name = trim($input['name'] ?? '');
$email = strtolower(trim($input['email'] ?? ''));
$password = $input['password'] ?? '';
$phone = trim($input['phone'] ?? '');

if (
    $name === '' ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    !is_string($password) ||
    strlen($password) < 8
) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Name, valid email, and password of at least 8 characters are required.'
    ]);
}

$department = '';
$year = 1;
$cgpa = null;

if ($role === 'Student') {
    $department = trim($input['department'] ?? '');
    $year = filter_var($input['year'] ?? 1, FILTER_VALIDATE_INT);
    $cgpa = $input['CGPA'] ?? null;

    if ($department === '' || $year === false || $year < 1 || $year > 6) {
        jsonResponse(400, [
            'success' => false,
            'message' => 'Provide a valid department and year of study (1-6).'
        ]);
    }

    if (
        $cgpa !== null &&
        $cgpa !== '' &&
        (!is_numeric($cgpa) || (float)$cgpa < 0 || (float)$cgpa > 10)
    ) {
        jsonResponse(400, [
            'success' => false,
            'message' => 'CGPA must be between 0 and 10.'
        ]);
    }
}

try {
    $pdo->beginTransaction();

    $check = $pdo->prepare(
        'SELECT user_id FROM user_account WHERE email = ? LIMIT 1'
    );
    $check->execute([$email]);

    if ($check->fetch()) {
        $pdo->rollBack();
        jsonResponse(409, [
            'success' => false,
            'message' => 'An account with this email already exists.'
        ]);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        'INSERT INTO user_account
            (email, password_hash, role, account_status)
         VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([
        $email,
        $passwordHash,
        $role,
        'Active'
    ]);

    $userId = (int)$pdo->lastInsertId();

    if ($role === 'Student') {
        $stmt = $pdo->prepare(
            'INSERT INTO student
                (user_id, name, phone, department, year, CGPA)
             VALUES (?, ?, ?, ?, ?, ?)'
        );

        $stmt->execute([
            $userId,
            $name,
            $phone !== '' ? $phone : null,
            $department,
            $year,
            ($cgpa === null || $cgpa === '') ? null : (float)$cgpa
        ]);

        $studentId = (int)$pdo->lastInsertId();
        $pdo->commit();

        jsonResponse(201, [
            'success' => true,
            'message' => 'Student account registered successfully.',
            'data' => [
                'user_id' => $userId,
                'student_id' => $studentId,
                'email' => $email,
                'role' => 'Student'
            ]
        ]);
    } else {
        // Company registration
        $stmt = $pdo->prepare(
            'INSERT INTO company
                (user_id, company_name, phone)
             VALUES (?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $name,
            $phone !== '' ? $phone : null
        ]);

        $companyId = (int)$pdo->lastInsertId();
        $pdo->commit();

        jsonResponse(201, [
            'success' => true,
            'message' => 'Company account registered successfully.',
            'data' => [
                'user_id' => $userId,
                'company_id' => $companyId,
                'email' => $email,
                'role' => 'Company'
            ]
        ]);
    }
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('SkillSync registration database error: ' . $e->getMessage());

    jsonResponse(500, [
        'success' => false,
        'message' => 'Registration could not be completed. Check the server error log if the problem persists.'
    ]);
}