UPDATE student
SET CGPA = 8.80
WHERE student_id = 1;

SELECT student_id, name, CGPA
FROM student
WHERE student_id = 1;

UPDATE student
SET CGPA = 8.70
WHERE student_id = 1;

SELECT student_id, name, CGPA
FROM student
WHERE student_id = 1;


SELECT *
FROM student_skill
WHERE student_id = 1
AND skill_id = 3;

DELETE FROM student_skill
WHERE student_id = 1
AND skill_id = 3;

SELECT *
FROM student_skill
WHERE student_id = 1
AND skill_id = 3;

INSERT INTO student_skill
(student_id, skill_id, proficiency_level)
VALUES
(1, 3, 'Intermediate');