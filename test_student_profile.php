
<?php
session_start();

$loginUrl = 'http://localhost/skillsync/api/auth/login.php';
$profileUrl = 'http://localhost/skillsync/api/student/profile.php';

$result = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    // Keep the test session cookie separate from other tests.
    $cookieFile = __DIR__ . '/student_profile_cookies.txt';

    $ch = curl_init($loginUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'email' => $email,
            'password' => $password
        ]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile
    ]);

    $loginResponse = curl_exec($ch);
    $loginStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $loginError = curl_error($ch);
    curl_close($ch);

    if ($loginResponse === false) {
        exit('Login request failed: ' . htmlspecialchars($loginError));
    }

    $result .= '<h3>Login response (HTTP ' . (int)$loginStatus . ')</h3>';
    $result .= '<pre>' . htmlspecialchars($loginResponse) . '</pre>';

    $loginData = json_decode($loginResponse, true);

    if ($loginStatus !== 200 || empty($loginData['success'])) {
        $result .= '<p>Login failed. Profile test was not run.</p>';
    } elseif (($loginData['data']['role'] ?? '') !== 'Student') {
        $result .= '<p>Safety check failed: please use a Student account.</p>';
    } else {
        // First retrieve the current profile.
        $ch = curl_init($profileUrl);
        curl_setopt_array($ch, [
            CURLOPT_HTTPGET => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_COOKIEFILE => $cookieFile,
            CURLOPT_COOKIEJAR => $cookieFile
        ]);

        $profileResponse = curl_exec($ch);
        $profileStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $profileError = curl_error($ch);
        curl_close($ch);

        if ($profileResponse === false) {
            exit('Profile request failed: ' . htmlspecialchars($profileError));
        }

        $result .= '<h3>Profile response (HTTP ' . (int)$profileStatus . ')</h3>';
        $result .= '<pre>' . htmlspecialchars($profileResponse) . '</pre>';

        $profileData = json_decode($profileResponse, true);
        if ($profileStatus === 200 && !empty($profileData['success'])) {
            $result .= '<p>GET profile test passed. No profile values were changed.</p>';
        }
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SkillSync Student Profile Test</title>
</head>
<body>
    <h2>SkillSync Student Profile API Test</h2>
    <p>This test only logs in and reads the profile. It does not update your data.</p>

    <form method="post">
        <label>Student email:</label><br>
        <input type="email" name="email" required><br><br>

        <label>Student password:</label><br>
        <input type="password" name="password" required><br><br>

        <button type="submit">Login and Test Student Profile</button>
    </form>

    <?= $result ?>
</body>
</html>
