-- ============================================================================
-- SKILLSYNC DBMS ADVANCED DATABASE OBJECTS (file - 6.sql)
-- Includes: Database Views, Stored Procedures, Triggers, and Functions
-- College DBMS Project - SkillSync Management System
-- ============================================================================

USE skillsync_db;

-- ----------------------------------------------------------------------------
-- 1. DATABASE VIEWS
-- ----------------------------------------------------------------------------

-- View 1: v_open_internships
-- Purpose: Provides a fast, pre-joined representation of all open internships 
-- with company contact details for quick student queries.
CREATE OR REPLACE VIEW v_open_internships AS
SELECT 
    i.internship_id,
    i.title,
    i.description,
    c.company_id,
    c.company_name,
    c.location AS company_headquarters,
    i.location AS internship_location,
    i.duration,
    i.stipend,
    i.start_date,
    i.deadline,
    i.status
FROM internship i
INNER JOIN company c 
    ON i.company_id = c.company_id
WHERE LOWER(i.status) = 'open';

-- View 2: v_student_application_details
-- Purpose: Consolidates student academic profiles, company listings, and live 
-- application review statuses into a comprehensive administrative view.
CREATE OR REPLACE VIEW v_student_application_details AS
SELECT 
    a.application_id,
    s.student_id,
    s.name AS student_name,
    s.department,
    s.year AS study_year,
    s.CGPA,
    ua.email AS student_email,
    i.internship_id,
    i.title AS internship_title,
    c.company_id,
    c.company_name,
    a.application_date,
    a.status AS application_status,
    a.resume AS submitted_resume,
    a.cover_letter
FROM application a
INNER JOIN student s 
    ON a.student_id = s.student_id
INNER JOIN user_account ua 
    ON s.user_id = ua.user_id
INNER JOIN internship i 
    ON a.internship_id = i.internship_id
INNER JOIN company c 
    ON i.company_id = c.company_id;


-- ----------------------------------------------------------------------------
-- 2. USER-DEFINED FUNCTION (UDF)
-- ----------------------------------------------------------------------------

-- Function: fn_student_skill_count
-- Purpose: Returns the total number of verified skills a student has acquired.
DROP FUNCTION IF EXISTS fn_student_skill_count;

DELIMITER $$
CREATE FUNCTION fn_student_skill_count(p_student_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(*) INTO v_count
    FROM student_skill
    WHERE student_id = p_student_id;
    RETURN IFNULL(v_count, 0);
END$$
DELIMITER ;


-- ----------------------------------------------------------------------------
-- 3. STORED PROCEDURES
-- ----------------------------------------------------------------------------

-- Procedure 1: sp_get_company_analytics
-- Purpose: Computes real-time KPI metrics for a recruiting company using OUT parameters.
DROP PROCEDURE IF EXISTS sp_get_company_analytics;

DELIMITER $$
CREATE PROCEDURE sp_get_company_analytics(
    IN p_company_id INT,
    OUT p_total_internships INT,
    OUT p_total_applications INT,
    OUT p_shortlisted_candidates INT
)
BEGIN
    -- 1. Total internships posted by this company
    SELECT COUNT(*) INTO p_total_internships
    FROM internship
    WHERE company_id = p_company_id;

    -- 2. Total student applications received
    SELECT COUNT(a.application_id) INTO p_total_applications
    FROM application a
    INNER JOIN internship i ON a.internship_id = i.internship_id
    WHERE i.company_id = p_company_id;

    -- 3. Total shortlisted or accepted candidates
    SELECT COUNT(a.application_id) INTO p_shortlisted_candidates
    FROM application a
    INNER JOIN internship i ON a.internship_id = i.internship_id
    WHERE i.company_id = p_company_id
      AND a.status IN ('Shortlisted', 'Accepted');
END$$
DELIMITER ;


-- Procedure 2: sp_submit_application
-- Purpose: Atomically validates deadline and duplicate rules before inserting application.
DROP PROCEDURE IF EXISTS sp_submit_application;

DELIMITER $$
CREATE PROCEDURE sp_submit_application(
    IN p_student_id INT,
    IN p_internship_id INT,
    IN p_resume VARCHAR(255),
    IN p_cover_letter TEXT,
    OUT p_application_id INT
)
BEGIN
    DECLARE v_deadline DATE;
    DECLARE v_status VARCHAR(20);
    DECLARE v_existing INT DEFAULT 0;

    -- Check internship availability
    SELECT deadline, status INTO v_deadline, v_status
    FROM internship
    WHERE internship_id = p_internship_id;

    IF v_status IS NULL OR LOWER(v_status) != 'open' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Application Error: Internship is closed or unavailable.';
    END IF;

    IF v_deadline IS NOT NULL AND v_deadline < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Application Error: The deadline for this opportunity has expired.';
    END IF;

    -- Prevent duplicate application
    SELECT COUNT(*) INTO v_existing
    FROM application
    WHERE student_id = p_student_id AND internship_id = p_internship_id;

    IF v_existing > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Application Error: Student has already applied for this role.';
    END IF;

    -- Insert record
    INSERT INTO application (student_id, internship_id, application_date, status, resume, cover_letter)
    VALUES (p_student_id, p_internship_id, CURDATE(), 'Pending', p_resume, p_cover_letter);

    SET p_application_id = LAST_INSERT_ID();
END$$
DELIMITER ;


-- ----------------------------------------------------------------------------
-- 4. DATABASE TRIGGERS
-- ----------------------------------------------------------------------------

-- Trigger 1: trg_validate_application_deadline
-- Purpose: Enforces database-level constraint integrity. Rejects any attempt to insert
-- an application after the internship deadline has passed.
DROP TRIGGER IF EXISTS trg_validate_application_deadline;

DELIMITER $$
CREATE TRIGGER trg_validate_application_deadline
BEFORE INSERT ON application
FOR EACH ROW
BEGIN
    DECLARE v_deadline DATE;

    SELECT deadline INTO v_deadline
    FROM internship
    WHERE internship_id = NEW.internship_id;

    IF v_deadline IS NOT NULL AND v_deadline < NEW.application_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Constraint Error: Cannot apply to an expired internship.';
    END IF;
END$$
DELIMITER ;

-- Trigger 2: trg_auto_discard_ineligible_applicant
-- Purpose: Automatically discards applicants from the candidate pool whose CGPA does not meet
-- the internship's minimum required CGPA threshold by setting status to 'Rejected'.
DROP TRIGGER IF EXISTS trg_auto_discard_ineligible_applicant;

DELIMITER $$
CREATE TRIGGER trg_auto_discard_ineligible_applicant
BEFORE INSERT ON application
FOR EACH ROW
BEGIN
    DECLARE v_student_cgpa DECIMAL(3,2);
    DECLARE v_min_cgpa DECIMAL(3,2);

    SELECT CGPA INTO v_student_cgpa FROM student WHERE student_id = NEW.student_id;
    SELECT COALESCE(min_cgpa, 0.00) INTO v_min_cgpa FROM internship WHERE internship_id = NEW.internship_id;

    IF v_min_cgpa > 0.00 AND v_student_cgpa IS NOT NULL AND v_student_cgpa < v_min_cgpa THEN
        SET NEW.status = 'Rejected';
        SET NEW.cover_letter = CONCAT('[AUTO-DISCARDED: Student CGPA (', v_student_cgpa, ') is below minimum required (', v_min_cgpa, ')] ', COALESCE(NEW.cover_letter, ''));
    END IF;
END$$
DELIMITER ;

-- Stored Procedure: sp_auto_discard_by_cgpa
-- Purpose: Batch-discards all pending applicants for a given internship whose CGPA is below a specified cutoff.
DROP PROCEDURE IF EXISTS sp_auto_discard_by_cgpa;

DELIMITER $$
CREATE PROCEDURE sp_auto_discard_by_cgpa(
    IN p_internship_id INT,
    IN p_min_cgpa DECIMAL(3,2),
    OUT p_discarded_count INT
)
BEGIN
    SELECT COUNT(*) INTO p_discarded_count
    FROM application a
    JOIN student s ON a.student_id = s.student_id
    WHERE a.internship_id = p_internship_id
      AND a.status = 'Pending'
      AND s.CGPA < p_min_cgpa;

    UPDATE application a
    JOIN student s ON a.student_id = s.student_id
    SET a.status = 'Rejected',
        a.cover_letter = CONCAT('[AUTO-DISCARDED: Student CGPA (', s.CGPA, ') is below criteria threshold (', p_min_cgpa, ')] ', COALESCE(a.cover_letter, ''))
    WHERE a.internship_id = p_internship_id
      AND a.status = 'Pending'
      AND s.CGPA < p_min_cgpa;
END$$
DELIMITER ;


-- ----------------------------------------------------------------------------
-- 5. VERIFICATION & TEST SCRIPTS (Run to demonstrate to your examiner)
-- ----------------------------------------------------------------------------

-- Test Views
SELECT * FROM v_open_internships LIMIT 5;
SELECT application_id, student_name, internship_title, company_name, application_status 
FROM v_student_application_details LIMIT 5;

-- Test User-Defined Function
SELECT student_id, name, department, fn_student_skill_count(student_id) AS verified_skills 
FROM student;

-- Test Stored Procedure
CALL sp_get_company_analytics(1, @total_internships, @total_applications, @shortlisted);
SELECT 
    @total_internships AS total_listings,
    @total_applications AS total_applicants,
    @shortlisted AS shortlisted_candidates;
