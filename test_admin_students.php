
<?php
session_start();

$loginUrl = 'http://localhost/skillsync/api/auth/login.php';
$studentsUrl = 'http://localhost/skillsync/api/admin/applications.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    // Use the same PHP session for both API requests.
    $cookieFile = __DIR__ . '/admin_students_cookies.txt';

    $ch = curl_init($loginUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'email' => $email,
            'password' => $password
        ]),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile
    ]);

    $loginResponse = curl_exec($ch);
    $loginStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($loginResponse === false) {
        exit('Login request failed: ' . htmlspecialchars($curlError));
    }

    echo '<h2>Login response (HTTP ' . (int)$loginStatus . ')</h2>';
    echo '<pre>' . htmlspecialchars($loginResponse) . '</pre>';

    $loginData = json_decode($loginResponse, true);

    if (
        $loginStatus !== 200 ||
        !is_array($loginData) ||
        empty($loginData['success'])
    ) {
        exit('Login failed. Check the response above.');
    }

    // Reuse the authenticated session cookie for the students API.
    $ch = curl_init($studentsUrl);
    curl_setopt_array($ch, [
        CURLOPT_HTTPGET => true,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile
    ]);

    $studentsResponse = curl_exec($ch);
    $studentsStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $studentsError = curl_error($ch);
    curl_close($ch);

    if ($studentsResponse === false) {
        exit('Students request failed: ' . htmlspecialchars($studentsError));
    }

    echo '<h2>Admin Students API (HTTP ' . (int)$studentsStatus . ')</h2>';
    echo '<pre>' . htmlspecialchars($studentsResponse) . '</pre>';

    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SkillSync Admin Students API Test</title>
</head>
<body>
    <h2>SkillSync Admin Students API Test</h2>

    <form method="POST">
        <label>Admin email:</label><br>
        <input type="email" name="email" required><br><br>

        <label>Admin password:</label><br>
        <input type="password" name="password" required><br><br>

        <button type="submit">Login and Test Students API</button>
    </form>
</body>
</html>
