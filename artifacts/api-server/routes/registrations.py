from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
from auth_utils import get_current_user, require_roles

router = APIRouter()

def fmt_user(u):
    if not u:
        return None
    return {
        "id": u.id, "name": u.name, "email": u.email,
        "role": u.role, "department": u.department,
        "createdAt": u.created_at.isoformat() if u.created_at else "",
    }

def fmt_event(e):
    if not e:
        return None
    return {
        "id": e.id, "title": e.title, "description": e.description,
        "date": e.date, "time": e.time, "venue": e.venue,
        "department": e.department, "imageUrl": e.image_url,
        "rules": e.rules, "registrationFee": e.registration_fee,
        "totalSlots": e.total_slots, "availableSlots": e.available_slots,
        "paymentQrUrl": e.payment_qr_url, "status": e.status,
        "createdByFacultyId": e.created_by_faculty_id, "createdByFacultyName": None,
        "createdAt": e.created_at.isoformat() if e.created_at else "",
    }

def fmt_reg(r, event=None, student=None):
    return {
        "id": r.id, "eventId": r.event_id, "studentId": r.student_id,
        "paymentScreenshotUrl": r.payment_screenshot_url,
        "paymentStatus": r.payment_status,
        "adminComment": r.admin_comment,
        "registeredAt": r.registered_at.isoformat() if r.registered_at else "",
        "event": fmt_event(event),
        "student": fmt_user(student),
    }

class CreateRegistrationBody(BaseModel):
    eventId: int
    paymentScreenshotUrl: Optional[str] = None

@router.post("/registrations", status_code=201)
def create_registration(
    body: CreateRegistrationBody,
    current_user: models.User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    event = db.query(models.Event).filter(models.Event.id == body.eventId).first()
    if not event:
        raise HTTPException(404, detail="Event not found")
    if event.status != "approved":
        raise HTTPException(400, detail="Event is not open for registration")
    if event.available_slots <= 0:
        raise HTTPException(400, detail="No slots available")

    existing = db.query(models.Registration).filter(
        models.Registration.event_id == body.eventId,
        models.Registration.student_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(400, detail="Already registered for this event")

    reg = models.Registration(
        event_id=body.eventId,
        student_id=current_user.id,
        payment_screenshot_url=body.paymentScreenshotUrl,
        payment_status="pending",
    )
    db.add(reg)
    event.available_slots -= 1
    db.commit()
    db.refresh(reg)
    db.refresh(event)
    return fmt_reg(reg, event)

@router.get("/registrations/my")
def my_registrations(
    current_user: models.User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    regs = db.query(models.Registration).filter(
        models.Registration.student_id == current_user.id
    ).all()
    all_events = {e.id: e for e in db.query(models.Event).all()}
    return [fmt_reg(r, all_events.get(r.event_id)) for r in regs]

class ReviewBody(BaseModel):
    paymentStatus: str
    adminComment: Optional[str] = None

@router.patch("/registrations/{reg_id}/review")
def review_registration(
    reg_id: int,
    body: ReviewBody,
    current_user: models.User = Depends(require_roles("admin", "faculty")),
    db: Session = Depends(get_db),
):
    reg = db.query(models.Registration).filter(models.Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(404, detail="Registration not found")

    old_status = reg.payment_status
    reg.payment_status = body.paymentStatus
    reg.admin_comment = body.adminComment

    if body.paymentStatus == "rejected" and old_status != "rejected":
        event = db.query(models.Event).filter(models.Event.id == reg.event_id).first()
        if event:
            event.available_slots += 1

    db.commit()
    db.refresh(reg)
    event = db.query(models.Event).filter(models.Event.id == reg.event_id).first()
    student = db.query(models.User).filter(models.User.id == reg.student_id).first()
    return fmt_reg(reg, event, student)
