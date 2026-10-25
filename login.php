<?php
require_once __DIR__.'/includes/bootstrap.php';$err='';
if($_SERVER['REQUEST_METHOD']==='POST'){verify_csrf();$email=strtolower(val('email',190));$pw=$_POST['password']??'';$s=$pdo->prepare('SELECT user_id,email,password_hash,role,account_status FROM user_account WHERE email=?');$s->execute([$email]);$u=$s->fetch();
if(!$u||!is_string($pw)||!password_verify($pw,$u['password_hash']))$err='Invalid email/password. Sample SQL passwords may be dummy hashes; register a new test user.';
elseif(($u['account_status']??'Active')!=='Active')$err='Account is not active.';
else{session_regenerate_id(true);$_SESSION['user_id']=(int)$u['user_id'];$_SESSION['email']=$u['email'];$_SESSION['role']=$u['role'];$_SESSION['csrf_token']=bin2hex(random_bytes(32));dashboard_redirect();}}
page('Login',(!empty($_GET['registered'])?'<p class="ok">Registration successful. Log in now.</p>':'').($err?'<p class="error">'.e($err).'</p>':'').'<form method="post"><input type="hidden" name="csrf_token" value="'.e(csrf_token()).'"><label>Email<input type="email" name="email" required></label><label>Password<input type="password" name="password" required></label><button>Login</button></form>');
