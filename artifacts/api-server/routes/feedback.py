from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
from auth_utils import require_roles

router = APIRouter()

class FeedbackBody(BaseModel):
    eventId: int
    rating: int
    comments: Optional[str] = None
    customResponses: Optional[str] = None

@router.post("/feedback", status_code=201)
def submit_feedback(
    body: FeedbackBody,
    current_user: models.User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    fb = models.Feedback(
        event_id=body.eventId,
        student_id=current_user.id,
        rating=body.rating,
        comments=body.comments,
        custom_responses=body.customResponses,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return {
        "id": fb.id, "eventId": fb.event_id, "studentId": fb.student_id,
        "rating": fb.rating, "comments": fb.comments,
        "customResponses": fb.custom_responses,
        "submittedAt": fb.submitted_at.isoformat() if fb.submitted_at else "",
        "student": {
            "id": current_user.id, "name": current_user.name,
            "email": current_user.email, "role": current_user.role,
            "department": current_user.department,
            "createdAt": current_user.created_at.isoformat() if current_user.created_at else "",
        },
    }
