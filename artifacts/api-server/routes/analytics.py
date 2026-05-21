from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from auth_utils import require_roles

router = APIRouter()

@router.get("/analytics/registrations")
def analytics_registrations(
    current_user: models.User = Depends(require_roles("admin", "faculty")),
    db: Session = Depends(get_db),
):
    regs = db.query(models.Registration).all()
    return [
        {
            "id": r.id, "eventId": r.event_id, "studentId": r.student_id,
            "paymentStatus": r.payment_status, "adminComment": r.admin_comment,
            "registeredAt": r.registered_at.isoformat() if r.registered_at else "",
        }
        for r in regs
    ]

@router.get("/analytics/feedback")
def analytics_feedback(
    current_user: models.User = Depends(require_roles("admin", "faculty")),
    db: Session = Depends(get_db),
):
    feedbacks = db.query(models.Feedback).all()
    return [
        {
            "id": f.id, "eventId": f.event_id, "studentId": f.student_id,
            "rating": f.rating, "comments": f.comments,
            "submittedAt": f.submitted_at.isoformat() if f.submitted_at else "",
        }
        for f in feedbacks
    ]
