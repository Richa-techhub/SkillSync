<?php
declare(strict_types=1);
$host='127.0.0.1'; $dbname='skillsync_db'; $username='root'; $password='R@SQL094';
try {
 $pdo=new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4",$username,$password,[
  PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES=>false
 ]);
}  catch (PDOException $e) {
    die('Database connection error: ' . $e->getMessage());
}
