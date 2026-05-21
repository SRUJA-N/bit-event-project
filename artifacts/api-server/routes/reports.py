from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from auth_utils import require_roles
import io
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT

router = APIRouter()

NAVY  = colors.HexColor("#1a2a5e")
GOLD  = colors.HexColor("#c8960c")
WHITE = colors.white
LGRAY = colors.HexColor("#f5f5f5")
DGRAY = colors.HexColor("#333333")
GREEN = colors.HexColor("#2e7d32")
RED   = colors.HexColor("#c62828")
AMBER = colors.HexColor("#b45309")

def _fmt_event(e):
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

@router.get("/reports/event/{event_id}")
def get_report(
    event_id: int,
    current_user: models.User = Depends(require_roles("admin", "faculty")),
    db: Session = Depends(get_db),
):
    e = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not e:
        raise HTTPException(404, detail="Event not found")
    regs = db.query(models.Registration).filter(models.Registration.event_id == event_id).all()
    approved = [r for r in regs if r.payment_status == "approved"]
    all_users = {u.id: u for u in db.query(models.User).all()}
    return {
        "event": _fmt_event(e),
        "totalRegistrations": len(regs),
        "approvedRegistrations": len(approved),
        "totalRevenue": len(approved) * e.registration_fee,
        "registrations": [
            {
                "id": r.id, "eventId": r.event_id, "studentId": r.student_id,
                "paymentScreenshotUrl": r.payment_screenshot_url,
                "paymentStatus": r.payment_status,
                "adminComment": r.admin_comment,
                "registeredAt": r.registered_at.isoformat() if r.registered_at else "",
                "event": _fmt_event(e),
                "student": {
                    "id": all_users[r.student_id].id,
                    "name": all_users[r.student_id].name,
                    "email": all_users[r.student_id].email,
                    "role": all_users[r.student_id].role,
                    "department": all_users[r.student_id].department,
                    "createdAt": all_users[r.student_id].created_at.isoformat() if all_users[r.student_id].created_at else "",
                } if r.student_id in all_users else None,
            }
            for r in regs
        ],
    }

@router.get("/reports/event/{event_id}/pdf")
def get_pdf(
    event_id: int,
    current_user: models.User = Depends(require_roles("admin", "faculty")),
    db: Session = Depends(get_db),
):
    e = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not e:
        raise HTTPException(404, detail="Event not found")

    regs = db.query(models.Registration).filter(models.Registration.event_id == event_id).all()
    approved = [r for r in regs if r.payment_status == "approved"]
    revenue = len(approved) * e.registration_fee
    all_users = {u.id: u for u in db.query(models.User).all()}

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=10*mm, bottomMargin=15*mm,
                            leftMargin=15*mm, rightMargin=15*mm)
    styles = getSampleStyleSheet()
    story = []

    # ── Header ──────────────────────────────────────────────
    header_data = [[
        Paragraph('<font color="white"><b>BANGALORE INSTITUTE OF TECHNOLOGY</b></font>', ParagraphStyle("h1", fontSize=14, alignment=TA_CENTER)),
    ]]
    sub_data = [[
        Paragraph('<font color="#c8960c">Department of CSE-ICB  |  Event Management Portal</font>',
                  ParagraphStyle("h2", fontSize=9, alignment=TA_CENTER)),
    ]]
    date_data = [[
        Paragraph(f'<font color="white" size="8">Report Generated: {date.today().strftime("%d %B %Y")}</font>',
                  ParagraphStyle("h3", fontSize=8, alignment=TA_CENTER)),
    ]]

    w = A4[0] - 30*mm
    header_tbl = Table(header_data, colWidths=[w])
    header_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), NAVY),
        ("TOPPADDING", (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))
    sub_tbl = Table(sub_data, colWidths=[w])
    sub_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), NAVY),
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))
    date_tbl = Table(date_data, colWidths=[w])
    date_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), NAVY),
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
    ]))
    story += [header_tbl, sub_tbl, date_tbl, Spacer(1, 6*mm)]

    # ── Event title ─────────────────────────────────────────
    story.append(Paragraph(f'<font color="#1a2a5e"><b>{e.title}</b></font>',
                           ParagraphStyle("etitle", fontSize=13, spaceAfter=4)))
    story.append(HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=4*mm))

    if e.description:
        story.append(Paragraph(e.description, ParagraphStyle("desc", fontSize=9, textColor=DGRAY, spaceAfter=4*mm)))

    # ── Info grid ────────────────────────────────────────────
    fee_str = "Free" if e.registration_fee == 0 else f"Rs. {e.registration_fee}"
    info_data = [
        ["Date", e.date, "Department", e.department],
        ["Time", e.time, "Status", e.status.upper()],
        ["Venue", e.venue, "Reg. Fee", fee_str],
    ]
    info_tbl = Table(info_data, colWidths=[25*mm, 65*mm, 30*mm, 55*mm])
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), LGRAY),
        ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME", (2,0), (2,-1), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 9),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
    ]))
    story += [info_tbl, Spacer(1, 6*mm)]

    # ── Stats boxes ──────────────────────────────────────────
    story.append(Paragraph('<font color="#1a2a5e"><b>SUMMARY STATISTICS</b></font>',
                           ParagraphStyle("sh", fontSize=11, spaceAfter=2)))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=3*mm))

    stat_data = [[
        Paragraph(f'<font color="white"><b>{len(regs)}</b><br/>Total Registrations</font>',
                  ParagraphStyle("s", fontSize=10, alignment=TA_CENTER)),
        Paragraph(f'<font color="white"><b>{len(approved)}</b><br/>Approved</font>',
                  ParagraphStyle("s", fontSize=10, alignment=TA_CENTER)),
        Paragraph(f'<font color="white"><b>Rs. {revenue}</b><br/>Revenue</font>',
                  ParagraphStyle("s", fontSize=10, alignment=TA_CENTER)),
    ]]
    bw = (A4[0] - 34*mm) / 3
    stat_tbl = Table(stat_data, colWidths=[bw, bw, bw], rowHeights=[16*mm])
    stat_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (0,0), NAVY),
        ("BACKGROUND", (1,0), (1,0), GREEN),
        ("BACKGROUND", (2,0), (2,0), AMBER),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 4),
        ("RIGHTPADDING", (0,0), (-1,-1), 4),
        ("COLPADDING", (0,0), (-1,-1), 4),
    ]))
    story += [stat_tbl, Spacer(1, 6*mm)]

    # ── Student table ────────────────────────────────────────
    story.append(Paragraph('<font color="#1a2a5e"><b>REGISTERED STUDENTS</b></font>',
                           ParagraphStyle("sh2", fontSize=11, spaceAfter=2)))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=3*mm))

    if not regs:
        story.append(Paragraph("No registrations found for this event.",
                               ParagraphStyle("none", fontSize=9, textColor=DGRAY)))
    else:
        table_data = [["#", "Name", "Email", "Department", "Status"]]
        for i, r in enumerate(regs):
            u = all_users.get(r.student_id)
            table_data.append([
                str(i + 1),
                u.name if u else "Unknown",
                u.email if u else "-",
                u.department if u else "-",
                r.payment_status.upper(),
            ])

        col_w = [10*mm, 38*mm, 55*mm, 28*mm, 24*mm]
        student_tbl = Table(table_data, colWidths=col_w, repeatRows=1)

        style = [
            ("BACKGROUND", (0,0), (-1,0), NAVY),
            ("TEXTCOLOR", (0,0), (-1,0), WHITE),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,-1), 8),
            ("TOPPADDING", (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ("LEFTPADDING", (0,0), (-1,-1), 4),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LGRAY]),
        ]
        for i, r in enumerate(regs, 1):
            c = GREEN if r.payment_status == "approved" else (RED if r.payment_status == "rejected" else AMBER)
            style.append(("TEXTCOLOR", (4,i), (4,i), c))
            style.append(("FONTNAME", (4,i), (4,i), "Helvetica-Bold"))

        student_tbl.setStyle(TableStyle(style))
        story.append(student_tbl)

    story.append(Spacer(1, 6*mm))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD))
    story.append(Paragraph(
        '<font color="#666666" size="7">Bangalore Institute of Technology  |  Department of CSE-ICB  |  Confidential – For Internal Use Only</font>',
        ParagraphStyle("footer", fontSize=7, alignment=TA_CENTER, spaceBefore=3),
    ))

    doc.build(story)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="BIT-Event-Report-{event_id}.pdf"'},
    )
