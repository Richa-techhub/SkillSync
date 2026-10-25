php
<?php
header('Content-Type: text/plain; charset=utf-8');

$baseUrl = 'http://localhost/skillsync/api/';
$cookieFile = tempnam(sys_get_temp_dir(), 'skillsync_cookie_');

if ($cookieFile === false) {
    exit("Could not create temporary cookie file.\n");
}

if (!function_exists('curl_init')) {
    @unlink($cookieFile);
    exit(
        "PHP cURL is not enabled.\n" .
        "Stop here and tell me this message.\n"
    );
}

function apiRequest(
    string $url,
    string $method,
    ?array $data,
    string $cookieFile
): array {
    $ch = curl_init($url);

    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    ];

    if ($data !== null) {
        $options[CURLOPT_POSTFIELDS] = json_encode($data);
    }

    curl_setopt_array($ch, $options);

    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);

    curl_close($ch);

    if ($body === false) {
        return [0, 'Request failed: ' . $error];
    }

    return [$status, $body];
}

$credentials = [
    'email' => 'ahaan.patel@gmail.com',
    'password' => 'ahaan@1123'
];

// 1. Login
[$loginStatus, $loginBody] = apiRequest(
    $baseUrl . 'auth/login.php',
    'POST',
    $credentials,
    $cookieFile
);

echo "LOGIN (HTTP $loginStatus)\n$loginBody\n\n";

$loginData = json_decode($loginBody, true);
$csrfToken = $loginData['data']['csrf_token'] ?? null;

if ($loginStatus !== 200 || !is_string($csrfToken)) {
    echo "Login failed or CSRF token missing. Test stopped.\n";
    @unlink($cookieFile);
    exit;
}

// 2. Verify session before logout
[$meStatus, $meBody] = apiRequest(
    $baseUrl . 'auth/me.php',
    'GET',
    null,
    $cookieFile
);

echo "SESSION BEFORE LOGOUT (HTTP $meStatus)\n$meBody\n\n";

if ($meStatus !== 200) {
    echo "Session was not preserved. Test stopped.\n";
    @unlink($cookieFile);
    exit;
}

// 3. Logout using the CSRF token
[$logoutStatus, $logoutBody] = apiRequest(
    $baseUrl . 'auth/logout.php',
    'POST',
    ['csrf_token' => $csrfToken],
    $cookieFile
);

echo "LOGOUT (HTTP $logoutStatus)\n$logoutBody\n\n";

// 4. Verify session is no longer authenticated
[$afterStatus, $afterBody] = apiRequest(
    $baseUrl . 'auth/me.php',
    'GET',
    null,
    $cookieFile
);

echo "SESSION AFTER LOGOUT (HTTP $afterStatus)\n$afterBody\n";

@unlink($cookieFile);
    