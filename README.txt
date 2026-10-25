SKILLSYNC PHP STARTER - WITHOUT PERSON 3 FRONTEND

1. Extract this ZIP.
2. Copy the contents of the skillsync_php folder into C:\xampp\htdocs\skillsync\
3. Start Apache and MySQL in XAMPP.
4. Run Person 1's schema SQL first, then sample-data SQL, in MySQL Workbench.
5. Edit config/database.php if your MySQL credentials differ.
6. Open http://localhost/skillsync/
7. Register a NEW Student or Company account to test. The sample password_hash strings in sample SQL are dummy text, not valid password_hash() outputs.
8. Admin dashboard requires an existing user_account with role Admin and a matching row in admin. Create one locally with a real PHP password_hash value.
9. Resume currently stores a path/URL string; secure file uploads are not implemented.
10. Confirm exact columns with Person 1's final schema before submission. This starter assumes the tables and columns from the shared SkillSync schema. It does not alter your database schema.
11. For a course project, test each role and keep your DB credentials private. Do not deploy this starter publicly without a security review.
