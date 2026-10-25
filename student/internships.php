<?php
require_once __DIR__.'/../includes/bootstrap.php';require_role('Student');student_id($pdo);$q=trim((string)($_GET['q']??''));$loc=trim((string)($_GET['location']??''));$skill=trim((string)($_GET['skill']??''));
$sql="SELECT i.*,c.company_name FROM internship i JOIN company c ON c.company_id=i.company_id WHERE i.status='Open' AND (i.deadline IS NULL OR i.deadline>=CURDATE())";$p=[];
if($q!==''){$sql.=' AND (i.title LIKE ? OR i.description LIKE ? OR c.company_name LIKE ?)';$x='%'.$q.'%';array_push($p,$x,$x,$x);}
if($loc!==''){$sql.=' AND i.location LIKE ?';$p[]='%'.$loc.'%';}
if($skill!==''){$sql.=' AND EXISTS(SELECT 1 FROM internship_skill ix JOIN skill sk ON sk.skill_id=ix.skill_id WHERE ix.internship_id=i.internship_id AND sk.skill_name LIKE ?)';$p[]='%'.$skill.'%';}
$sql.=' ORDER BY i.deadline';$s=$pdo->prepare($sql);$s->execute($p);$rows=$s->fetchAll();$b='<h2>Open internships</h2><form><label>Keyword/company<input name="q" value="'.e($q).'"></label><label>Location<input name="location" value="'.e($loc).'"></label><label>Skill<input name="skill" value="'.e($skill).'"></label><button>Search</button></form>';
foreach($rows as $r)$b.='<section class="card"><h3>'.e($r['title']).'</h3><p>'.e($r['company_name']).' · '.e($r['location']).' · '.e($r['duration']).' · Stipend: '.e($r['stipend']).'</p><p>'.nl2br(e($r['description'])).'</p><p>Deadline: '.e($r['deadline']).'</p><a href="apply.php?id='.(int)$r['internship_id'].'">View / apply</a></section>';if(!$rows)$b.='<p>No matching internships found.</p>';page('Internships',$b);
