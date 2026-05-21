from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
from auth_utils import get_current_user, require_roles

router = APIRouter()

def fmt_event(e, faculty_name=None):
    return {
        "id": e.id,
        "title": e.title,
        "description": e.description,
        "date": e.date,
        "time": e.time,
        "venue": e.venue,
        "department": e.department,
        "imageUrl": e.image_url,
        "rules": e.rules,
        "registrationFee": e.registration_fee,
        "totalSlots": e.total_slots,
        "availableSlots": e.available_slots,
        "paymentQrUrl": e.payment_qr_url,
        "status": e.status,
        "createdByFacultyId": e.created_by_faculty_id,
        "createdByFacultyName": faculty_name,
        "createdAt": e.created_at.isoformat() if e.created_at else "",
    }

def fmt_user(u):
    return {
        "id": u.id, "name": u.name, "email": u.email,
        "role": u.role, "department": u.department,
        "createdAt": u.created_at.isoformat() if u.created_at else "",
    }

@router.get("/events")
def list_events(
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.Event)
    if department:
        q = q.filter(models.Event.department == department)
    if status:
        q = q.filter(models.Event.status == status)
    if search:
        q = q.filter(models.Event.title.ilike(f"%{search}%"))
    events = q.order_by(models.Event.created_at).all()

    faculty_ids = list({e.created_by_faculty_id for e in events if e.created_by_faculty_id})
    faculty_map = {}
    if faculty_ids:
        for f in db.query(models.User).all():
            faculty_map[f.id] = f.name

    return [fmt_event(e, faculty_map.get(e.created_by_faculty_id)) for e in events]

@router.get("/events/stats")
def event_stats(
    current_user: models.User = Depends(require_roles("admin", "faculty")),
    db: Session = Depends(get_db),
):
    all_events = db.query(models.Event).all()
    all_regs = db.query(models.Registration).all()
    approved_regs = [r for r in all_regs if r.payment_status == "approved"]
    total_revenue = sum(
        next((e.registration_fee for e in all_events if e.id == r.event_id), 0)
        for r in approved_regs
    )
    dept_counts = {}
    for e in all_events:
        dept_counts[e.department] = dept_counts.get(e.department, 0) + 1

    return {
        "totalEvents": len(all_events),
        "approvedEvents": sum(1 for e in all_events if e.status == "approved"),
        "pendingEvents": sum(1 for e in all_events if e.status == "pending"),
        "totalRegistrations": len(all_regs),
        "totalRevenue": total_revenue,
        "departmentBreakdown": [{"department": d, "count": c} for d, c in dept_counts.items()],
    }

@router.get("/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    e = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not e:
        raise HTTPException(404, detail="Event not found")
    faculty_name = None
    if e.created_by_faculty_id:
        f = db.query(models.User).filter(models.User.id == e.created_by_faculty_id).first()
        faculty_name = f.name if f else None
    return fmt_event(e, faculty_name)

class CreateEventBody(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    time: str
    venue: str
    department: str
    imageUrl: Optional[str] = None
    rules: Optional[str] = None
    registrationFee: int = 0
    totalSlots: int
    paymentQrUrl: Optional[str] = None

@router.post("/events", status_code=201)
def create_event(
    body: CreateEventBody,
    current_user: models.User = Depends(require_roles("admin", "faculty")),
    db: Session = Depends(get_db),
):
    e = models.Event(
        title=body.title,
        description=body.description,
        date=body.date,
        time=body.time,
        venue=body.venue,
        department=body.department,
        image_url=body.imageUrl,
        rules=body.rules,
        registration_fee=body.registrationFee,
        total_slots=body.totalSlots,
        available_slots=body.totalSlots,
        payment_qr_url=body.paymentQrUrl,
        created_by_faculty_id=current_user.id,
        status="pending",
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return fmt_event(e)

class UpdateEventBody(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    department: Optional[str] = None
    imageUrl: Optional[str] = None
    rules: Optional[str] = None
    registrationFee: Optional[int] = None
    totalSlots: Optional[int] = None
    paymentQrUrl: Optional[str] = None

@router.patch("/events/{event_id}")
def update_event(
    event_id: int,
    body: UpdateEventBody,
    current_user: models.User = Depends(require_roles("admin", "faculty")),
    db: Session = Depends(get_db),
):
    e = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not e:
        raise HTTPException(404, detail="Event not found")
    data = body.model_dump(exclude_none=True)
    field_map = {
        "imageUrl": "image_url", "registrationFee": "registration_fee",
        "totalSlots": "total_slots", "paymentQrUrl": "payment_qr_url",
    }
    for k, v in data.items():
        setattr(e, field_map.get(k, k), v)
    db.commit()
    db.refresh(e)
    return fmt_event(e)

@router.delete("/events/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    current_user: models.User = Depends(require_roles("admin", "faculty")),
    db: Session = Depends(get_db),
):
    e = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not e:
        raise HTTPException(404, detail="Event not found")
    db.delete(e)
    db.commit()

class ApproveBody(BaseModel):
    status: str

@router.patch("/events/{event_id}/approve")
def approve_event(
    event_id: int,
    body: ApproveBody,
    current_user: models.User = Depends(require_roles("admin", "faculty")),
    db: Session = Depends(get_db),
):
    e = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not e:
        raise HTTPException(404, detail="Event not found")
    e.status = body.status
    db.commit()
    db.refresh(e)
    return fmt_event(e)

@router.get("/events/{event_id}/registrations")
def event_registrations(
    event_id: int,
    current_user: models.User = Depends(require_roles("admin", "faculty")),
    db: Session = Depends(get_db),
):
    e = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not e:
        raise HTTPException(404, detail="Event not found")
    regs = db.query(models.Registration).filter(models.Registration.event_id == event_id).all()
    all_users = {u.id: u for u in db.query(models.User).all()}
    return [
        {
            "id": r.id, "eventId": r.event_id, "studentId": r.student_id,
            "paymentScreenshotUrl": r.payment_screenshot_url,
            "paymentStatus": r.payment_status,
            "adminComment": r.admin_comment,
            "registeredAt": r.registered_at.isoformat() if r.registered_at else "",
            "event": fmt_event(e),
            "student": fmt_user(all_users[r.student_id]) if r.student_id in all_users else None,
        }
        for r in regs
    ]

@router.get("/events/{event_id}/feedback")
def event_feedback(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    feedbacks = db.query(models.Feedback).filter(models.Feedback.event_id == event_id).all()
    all_users = {u.id: u for u in db.query(models.User).all()}
    return [
        {
            "id": f.id, "eventId": f.event_id, "studentId": f.student_id,
            "rating": f.rating, "comments": f.comments,
            "customResponses": f.custom_responses,
            "submittedAt": f.submitted_at.isoformat() if f.submitted_at else "",
            "student": fmt_user(all_users[f.student_id]) if f.student_id in all_users else None,
        }
        for f in feedbacks
    ]
