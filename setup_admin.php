<?php
require_once __DIR__ . '/config/database.php';

$email = 'admin@skillsync.com';
$password = 'Admin@123';
$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    // Check if user_account exists
    $stmt = $pdo->prepare('SELECT user_id FROM user_account WHERE email = ?');
    $stmt->execute([$email]);
    $userId = $stmt->fetchColumn();

    if ($userId) {
        $stmt = $pdo->prepare('UPDATE user_account SET password_hash = ?, role = "Admin", account_status = "Active" WHERE user_id = ?');
        $stmt->execute([$hash, $userId]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO user_account (email, password_hash, role, account_status) VALUES (?, ?, "Admin", "Active")');
        $stmt->execute([$email, $hash]);
        $userId = (int)$pdo->lastInsertId();
    }

    // Ensure row exists in admin table
    $stmt = $pdo->prepare('SELECT admin_id FROM admin WHERE user_id = ?');
    $stmt->execute([$userId]);
    if (!$stmt->fetchColumn()) {
        $stmt = $pdo->prepare('INSERT INTO admin (user_id, name) VALUES (?, "Platform Administrator")');
        $stmt->execute([$userId]);
    }

    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><head><title>Admin Setup - SkillSync</title>
    <style>body{font-family:sans-serif;background:#030712;color:#f9fafb;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
    .card{background:#111827;border:1px solid #374151;border-radius:1rem;padding:2rem;max-width:400px;text-align:center;}
    h1{color:#22d3ee;font-size:1.5rem;}
    p{color:#9ca3af;font-size:0.95rem;margin:0.5rem 0;}
    strong{color:#fff;}
    a{display:inline-block;margin-top:1.25rem;background:#22d3ee;color:#030712;padding:0.75rem 1.5rem;border-radius:0.75rem;text-decoration:none;font-weight:bold;}
    </style></head><body><div class="card">
    <h1>✓ Admin Account Ready!</h1>
    <p>Email: <strong>admin@skillsync.com</strong></p>
    <p>Password: <strong>Admin@123</strong></p>
    <p>Role: <strong>Admin</strong></p>
    <a href="http://localhost:3000/">Go to Login Page →</a>
    </div></body></html>';
} catch (PDOException $e) {
    echo "Database error: " . htmlspecialchars($e->getMessage());
}
