import { Router } from "express";
import { db, eventsTable, registrationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { GetEventReportParams } from "@workspace/api-zod";
import PDFDocument from "pdfkit";

const router = Router();

function formatEvent(event: typeof eventsTable.$inferSelect) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    venue: event.venue,
    department: event.department,
    imageUrl: event.imageUrl ?? null,
    rules: event.rules ?? null,
    registrationFee: event.registrationFee,
    totalSlots: event.totalSlots,
    availableSlots: event.availableSlots,
    paymentQrUrl: event.paymentQrUrl ?? null,
    status: event.status,
    createdByFacultyId: event.createdByFacultyId ?? null,
    createdByFacultyName: null,
    createdAt: event.createdAt.toISOString(),
  };
}

router.get("/reports/event/:id", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const params = GetEventReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid event ID" });
    return;
  }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const regs = await db.select().from(registrationsTable).where(eq(registrationsTable.eventId, params.data.id));
  const approvedRegs = regs.filter((r) => r.paymentStatus === "approved");
  const totalRevenue = approvedRegs.length * event.registrationFee;

  const students = await db.select().from(usersTable);
  const studentMap: Record<number, typeof usersTable.$inferSelect> = {};
  for (const s of students) studentMap[s.id] = s;

  const registrationsWithDetails = regs.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    studentId: r.studentId,
    paymentScreenshotUrl: r.paymentScreenshotUrl ?? null,
    paymentStatus: r.paymentStatus,
    adminComment: r.adminComment ?? null,
    registeredAt: r.registeredAt.toISOString(),
    event: formatEvent(event),
    student: studentMap[r.studentId] ? {
      id: studentMap[r.studentId].id,
      name: studentMap[r.studentId].name,
      email: studentMap[r.studentId].email,
      role: studentMap[r.studentId].role,
      department: studentMap[r.studentId].department,
      createdAt: studentMap[r.studentId].createdAt.toISOString(),
    } : null,
  }));

  res.json({
    event: formatEvent(event),
    totalRegistrations: regs.length,
    approvedRegistrations: approvedRegs.length,
    totalRevenue,
    registrations: registrationsWithDetails,
  });
});

router.get("/reports/event/:id/pdf", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const idRaw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(idRaw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid event ID" });
    return;
  }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const regs = await db.select().from(registrationsTable).where(eq(registrationsTable.eventId, id));
  const approvedRegs = regs.filter((r) => r.paymentStatus === "approved");
  const totalRevenue = approvedRegs.length * event.registrationFee;

  const students = await db.select().from(usersTable);
  const studentMap: Record<number, typeof usersTable.$inferSelect> = {};
  for (const s of students) studentMap[s.id] = s;

  const filename = `BIT-Event-Report-${event.id}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);

  const NAVY = "#1a2a5e";
  const GOLD = "#c8960c";
  const LIGHT_GRAY = "#f5f5f5";
  const DARK_GRAY = "#333333";
  const MID_GRAY = "#666666";

  doc.rect(0, 0, doc.page.width, 100).fill(NAVY);

  doc
    .fillColor("#ffffff")
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("BANGALORE INSTITUTE OF TECHNOLOGY", 50, 25, { align: "center" });

  doc
    .fillColor(GOLD)
    .fontSize(11)
    .font("Helvetica")
    .text("Department of CSE-ICB  |  Event Management Portal", 50, 52, { align: "center" });

  doc
    .fillColor("#ffffff")
    .fontSize(9)
    .text(`Report Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, 50, 75, { align: "center" });

  doc.moveDown(4);

  doc
    .fillColor(NAVY)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("EVENT REPORT", 50, 120, { align: "center" });

  doc
    .moveTo(50, 142)
    .lineTo(doc.page.width - 50, 142)
    .strokeColor(GOLD)
    .lineWidth(2)
    .stroke();

  doc.moveDown(1.5);

  const eventDetailsY = 155;
  doc
    .fillColor(NAVY)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(event.title, 50, eventDetailsY);

  doc
    .fillColor(MID_GRAY)
    .fontSize(10)
    .font("Helvetica")
    .text(event.description ?? "", 50, eventDetailsY + 22, { width: doc.page.width - 100 });

  const infoStartY = eventDetailsY + 50;
  doc
    .rect(50, infoStartY, doc.page.width - 100, 90)
    .fill(LIGHT_GRAY);

  doc
    .fillColor(DARK_GRAY)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Date:", 65, infoStartY + 12)
    .font("Helvetica")
    .text(event.date, 120, infoStartY + 12);

  doc
    .font("Helvetica-Bold")
    .text("Time:", 65, infoStartY + 30)
    .font("Helvetica")
    .text(event.time, 120, infoStartY + 30);

  doc
    .font("Helvetica-Bold")
    .text("Venue:", 65, infoStartY + 48)
    .font("Helvetica")
    .text(event.venue, 120, infoStartY + 48);

  doc
    .font("Helvetica-Bold")
    .text("Department:", 300, infoStartY + 12)
    .font("Helvetica")
    .text(event.department, 375, infoStartY + 12);

  doc
    .font("Helvetica-Bold")
    .text("Status:", 300, infoStartY + 30)
    .font("Helvetica")
    .text(event.status.toUpperCase(), 375, infoStartY + 30);

  doc
    .font("Helvetica-Bold")
    .text("Reg. Fee:", 300, infoStartY + 48)
    .font("Helvetica")
    .text(event.registrationFee === 0 ? "Free" : `Rs. ${event.registrationFee}`, 375, infoStartY + 48);

  const statsY = infoStartY + 110;

  doc
    .fillColor(NAVY)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("SUMMARY STATISTICS", 50, statsY);

  doc
    .moveTo(50, statsY + 18)
    .lineTo(doc.page.width - 50, statsY + 18)
    .strokeColor(GOLD)
    .lineWidth(1)
    .stroke();

  const boxWidth = (doc.page.width - 130) / 3;
  const boxY = statsY + 28;

  const drawStatBox = (x: number, label: string, value: string, color: string) => {
    doc.rect(x, boxY, boxWidth, 55).fill(color);
    doc
      .fillColor("#ffffff")
      .fontSize(9)
      .font("Helvetica")
      .text(label, x + 8, boxY + 10, { width: boxWidth - 16, align: "center" });
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(value, x + 8, boxY + 24, { width: boxWidth - 16, align: "center" });
  };

  drawStatBox(50, "TOTAL REGISTRATIONS", String(regs.length), NAVY);
  drawStatBox(50 + boxWidth + 15, "APPROVED", String(approvedRegs.length), "#2e7d32");
  drawStatBox(50 + (boxWidth + 15) * 2, "TOTAL REVENUE", `Rs. ${totalRevenue}`, "#b45309");

  const tableStartY = boxY + 80;

  doc
    .fillColor(NAVY)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("REGISTERED STUDENTS", 50, tableStartY);

  doc
    .moveTo(50, tableStartY + 18)
    .lineTo(doc.page.width - 50, tableStartY + 18)
    .strokeColor(GOLD)
    .lineWidth(1)
    .stroke();

  const tableY = tableStartY + 28;
  const colWidths = [30, 130, 165, 85, 80];
  const colX = [50, 80, 210, 375, 460];
  const headers = ["#", "Name", "Email", "Department", "Status"];

  doc.rect(50, tableY, doc.page.width - 100, 20).fill(NAVY);

  headers.forEach((h, i) => {
    doc
      .fillColor("#ffffff")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(h, colX[i] + 4, tableY + 6, { width: colWidths[i] - 4 });
  });

  let rowY = tableY + 20;

  if (regs.length === 0) {
    doc
      .rect(50, rowY, doc.page.width - 100, 30)
      .fill(LIGHT_GRAY);
    doc
      .fillColor(MID_GRAY)
      .fontSize(10)
      .font("Helvetica")
      .text("No registrations found for this event.", 50, rowY + 10, { align: "center", width: doc.page.width - 100 });
  } else {
    regs.forEach((r, i) => {
      const s = studentMap[r.studentId];
      const isEven = i % 2 === 0;

      if (rowY > doc.page.height - 80) {
        doc.addPage();
        rowY = 50;
      }

      doc.rect(50, rowY, doc.page.width - 100, 22).fill(isEven ? "#ffffff" : LIGHT_GRAY);

      const statusColor =
        r.paymentStatus === "approved" ? "#2e7d32" :
        r.paymentStatus === "rejected" ? "#c62828" : "#b45309";

      const rowData = [
        String(i + 1),
        s?.name ?? "Unknown",
        s?.email ?? "-",
        s?.department ?? "-",
        r.paymentStatus.toUpperCase(),
      ];

      rowData.forEach((val, ci) => {
        const isStatus = ci === 4;
        doc
          .fillColor(isStatus ? statusColor : DARK_GRAY)
          .fontSize(8)
          .font(isStatus ? "Helvetica-Bold" : "Helvetica")
          .text(val, colX[ci] + 4, rowY + 7, { width: colWidths[ci] - 6, ellipsis: true });
      });

      rowY += 22;
    });

    doc
      .moveTo(50, rowY)
      .lineTo(doc.page.width - 50, rowY)
      .strokeColor(NAVY)
      .lineWidth(0.5)
      .stroke();
  }

  const footerY = doc.page.height - 40;
  doc
    .moveTo(50, footerY - 8)
    .lineTo(doc.page.width - 50, footerY - 8)
    .strokeColor(GOLD)
    .lineWidth(1)
    .stroke();

  doc
    .fillColor(MID_GRAY)
    .fontSize(8)
    .font("Helvetica")
    .text(
      "Bangalore Institute of Technology  |  Department of CSE-ICB  |  Confidential – For Internal Use Only",
      50,
      footerY,
      { align: "center", width: doc.page.width - 100 }
    );

  doc.end();
});

export default router;
