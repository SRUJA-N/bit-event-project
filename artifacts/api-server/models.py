from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="student")
    department = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    venue = Column(String, nullable=False)
    department = Column(String, nullable=False)
    image_url = Column(String)
    rules = Column(Text)
    registration_fee = Column(Integer, default=0)
    total_slots = Column(Integer, nullable=False)
    available_slots = Column(Integer, nullable=False)
    payment_qr_url = Column(String)
    status = Column(String, default="pending")
    created_by_faculty_id = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())

class Registration(Base):
    __tablename__ = "registrations"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, nullable=False)
    student_id = Column(Integer, nullable=False)
    payment_screenshot_url = Column(String)
    payment_status = Column(String, default="pending")
    admin_comment = Column(Text)
    registered_at = Column(DateTime, server_default=func.now())

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, nullable=False)
    student_id = Column(Integer, nullable=False)
    rating = Column(Integer, nullable=False)
    comments = Column(Text)
    custom_responses = Column(Text)
    submitted_at = Column(DateTime, server_default=func.now())
