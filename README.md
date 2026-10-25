# SkillSync — Student Skill & Internship Management System

SkillSync is a centralized, database-driven platform connecting students, companies, and college placement administrators for skill management, internship discovery, applicant evaluation, and interview scheduling.

---

## 🏗️ Architecture
- **Frontend**: Next.js (TypeScript, React, Tailwind CSS / Vanilla CSS) — [skillsync-frontend Repository](https://github.com/krisha1702/skillsync-frontend)
- **Backend / REST API**: PHP 8.x with native PDO, session-based authentication, CSRF validation, and JSON endpoints
- **Database**: MySQL (`skillsync_db`) normalized up to 3NF/BCNF with relational constraints, B-Tree indexes, triggers, and stored procedures

---

## 🗄️ Database Scripts & Schema (`skillsync_db`)
All database operations and assignments are organized into dedicated SQL scripts:

| Script | Purpose | Description |
| :--- | :--- | :--- |
| [`file-1.sql`](file:///c:/xampp/htdocs/skillsync/file-1.sql) | **DDL** | Database creation, 9 normalized relational tables, PKs, FKs, and cascade rules |
| [`file - 2.sql`](file:///c:/xampp/htdocs/skillsync/file%20-%202.sql) | **DML** | Initial seed data for users, students, companies, skills, internships, and applications |
| [`file - 3.sql`](file:///c:/xampp/htdocs/skillsync/file%20-%203.sql) | **Indexes** | B-Tree secondary indexes on foreign keys and frequently filtered columns |
| [`file - 4.sql`](file:///c:/xampp/htdocs/skillsync/file%20-%204.sql) | **Complex Queries** | 15 advanced SQL queries covering multi-table JOINs, GROUP BY aggregations, and subqueries |
| [`file - 5.sql`](file:///c:/xampp/htdocs/skillsync/file%20-%205.sql) | **Transactions** | Data modification, transactional updates, and referential integrity-safe deletes |
| [`file - 6.sql`](file:///c:/xampp/htdocs/skillsync/file%20-%206.sql) | **Advanced DBMS** | Views (`v_open_internships`), Stored Procedures (`sp_get_company_analytics`), Triggers (`trg_validate_application_deadline`), and Functions (`fn_student_skill_count`) |

---

## 📄 Project Documentation & Report
The complete DBMS academic report covering requirements analysis, conceptual ER diagrams, ER-to-Relational conversion, normalization proofs, schema dictionaries, and test cases is provided in:
- [**`SkillSync_Report_Revised.docx`**](file:///c:/xampp/htdocs/skillsync/SkillSync_Report_Revised.docx)

---

## 👥 Default Demo Credentials

| Role | Email | Password | Dashboard Features |
| :--- | :--- | :--- | :--- |
| **Student** | `rahul.sharma@example.com` | `Student@123` | Browse jobs, apply with cover letter, track status, add/remove skills |
| **Company** | `contact@techcorp.com` | `Company@123` | Post new internships, review applicants, update status (Shortlist/Accept/Reject) |
| **Admin** | `admin@skillsync.com` | `Admin@123` | System overview KPIs, searchable student & company directories |

---

## 🚀 Setup & Execution Instructions

### 1. Database Setup
1. Start **Apache** and **MySQL** in XAMPP.
2. Open phpMyAdmin (`http://localhost/phpmyadmin`) or MySQL CLI.
3. Import the SQL scripts in sequence:
   ```sql
   source file-1.sql;
   source file - 2.sql;
   source file - 3.sql;
   source file - 6.sql;
   ```
4. Run `php setup_admin.php` to initialize admin credentials.

### 2. Backend Setup
Place this repository under your XAMPP web root:
`C:\xampp\htdocs\skillsync`
The PHP REST APIs are immediately accessible at `http://localhost/skillsync/api/`.

### 3. Frontend Setup
See the [skillsync-frontend repository](https://github.com/krisha1702/skillsync-frontend):
```bash
cd skillsync-frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
