USE skillsync_db;

INSERT INTO user_account
(email, password_hash, role)
VALUES
('richa@gmail.com', 'hashed_pass_123', 'Student'),
('aisha@gmail.com', 'hashed_pass_456', 'Student'),
('techcorp@gmail.com', 'hashed_pass_789', 'Company'),
('infosys@gmail.com', 'hashed_pass_101', 'Company'),
('admin@skillsync.com', 'hashed_admin_123', 'Admin');

INSERT INTO student
(user_id, name, phone, department, year, CGPA, resume)
VALUES
(1, 'Richa Sharma', '9876543210', 'Computer Science', 2, 8.70, 'richa_resume.pdf'),
(2, 'Aisha Patel', '9876501234', 'Information Technology', 2, 9.10, 'aisha_resume.pdf');

INSERT INTO company
(user_id, company_name, phone, website, location, industry)
VALUES
(3, 'TechCorp Solutions', '9876112233', 'www.techcorp.com', 'Bangalore', 'Software'),
(4, 'Infosys', '9876445566', 'www.infosys.com', 'Pune', 'IT Services');

INSERT INTO admin
(user_id, name)
VALUES
(5, 'System Administrator');

INSERT INTO skill
(skill_name, skill_category)
VALUES
('C++', 'Programming'),
('Python', 'Programming'),
('SQL', 'Database'),
('React', 'Web Development'),
('Java', 'Programming');

INSERT INTO internship
(company_id, title, description, location, duration, stipend, start_date, deadline, status)
VALUES
(1, 'Software Development Intern',
 'Work on software development and backend applications.',
 'Bangalore', '3 Months', 25000.00, '2026-11-01', '2026-10-20', 'Open'),

(1, 'Frontend Development Intern',
 'Develop and maintain responsive web applications.',
 'Bangalore', '6 Months', 30000.00, '2026-12-01', '2026-11-15', 'Open'),

(2, 'Data Analytics Intern',
 'Assist in data analysis and database-related projects.',
 'Pune', '3 Months', 22000.00, '2026-11-10', '2026-10-25', 'Open');
 
 INSERT INTO student_skill
(student_id, skill_id, proficiency_level)
VALUES
(1, 1, 'Intermediate'),
(1, 2, 'Advanced'),
(1, 3, 'Intermediate'),
(2, 2, 'Advanced'),
(2, 4, 'Intermediate'),
(2, 3, 'Advanced');

INSERT INTO internship_skill
(internship_id, skill_id, required_level)
VALUES
(1, 1, 'Intermediate'),
(1, 2, 'Intermediate'),
(2, 4, 'Intermediate'),
(2, 2, 'Basic'),
(3, 2, 'Intermediate'),
(3, 3, 'Advanced');

INSERT INTO application
(student_id, internship_id, application_date, status, resume, cover_letter)
VALUES
(1, 1, '2026-10-05', 'Shortlisted', 'richa_resume.pdf',
 'I am interested in the Software Development Internship.'),

(1, 3, '2026-10-06', 'Pending', 'richa_resume.pdf',
 'I am interested in the Data Analytics Internship.'),

(2, 2, '2026-10-06', 'Selected', 'aisha_resume.pdf',
 'I would like to apply for the Frontend Development Internship.');
 
 INSERT INTO interview
(application_id, interview_date, interview_time, mode, result, remarks)
VALUES
(1, '2026-10-15', '10:30:00', 'Online', 'Pending',
 'Technical interview scheduled.'),

(3, '2026-10-16', '14:00:00', 'Online', 'Selected',
 'Candidate selected after interview.');
 
SELECT * FROM user_account;
SELECT * FROM student;
SELECT * FROM company;
SELECT * FROM admin;
SELECT * FROM skill;
SELECT * FROM internship;
SELECT * FROM student_skill;
SELECT * FROM internship_skill;
SELECT * FROM application;
SELECT * FROM interview;