CREATE INDEX idx_internship_company
ON internship(company_id);

CREATE INDEX idx_internship_status
ON internship(status);

CREATE INDEX idx_application_student
ON application(student_id);

CREATE INDEX idx_application_internship
ON application(internship_id);

CREATE INDEX idx_application_status
ON application(status);

CREATE INDEX idx_student_skill_skill
ON student_skill(skill_id);

CREATE INDEX idx_internship_skill_skill
ON internship_skill(skill_id);