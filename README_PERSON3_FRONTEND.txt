SKILLSYNC PERSON 3 FRONTEND DESIGN PACK

This pack supplies responsive CSS and a small JavaScript enhancement layer for the PHP pages already supplied to Person 2. It is a styling/integration pack, not a separate static website: the PHP pages continue to render and process forms.

INSTALL
1. Unzip this pack.
2. Copy the assets folder into your existing project folder, e.g. C:\xampp\htdocs\skillsync\assets\
   Final paths:
   C:\xampp\htdocs\skillsync\assets\css\style.css
   C:\xampp\htdocs\skillsync\assets\js\app.js

CONNECT IT TO PHP
Open C:\xampp\htdocs\skillsync\includes\bootstrap.php.
Find function page(string $title,string $body): void.
Inside its HTML <head>, replace the old inline <style>...</style> block with:
<link rel="stylesheet" href="/skillsync/assets/css/style.css">
Then just before </body>, add:
<script src="/skillsync/assets/js/app.js" defer></script>

Keep the rest of page() intact, including the PHP-generated title, navigation, and body. Do not replace database.php or the PHP form processing.

TEST
1. Start Apache in XAMPP.
2. Confirm your MySQL server is running and database credentials in config/database.php match it.
3. Visit http://localhost/skillsync/
4. Hard refresh with Ctrl+F5 if the new style does not appear.

NOTE
If you name the project folder something other than skillsync, update /skillsync/ in both asset paths.
Google Fonts are optional; if internet is unavailable, fallback fonts are used.
