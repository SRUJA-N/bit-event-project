import pg from "pg";
import bcrypt from "bcryptjs";

const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const hash = (pw) => bcrypt.hashSync(pw, 10);

console.log("🌱 Seeding database...");

// Clear existing data (in dependency order)
await client.query("DELETE FROM feedback");
await client.query("DELETE FROM registrations");
await client.query("DELETE FROM events");
await client.query("DELETE FROM users");
await client.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
await client.query("ALTER SEQUENCE events_id_seq RESTART WITH 1");
await client.query("ALTER SEQUENCE registrations_id_seq RESTART WITH 1");
await client.query("ALTER SEQUENCE feedback_id_seq RESTART WITH 1");

// ── USERS ──────────────────────────────────────────────────
const users = await client.query(`
  INSERT INTO users (name, email, password_hash, role, department) VALUES
    ('Dr. Admin Kumar',     'admin@bit.edu',          $1, 'admin',   'CSE-ICB'),
    ('Prof. Ravi Shankar',  'faculty@bit.edu',         $2, 'faculty', 'CSE-ICB'),
    ('Prof. Meena Iyer',    'meena.iyer@bit.edu',      $3, 'faculty', 'CSE'),
    ('Arjun Reddy',         'arjun@student.bit.edu',   $4, 'student', 'CSE-ICB'),
    ('Priya Nair',          'priya@student.bit.edu',   $5, 'student', 'CSE-ICB'),
    ('Kiran Sharma',        'kiran@student.bit.edu',   $6, 'student', 'CSE'),
    ('Divya Menon',         'divya@student.bit.edu',   $7, 'student', 'AI&ML'),
    ('Rohan Gupta',         'rohan@student.bit.edu',   $8, 'student', 'CSE-ICB'),
    ('Sneha Patel',         'sneha@student.bit.edu',   $9, 'student', 'ISE'),
    ('Aditya Verma',        'aditya@student.bit.edu',  $10,'student', 'ECE')
  RETURNING id, name, role
`,
  Array.from({ length: 10 }, () => hash("password123"))
);

const userMap = {};
users.rows.forEach(u => { userMap[u.name] = u.id; });
console.log("✅ Users seeded:", users.rows.map(u => `${u.name} (${u.role})`).join(", "));

const facultyId1 = userMap["Prof. Ravi Shankar"];
const facultyId2 = userMap["Prof. Meena Iyer"];
const s1 = userMap["Arjun Reddy"];
const s2 = userMap["Priya Nair"];
const s3 = userMap["Kiran Sharma"];
const s4 = userMap["Divya Menon"];
const s5 = userMap["Rohan Gupta"];
const s6 = userMap["Sneha Patel"];
const s7 = userMap["Aditya Verma"];

// ── EVENTS ─────────────────────────────────────────────────
const events = await client.query(`
  INSERT INTO events (title, description, date, time, venue, department, rules, registration_fee, total_slots, available_slots, created_by_faculty_id, status) VALUES
    (
      'Blockchain Hackathon 2026',
      'A 24-hour hackathon focused on building decentralized applications using Ethereum and Solidity. Teams of 2–4 will compete for prizes worth Rs. 50,000. Mentors from industry will guide participants throughout the event.',
      '2026-06-15', '09:00 AM', 'Seminar Hall A, Block C', 'CSE-ICB',
      '1. Teams of 2–4 members only.\n2. Use of pre-built smart contract templates is not allowed.\n3. Final presentations must be under 10 minutes.\n4. Plagiarism will lead to disqualification.',
      500, 80, 53, $1, 'approved'
    ),
    (
      'IoT Workshop: Smart Agriculture',
      'Hands-on workshop on building IoT solutions for precision farming. Participants will build a soil-moisture sensor node using Arduino and ESP8266, and visualise live data on a cloud dashboard.',
      '2026-06-22', '10:00 AM', 'IoT Lab, Block D', 'CSE-ICB',
      '1. Bring your own laptop.\n2. Arduino IDE must be pre-installed.\n3. Components will be provided.\n4. Certificate of participation for all attendees.',
      200, 40, 22, $1, 'approved'
    ),
    (
      'Cybersecurity CTF Challenge',
      'Capture The Flag competition testing skills in web security, cryptography, reverse engineering, and forensics. Solo participation. Difficulty levels range from beginner to advanced.',
      '2026-07-05', '11:00 AM', 'Computer Lab 3, Block B', 'CSE-ICB',
      '1. Solo participation only.\n2. No external tools beyond those listed in the resource kit.\n3. VPN usage is prohibited.\n4. Winners announced within 24 hours.',
      0, 60, 34, $1, 'approved'
    ),
    (
      'AI & ML Symposium 2026',
      'A full-day symposium featuring talks by researchers and industry professionals on the latest trends in Artificial Intelligence and Machine Learning, including LLMs, computer vision, and federated learning.',
      '2026-07-18', '09:30 AM', 'Main Auditorium', 'AI&ML',
      '1. Open to all departments.\n2. Register early — seats are limited.\n3. Dress code: business casual.\n4. Lunch will be provided.',
      300, 150, 91, $2, 'approved'
    ),
    (
      'Web Development Bootcamp',
      'Intensive 3-day bootcamp covering HTML, CSS, JavaScript, React, and Node.js. Ideal for beginners wanting to build their first full-stack web application from scratch.',
      '2026-08-10', '09:00 AM', 'CS Seminar Hall, Block A', 'CSE',
      '1. Laptop mandatory.\n2. No prior experience required.\n3. Attendance on all 3 days is compulsory for certificate.\n4. Limited to 30 participants.',
      150, 30, 30, $2, 'pending'
    ),
    (
      'Open Source Contribution Day',
      'Join fellow students in contributing to real open-source projects on GitHub. Mentors will help you find beginner-friendly issues, submit pull requests, and understand the open-source workflow.',
      '2026-08-25', '10:00 AM', 'Innovation Hub, Block E', 'CSE-ICB',
      '1. GitHub account required.\n2. Git basics must be known.\n3. Bring laptop.\n4. All skill levels welcome.',
      0, 50, 50, $1, 'pending'
    )
  RETURNING id, title
`, [facultyId1, facultyId2]);

const eventMap = {};
events.rows.forEach(e => { eventMap[e.title] = e.id; });
console.log("✅ Events seeded:", events.rows.map(e => e.title).join(", "));

const eBlockchain = eventMap["Blockchain Hackathon 2026"];
const eIoT        = eventMap["IoT Workshop: Smart Agriculture"];
const eCTF        = eventMap["Cybersecurity CTF Challenge"];
const eAI         = eventMap["AI & ML Symposium 2026"];

// ── REGISTRATIONS ──────────────────────────────────────────
await client.query(`
  INSERT INTO registrations (event_id, student_id, payment_screenshot_url, payment_status, admin_comment) VALUES
    ($1, $2,  null, 'approved',  'Payment verified. Welcome to the hackathon!'),
    ($1, $3,  null, 'approved',  'Confirmed. See you at 9 AM sharp.'),
    ($1, $4,  null, 'rejected',  'Transaction ID provided was invalid. Please re-register with correct proof.'),
    ($1, $5,  null, 'pending',   null),
    ($1, $6,  null, 'approved',  'All good. Registration confirmed.'),

    ($7, $2,  null, 'approved',  'Payment of Rs. 200 received. Spot confirmed.'),
    ($7, $8,  null, 'approved',  'Welcome! Please bring your Arduino kit.'),
    ($7, $9,  null, 'pending',   null),

    ($10,$2,  null, 'approved',  null),
    ($10,$3,  null, 'approved',  null),
    ($10,$4,  null, 'approved',  null),
    ($10,$5,  null, 'approved',  null),
    ($10,$6,  null, 'pending',   null),
    ($10,$8,  null, 'rejected',  'Your department is not eligible for this slot. Please contact admin.'),

    ($11,$2,  null, 'approved',  'Rs. 300 payment received.'),
    ($11,$3,  null, 'approved',  'Confirmed.'),
    ($11,$4,  null, 'approved',  'Confirmed.'),
    ($11,$9,  null, 'pending',   null)
`,
  [eBlockchain, s1, s2, s3, s4, s5,
   eIoT, s1, s6, s7,
   eCTF, s1, s2, s3, s4, s5, s6,
   eAI, s1, s2, s3, s7]
);
console.log("✅ Registrations seeded");

// ── FEEDBACK ───────────────────────────────────────────────
await client.query(`
  INSERT INTO feedback (event_id, student_id, rating, comments, custom_responses) VALUES
    ($1, $2, 5, 'Absolutely brilliant event! The mentors were very helpful and the problem statements were industry-grade.', '{"favourite_part":"Mentorship sessions","would_attend_again":"Yes"}'),
    ($1, $3, 4, 'Great experience overall. Venue was a bit cramped but the content was top-notch.', '{"favourite_part":"Networking","would_attend_again":"Yes"}'),
    ($1, $4, 5, 'Loved the blockchain theme. Learned so much in 24 hours.', '{"favourite_part":"Live coding challenge","would_attend_again":"Yes"}'),

    ($5, $2, 4, 'Very practical workshop. Got my sensor working by lunchtime!', '{"favourite_part":"Hands-on hardware","would_attend_again":"Yes"}'),
    ($5, $7, 3, 'Content was good but a bit fast-paced for beginners.', '{"favourite_part":"Cloud dashboard demo","would_attend_again":"Maybe"}'),

    ($6, $2, 5, 'Best CTF I have ever participated in. Great variety of challenges.', '{"favourite_part":"Cryptography puzzles","would_attend_again":"Yes"}'),
    ($6, $3, 4, 'Fun and challenging. Would love a harder forensics category next time.', '{"favourite_part":"Web exploitation","would_attend_again":"Yes"}'),
    ($6, $4, 4, 'Well organised. Prize distribution was fair and transparent.', '{"favourite_part":"Reverse engineering","would_attend_again":"Yes"}')
`,
  [eBlockchain, s1, s2, s3,
   eIoT, s1, s6,
   eCTF, s1, s2, s3]
);
console.log("✅ Feedback seeded");

await client.end();

console.log("\n🎉 Seed complete! Demo credentials:");
console.log("  Admin:   admin@bit.edu     / password123");
console.log("  Faculty: faculty@bit.edu   / password123");
console.log("  Student: arjun@student.bit.edu / password123");
