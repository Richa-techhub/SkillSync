<?php
declare(strict_types=1);
if(session_status()!==PHP_SESSION_ACTIVE){session_set_cookie_params(['httponly'=>true,'samesite'=>'Lax','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off']);session_start();}
require_once __DIR__.'/../config/database.php';
function e($v): string { return htmlspecialchars((string)($v??''),ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8'); }
function csrf_token(): string { if(empty($_SESSION['csrf_token'])) $_SESSION['csrf_token']=bin2hex(random_bytes(32)); return $_SESSION['csrf_token']; }
function verify_csrf(): void { if(!is_string($_POST['csrf_token']??null)||!hash_equals($_SESSION['csrf_token']??'',$_POST['csrf_token'])){http_response_code(400);exit('Invalid request token. Refresh and try again.');} }
function require_role(string $role): void { if(empty($_SESSION['user_id'])){header('Location: /skillsync/login.php');exit;} if(($_SESSION['role']??'')!==$role){http_response_code(403);exit('Forbidden');} }
function val(string $key,int $max=3000): string { $v=$_POST[$key]??'';return is_string($v)?trim(mb_substr($v,0,$max)):''; }
function student_id(PDO $pdo): int {$s=$pdo->prepare('SELECT student_id FROM student WHERE user_id=?');$s->execute([$_SESSION['user_id']]);$v=$s->fetchColumn();if(!$v)exit('Student profile not found.');return (int)$v;}
function company_id(PDO $pdo): int {$s=$pdo->prepare('SELECT company_id FROM company WHERE user_id=?');$s->execute([$_SESSION['user_id']]);$v=$s->fetchColumn();if(!$v)exit('Company profile not found.');return (int)$v;}
function page(string $title,string $body): void { echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'.e($title).' - SkillSync</title>
<link rel="stylesheet" href="/skillsync/assets/css/style.css"></head>
<body><h1>SkillSync</h1><nav><a href="/skillsync/index.php">Home</a>
<a href="/skillsync/register.php">Register</a><a href="/skillsync/login.php">Login</a>'.(!empty($_SESSION['user_id'])?'<a href="/skillsync/logout.php">Logout</a>':'').'</nav>'.$body.' <script src="/skillsync/assets/js/app.js" defer></script></body></html>'; }
function dashboard_redirect(): never { $p=match($_SESSION['role']??''){ 'Student'=>'student/dashboard.php','Company'=>'company/dashboard.php','Admin'=>'admin/dashboard.php',default=>'login.php'};header('Location: /skillsync/'.$p);exit; }
