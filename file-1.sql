
USE skillsync_db;

CREATE TABLE user_account (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    account_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    department VARCHAR(100),
    year INT,
    CGPA DECIMAL(3,2),
    resume VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES user_account(user_id)
);

CREATE TABLE company (
    company_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    company_name VARCHAR(150) NOT NULL,
    phone VARCHAR(15),
    website VARCHAR(255),
    location VARCHAR(100),
    industry VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES user_account(user_id)
);

CREATE TABLE admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user_account(user_id)
);

CREATE TABLE skill (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    skill_category VARCHAR(100)
);

CREATE TABLE internship (
    internship_id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    location VARCHAR(100),
    duration VARCHAR(50),
    stipend DECIMAL(10,2),
    start_date DATE,
    deadline DATE,
    status VARCHAR(20) DEFAULT 'Open',
    FOREIGN KEY (company_id) REFERENCES company(company_id)
);

CREATE TABLE application (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    internship_id INT NOT NULL,
    application_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    resume VARCHAR(255),
    cover_letter TEXT,
    UNIQUE (student_id, internship_id),
    FOREIGN KEY (student_id) REFERENCES student(student_id),
    FOREIGN KEY (internship_id) REFERENCES internship(internship_id)
);

CREATE TABLE interview (
    interview_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL UNIQUE,
    interview_date DATE,
    interview_time TIME,
    mode VARCHAR(50),
    result VARCHAR(50),
    remarks TEXT,
    FOREIGN KEY (application_id) REFERENCES application(application_id)
);

CREATE TABLE student_skill (
    student_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level VARCHAR(30),
    PRIMARY KEY (student_id, skill_id),
    FOREIGN KEY (student_id) REFERENCES student(student_id),
    FOREIGN KEY (skill_id) REFERENCES skill(skill_id)
);

CREATE TABLE internship_skill (
    internship_id INT NOT NULL,
    skill_id INT NOT NULL,
    required_level VARCHAR(30),
    PRIMARY KEY (internship_id, skill_id),
    FOREIGN KEY (internship_id) REFERENCES internship(internship_id),
    FOREIGN KEY (skill_id) REFERENCES skill(skill_id)
);