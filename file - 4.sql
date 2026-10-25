SELECT
    s.name AS student_name,
    sk.skill_name,
    ss.proficiency_level
FROM student s
JOIN student_skill ss
    ON s.student_id = ss.student_id
JOIN skill sk
    ON ss.skill_id = sk.skill_id;
    
    
SELECT
    s.name AS student_name,
    i.title AS internship_title,
    c.company_name,
    a.application_date,
    a.status
FROM application a
JOIN student s
    ON a.student_id = s.student_id
JOIN internship i
    ON a.internship_id = i.internship_id
JOIN company c
    ON i.company_id = c.company_id;
    
    
    SELECT
    i.title AS internship_title,
    sk.skill_name,
    isk.required_level
FROM internship i
JOIN internship_skill isk
    ON i.internship_id = isk.internship_id
JOIN skill sk
    ON isk.skill_id = sk.skill_id;
    


SELECT
    c.company_name,
    i.title AS internship_title,
    s.name AS student_name,
    s.department,
    s.CGPA,
    a.application_date,
    a.status
FROM company c
JOIN internship i
    ON c.company_id = i.company_id
JOIN application a
    ON i.internship_id = a.internship_id
JOIN student s
    ON a.student_id = s.student_id;
    
    
    SELECT
    i.title AS internship_title,
    c.company_name,
    i.location,
    i.duration,
    i.stipend,
    i.deadline
FROM internship i
JOIN company c
    ON i.company_id = c.company_id
WHERE i.location = 'Bangalore'
AND i.status = 'Open';


SELECT
    i.title AS internship_title,
    c.company_name,
    i.location,
    i.duration,
    i.stipend,
    i.start_date,
    i.deadline,
    i.status
FROM internship i
JOIN company c
    ON i.company_id = c.company_id
WHERE c.company_name = 'TechCorp Solutions';


SELECT
    i.title AS internship_title,
    c.company_name,
    sk.skill_name,
    isk.required_level,
    i.location,
    i.duration,
    i.stipend
FROM internship i
JOIN company c
    ON i.company_id = c.company_id
JOIN internship_skill isk
    ON i.internship_id = isk.internship_id
JOIN skill sk
    ON isk.skill_id = sk.skill_id
WHERE sk.skill_name = 'Python'
AND i.status = 'Open';


SELECT
    i.title AS internship_title,
    c.company_name,
    i.location,
    i.duration,
    i.stipend,
    i.deadline
FROM internship i
JOIN company c
    ON i.company_id = c.company_id
WHERE i.duration = '3 Months'
AND i.status = 'Open';


SELECT COUNT(*) AS total_students
FROM student;

SELECT COUNT(*) AS total_companies
FROM company;

SELECT COUNT(*) AS total_internships
FROM internship;

SELECT COUNT(*) AS total_applications
FROM application;

SELECT
    status,
    COUNT(*) AS total_applications
FROM application
GROUP BY status;

SELECT
    i.title AS internship_title,
    c.company_name,
    COUNT(a.application_id) AS total_applicants
FROM internship i
JOIN company c
    ON i.company_id = c.company_id
LEFT JOIN application a
    ON i.internship_id = a.internship_id
GROUP BY
    i.internship_id,
    i.title,
    c.company_name;
    
SELECT
    s.name AS student_name,
    i.title AS internship_title,
    c.company_name,
    a.application_date
FROM application a
JOIN student s
    ON a.student_id = s.student_id
JOIN internship i
    ON a.internship_id = i.internship_id
JOIN company c
    ON i.company_id = c.company_id
WHERE a.status = 'Selected';

