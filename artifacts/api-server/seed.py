import os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
import models
from auth_utils import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("Clearing existing data...")
db.query(models.Feedback).delete()
db.query(models.Registration).delete()
db.query(models.Event).delete()
db.query(models.User).delete()
db.commit()

print("Seeding users...")
pw = hash_password("password123")
users_data = [
    ("Dr. Admin Kumar",    "admin@bit.edu",             "admin",   "CSE-ICB"),
    ("Prof. Ravi Shankar", "faculty@bit.edu",            "faculty", "CSE-ICB"),
    ("Prof. Meena Iyer",   "meena.iyer@bit.edu",         "faculty", "CSE"),
    ("Arjun Reddy",        "arjun@student.bit.edu",      "student", "CSE-ICB"),
    ("Priya Nair",         "priya@student.bit.edu",       "student", "CSE-ICB"),
    ("Kiran Sharma",       "kiran@student.bit.edu",       "student", "CSE"),
    ("Divya Menon",        "divya@student.bit.edu",       "student", "AI&ML"),
    ("Rohan Gupta",        "rohan@student.bit.edu",       "student", "CSE-ICB"),
    ("Sneha Patel",        "sneha@student.bit.edu",       "student", "ISE"),
    ("Aditya Verma",       "aditya@student.bit.edu",      "student", "ECE"),
]
users = []
for name, email, role, dept in users_data:
    u = models.User(name=name, email=email, password_hash=pw, role=role, department=dept)
    db.add(u)
    users.append(u)
db.commit()
for u in users:
    db.refresh(u)

admin   = users[0]
fac1    = users[1]
fac2    = users[2]
s1,s2,s3,s4,s5,s6,s7 = users[3], users[4], users[5], users[6], users[7], users[8], users[9]

print("Seeding events...")
events_data = [
    dict(title="Blockchain Hackathon 2026",
         description="A 24-hour hackathon focused on building decentralized applications using Ethereum and Solidity. Teams of 2-4 will compete for prizes worth Rs. 50,000.",
         date="2026-06-15", time="09:00 AM", venue="Seminar Hall A, Block C", department="CSE-ICB",
         rules="1. Teams of 2-4 members only.\n2. No pre-built templates.\n3. Presentations under 10 minutes.",
         registration_fee=500, total_slots=80, available_slots=53, created_by_faculty_id=fac1.id, status="approved"),
    dict(title="IoT Workshop: Smart Agriculture",
         description="Hands-on workshop on building IoT solutions for precision farming using Arduino and ESP8266.",
         date="2026-06-22", time="10:00 AM", venue="IoT Lab, Block D", department="CSE-ICB",
         rules="1. Bring your own laptop.\n2. Arduino IDE must be pre-installed.\n3. Components will be provided.",
         registration_fee=200, total_slots=40, available_slots=22, created_by_faculty_id=fac1.id, status="approved"),
    dict(title="Cybersecurity CTF Challenge",
         description="Capture The Flag competition testing skills in web security, cryptography, reverse engineering, and forensics.",
         date="2026-07-05", time="11:00 AM", venue="Computer Lab 3, Block B", department="CSE-ICB",
         rules="1. Solo participation only.\n2. No external tools beyond the resource kit.\n3. VPN usage is prohibited.",
         registration_fee=0, total_slots=60, available_slots=34, created_by_faculty_id=fac1.id, status="approved"),
    dict(title="AI & ML Symposium 2026",
         description="A full-day symposium featuring talks on the latest trends in AI and ML, including LLMs, computer vision, and federated learning.",
         date="2026-07-18", time="09:30 AM", venue="Main Auditorium", department="AI&ML",
         rules="1. Open to all departments.\n2. Register early - seats are limited.\n3. Lunch will be provided.",
         registration_fee=300, total_slots=150, available_slots=91, created_by_faculty_id=fac2.id, status="approved"),
    dict(title="Web Development Bootcamp",
         description="Intensive 3-day bootcamp covering HTML, CSS, JavaScript, React, and Node.js.",
         date="2026-08-10", time="09:00 AM", venue="CS Seminar Hall, Block A", department="CSE",
         rules="1. Laptop mandatory.\n2. No prior experience required.\n3. All 3 days attendance compulsory.",
         registration_fee=150, total_slots=30, available_slots=30, created_by_faculty_id=fac2.id, status="pending"),
    dict(title="Open Source Contribution Day",
         description="Join fellow students in contributing to real open-source projects on GitHub.",
         date="2026-08-25", time="10:00 AM", venue="Innovation Hub, Block E", department="CSE-ICB",
         rules="1. GitHub account required.\n2. Git basics must be known.\n3. All skill levels welcome.",
         registration_fee=0, total_slots=50, available_slots=50, created_by_faculty_id=fac1.id, status="pending"),
]
events = []
for ed in events_data:
    ev = models.Event(**ed)
    db.add(ev)
    events.append(ev)
db.commit()
for ev in events:
    db.refresh(ev)

e1,e2,e3,e4 = events[0], events[1], events[2], events[3]

print("Seeding registrations...")
regs_data = [
    (e1,s1,"approved","Payment verified. Welcome to the hackathon!"),
    (e1,s2,"approved","Confirmed. See you at 9 AM sharp."),
    (e1,s3,"rejected","Transaction ID provided was invalid. Please re-register with correct proof."),
    (e1,s4,"pending",None),
    (e1,s5,"approved","All good. Registration confirmed."),
    (e2,s1,"approved","Payment of Rs. 200 received. Spot confirmed."),
    (e2,s6,"approved","Welcome! Please bring your Arduino kit."),
    (e2,s7,"pending",None),
    (e3,s1,"approved",None),
    (e3,s2,"approved",None),
    (e3,s3,"approved",None),
    (e3,s4,"approved",None),
    (e3,s5,"pending",None),
    (e3,s6,"rejected","Your department is not eligible for this slot."),
    (e4,s1,"approved","Rs. 300 payment received."),
    (e4,s2,"approved","Confirmed."),
    (e4,s3,"approved","Confirmed."),
    (e4,s7,"pending",None),
]
for ev, st, status, comment in regs_data:
    r = models.Registration(
        event_id=ev.id, student_id=st.id,
        payment_status=status, admin_comment=comment,
    )
    db.add(r)
db.commit()

print("Seeding feedback...")
fb_data = [
    (e1,s1,5,"Absolutely brilliant event! The mentors were very helpful and the problem statements were industry-grade."),
    (e1,s2,4,"Great experience overall. Venue was a bit cramped but the content was top-notch."),
    (e1,s3,5,"Loved the blockchain theme. Learned so much in 24 hours."),
    (e2,s1,4,"Very practical workshop. Got my sensor working by lunchtime!"),
    (e2,s6,3,"Content was good but a bit fast-paced for beginners."),
    (e3,s1,5,"Best CTF I have ever participated in. Great variety of challenges."),
    (e3,s2,4,"Fun and challenging. Would love a harder forensics category next time."),
    (e3,s3,4,"Well organised. Prize distribution was fair and transparent."),
]
for ev, st, rating, comment in fb_data:
    f = models.Feedback(event_id=ev.id, student_id=st.id, rating=rating, comments=comment)
    db.add(f)
db.commit()
db.close()

print("")
print("Seed complete! Demo credentials (password: password123):")
print("  Admin:   admin@bit.edu")
print("  Faculty: faculty@bit.edu")
print("  Student: arjun@student.bit.edu")
