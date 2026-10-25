
<?php
require_once __DIR__ . '/../common/response.php';
require_once __DIR__ . '/../common/bootstrap.php';
require_once __DIR__ . '/../common/auth.php';

$user = requireRole('Student');

$stmt = $pdo->prepare(
    'SELECT student_id, name, phone, department, year, CGPA, resume
     FROM student
     WHERE user_id = ?
     LIMIT 1'
);
$stmt->execute([(int)$user['user_id']]);
$profile = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$profile) {
    jsonResponse(404, [
        'success' => false,
        'message' => 'Student profile not found.'
    ]);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    jsonResponse(200, [
        'success' => true,
        'message' => 'Student profile retrieved successfully.',
        'data' => $profile
    ]);
}

if ($method !== 'PUT') {
    header('Allow: GET, PUT');
    jsonResponse(405, [
        'success' => false,
        'message' => 'Method not allowed. Use GET or PUT.'
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

$name = trim($input['name'] ?? $profile['name']);
$phone = trim($input['phone'] ?? $profile['phone']);
$department = trim($input['department'] ?? $profile['department']);
$year = array_key_exists('year', $input)
    ? filter_var($input['year'], FILTER_VALIDATE_INT)
    : (int)$profile['year'];
$cgpa = array_key_exists('CGPA', $input)
    ? $input['CGPA']
    : $profile['CGPA'];
$resume = array_key_exists('resume', $input)
    ? $input['resume']
    : $profile['resume'];

if ($name === '' || $phone === '' || $department === '') {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Name, phone, and department cannot be empty.'
    ]);
}

if ($year === false || $year === null || $year < 1 || $year > 6) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Year must be an integer between 1 and 6.'
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

if ($resume !== null && !is_string($resume)) {
    jsonResponse(400, [
        'success' => false,
        'message' => 'Resume must be a URL or text value.'
    ]);
}

$stmt = $pdo->prepare(
    'UPDATE student
     SET name = ?, phone = ?, department = ?, year = ?, CGPA = ?, resume = ?
     WHERE user_id = ?'
);

$stmt->execute([
    $name,
    $phone,
    $department,
    $year,
    ($cgpa === null || $cgpa === '') ? null : (float)$cgpa,
    $resume,
    (int)$user['user_id']
]);

$stmt = $pdo->prepare(
    'SELECT student_id, name, phone, department, year, CGPA, resume
     FROM student
     WHERE user_id = ?
     LIMIT 1'
);
$stmt->execute([(int)$user['user_id']]);
$updatedProfile = $stmt->fetch(PDO::FETCH_ASSOC);

jsonResponse(200, [
    'success' => true,
    'message' => 'Student profile updated successfully.',
    'data' => $updatedProfile
]);
