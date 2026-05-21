import { Router } from "express";
import { db, eventsTable, registrationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { GetEventReportParams } from "@workspace/api-zod";

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

  const studentIds = [...new Set(regs.map((r) => r.studentId))];
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

  const lines: string[] = [
    "BANGALORE INSTITUTE OF TECHNOLOGY",
    "Department of CSE-ICB",
    "──────────────────────────────────────────────────────────────",
    `Event Report: ${event.title}`,
    `Date: ${event.date}  |  Time: ${event.time}  |  Venue: ${event.venue}`,
    `Department: ${event.department}  |  Status: ${event.status}`,
    `Registration Fee: Rs. ${event.registrationFee}  |  Total Slots: ${event.totalSlots}  |  Available: ${event.availableSlots}`,
    "──────────────────────────────────────────────────────────────",
    `Total Registrations: ${regs.length}`,
    `Approved Registrations: ${approvedRegs.length}`,
    `Total Revenue: Rs. ${totalRevenue}`,
    "──────────────────────────────────────────────────────────────",
    "REGISTERED STUDENTS",
    "S.No | Name | Email | Department | Status | Comment",
    "──────────────────────────────────────────────────────────────",
    ...regs.map((r, i) => {
      const s = studentMap[r.studentId];
      return `${i + 1}. ${s?.name ?? "Unknown"} | ${s?.email ?? "-"} | ${s?.department ?? "-"} | ${r.paymentStatus} | ${r.adminComment ?? "-"}`;
    }),
  ];

  const content = lines.join("\n");
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", `attachment; filename="BIT-Event-Report-${event.id}.txt"`);
  res.send(content);
});

export default router;
