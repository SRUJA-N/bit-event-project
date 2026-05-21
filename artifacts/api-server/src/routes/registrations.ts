import { Router } from "express";
import { db, registrationsTable, eventsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { CreateRegistrationBody, ReviewRegistrationParams, ReviewRegistrationBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

function formatReg(
  r: typeof registrationsTable.$inferSelect,
  event?: typeof eventsTable.$inferSelect | null,
  student?: typeof usersTable.$inferSelect | null
) {
  const formatted: Record<string, unknown> = {
    id: r.id,
    eventId: r.eventId,
    studentId: r.studentId,
    paymentScreenshotUrl: r.paymentScreenshotUrl ?? null,
    paymentStatus: r.paymentStatus,
    adminComment: r.adminComment ?? null,
    registeredAt: r.registeredAt.toISOString(),
    event: null,
    student: null,
  };
  if (event) {
    formatted.event = {
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
  if (student) {
    formatted.student = {
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      department: student.department,
      createdAt: student.createdAt.toISOString(),
    };
  }
  return formatted;
}

router.post("/registrations", requireAuth, requireRole("student"), async (req, res): Promise<void> => {
  const parsed = CreateRegistrationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, parsed.data.eventId));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (event.status !== "approved") {
    res.status(400).json({ error: "Event is not open for registration" });
    return;
  }
  if (event.availableSlots <= 0) {
    res.status(400).json({ error: "No slots available" });
    return;
  }

  const existing = await db.select().from(registrationsTable).where(
    and(eq(registrationsTable.eventId, parsed.data.eventId), eq(registrationsTable.studentId, req.user!.userId))
  );
  if (existing.length > 0) {
    res.status(400).json({ error: "Already registered for this event" });
    return;
  }

  const [reg] = await db.insert(registrationsTable).values({
    eventId: parsed.data.eventId,
    studentId: req.user!.userId,
    paymentScreenshotUrl: parsed.data.paymentScreenshotUrl ?? null,
    paymentStatus: "pending",
  }).returning();

  // Decrement slot immediately on registration so overbooking is prevented
  await db.update(eventsTable)
    .set({ availableSlots: event.availableSlots - 1 })
    .where(eq(eventsTable.id, event.id));

  const [updatedEvent] = await db.select().from(eventsTable).where(eq(eventsTable.id, event.id));
  res.status(201).json(formatReg(reg, updatedEvent));
});

router.get("/registrations/my", requireAuth, requireRole("student"), async (req, res): Promise<void> => {
  const regs = await db.select().from(registrationsTable).where(eq(registrationsTable.studentId, req.user!.userId));
  const eventIds = [...new Set(regs.map((r) => r.eventId))];
  const events: Record<number, typeof eventsTable.$inferSelect> = {};
  if (eventIds.length > 0) {
    const evts = await db.select().from(eventsTable);
    for (const e of evts) events[e.id] = e;
  }
  res.json(regs.map((r) => formatReg(r, events[r.eventId] ?? null)));
});

router.patch("/registrations/:id/review", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const params = ReviewRegistrationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid registration ID" });
    return;
  }
  const parsed = ReviewRegistrationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(registrationsTable).where(eq(registrationsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Registration not found" });
    return;
  }

  const [reg] = await db.update(registrationsTable).set({
    paymentStatus: parsed.data.paymentStatus,
    adminComment: parsed.data.adminComment ?? null,
  }).where(eq(registrationsTable.id, params.data.id)).returning();

  // If rejected, give the slot back so another student can register
  if (parsed.data.paymentStatus === "rejected" && existing.paymentStatus !== "rejected") {
    const [evt] = await db.select().from(eventsTable).where(eq(eventsTable.id, reg.eventId));
    if (evt) {
      await db.update(eventsTable)
        .set({ availableSlots: evt.availableSlots + 1 })
        .where(eq(eventsTable.id, evt.id));
    }
  }

  logger.info({ registrationId: reg.id, status: parsed.data.paymentStatus }, "Registration reviewed");

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, reg.eventId));
  const [student] = await db.select().from(usersTable).where(eq(usersTable.id, reg.studentId));
  res.json(formatReg(reg, event, student));
});

export default router;
