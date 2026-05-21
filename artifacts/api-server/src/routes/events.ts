import { Router } from "express";
import { db, eventsTable, usersTable, registrationsTable } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  CreateEventBody,
  UpdateEventBody,
  UpdateEventParams,
  GetEventParams,
  DeleteEventParams,
  ApproveEventParams,
  ApproveEventBody,
  ListEventsQueryParams,
  ListEventRegistrationsParams,
  ListEventFeedbackParams,
} from "@workspace/api-zod";
import { feedbackTable } from "@workspace/db";

const router = Router();

function formatEvent(event: typeof eventsTable.$inferSelect, facultyName?: string | null) {
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
    createdByFacultyName: facultyName ?? null,
    createdAt: event.createdAt.toISOString(),
  };
}

router.get("/events", async (req, res): Promise<void> => {
  const params = ListEventsQueryParams.safeParse(req.query);
  const filters = [];

  if (params.success) {
    if (params.data.department) {
      filters.push(eq(eventsTable.department, params.data.department));
    }
    if (params.data.status) {
      filters.push(eq(eventsTable.status, params.data.status as "pending" | "approved" | "rejected"));
    }
    if (params.data.search) {
      filters.push(ilike(eventsTable.title, `%${params.data.search}%`));
    }
  }

  const events = filters.length > 0
    ? await db.select().from(eventsTable).where(and(...filters)).orderBy(eventsTable.createdAt)
    : await db.select().from(eventsTable).orderBy(eventsTable.createdAt);

  const facultyIds = [...new Set(events.map((e) => e.createdByFacultyId).filter(Boolean))] as number[];
  const facultyMap: Record<number, string> = {};
  if (facultyIds.length > 0) {
    const faculties = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    for (const f of faculties) {
      facultyMap[f.id] = f.name;
    }
  }

  res.json(events.map((e) => formatEvent(e, e.createdByFacultyId ? facultyMap[e.createdByFacultyId] : null)));
});

router.get("/events/stats", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const allEvents = await db.select().from(eventsTable);
  const allRegistrations = await db.select().from(registrationsTable);

  const approved = allRegistrations.filter((r) => r.paymentStatus === "approved");
  const totalRevenue = approved.reduce((sum, r) => {
    const event = allEvents.find((e) => e.id === r.eventId);
    return sum + (event?.registrationFee ?? 0);
  }, 0);

  const deptCounts: Record<string, number> = {};
  for (const e of allEvents) {
    deptCounts[e.department] = (deptCounts[e.department] ?? 0) + 1;
  }

  res.json({
    totalEvents: allEvents.length,
    approvedEvents: allEvents.filter((e) => e.status === "approved").length,
    pendingEvents: allEvents.filter((e) => e.status === "pending").length,
    totalRegistrations: allRegistrations.length,
    totalRevenue,
    departmentBreakdown: Object.entries(deptCounts).map(([department, count]) => ({ department, count })),
  });
});

router.get("/events/:id", async (req, res): Promise<void> => {
  const params = GetEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid event ID" });
    return;
  }
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  let facultyName: string | null = null;
  if (event.createdByFacultyId) {
    const [f] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, event.createdByFacultyId));
    facultyName = f?.name ?? null;
  }
  res.json(formatEvent(event, facultyName));
});

router.post("/events", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [event] = await db.insert(eventsTable).values({
    title: data.title,
    description: data.description,
    date: data.date,
    time: data.time,
    venue: data.venue,
    department: data.department,
    imageUrl: data.imageUrl ?? null,
    rules: data.rules ?? null,
    registrationFee: data.registrationFee ?? 0,
    totalSlots: data.totalSlots,
    availableSlots: data.totalSlots,
    paymentQrUrl: data.paymentQrUrl ?? null,
    createdByFacultyId: req.user!.userId,
    status: "pending",
  }).returning();
  res.status(201).json(formatEvent(event));
});

router.patch("/events/:id", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const params = UpdateEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid event ID" });
    return;
  }
  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db.update(eventsTable).set(parsed.data).where(eq(eventsTable.id, params.data.id)).returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(formatEvent(event));
});

router.delete("/events/:id", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const params = DeleteEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid event ID" });
    return;
  }
  const [event] = await db.delete(eventsTable).where(eq(eventsTable.id, params.data.id)).returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.sendStatus(204);
});

router.patch("/events/:id/approve", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const params = ApproveEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid event ID" });
    return;
  }
  const parsed = ApproveEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db.update(eventsTable).set({ status: parsed.data.status }).where(eq(eventsTable.id, params.data.id)).returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(formatEvent(event));
});

router.get("/events/:id/registrations", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const params = ListEventRegistrationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid event ID" });
    return;
  }
  const regs = await db.select().from(registrationsTable).where(eq(registrationsTable.eventId, params.data.id));
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.id));

  const studentIds = [...new Set(regs.map((r) => r.studentId))];
  const students = studentIds.length > 0
    ? await db.select().from(usersTable)
    : [];
  const studentMap: Record<number, typeof usersTable.$inferSelect> = {};
  for (const s of students) studentMap[s.id] = s;

  res.json(regs.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    studentId: r.studentId,
    paymentScreenshotUrl: r.paymentScreenshotUrl ?? null,
    paymentStatus: r.paymentStatus,
    adminComment: r.adminComment ?? null,
    registeredAt: r.registeredAt.toISOString(),
    event: event ? formatEvent(event) : null,
    student: studentMap[r.studentId] ? {
      id: studentMap[r.studentId].id,
      name: studentMap[r.studentId].name,
      email: studentMap[r.studentId].email,
      role: studentMap[r.studentId].role,
      department: studentMap[r.studentId].department,
      createdAt: studentMap[r.studentId].createdAt.toISOString(),
    } : null,
  })));
});

router.get("/events/:id/feedback", requireAuth, async (req, res): Promise<void> => {
  const params = ListEventFeedbackParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid event ID" });
    return;
  }
  const feedbacks = await db.select().from(feedbackTable).where(eq(feedbackTable.eventId, params.data.id));
  const students = await db.select().from(usersTable);
  const studentMap: Record<number, typeof usersTable.$inferSelect> = {};
  for (const s of students) studentMap[s.id] = s;

  res.json(feedbacks.map((f) => ({
    id: f.id,
    eventId: f.eventId,
    studentId: f.studentId,
    rating: f.rating,
    comments: f.comments ?? null,
    customResponses: f.customResponses ?? null,
    submittedAt: f.submittedAt.toISOString(),
    student: studentMap[f.studentId] ? {
      id: studentMap[f.studentId].id,
      name: studentMap[f.studentId].name,
      email: studentMap[f.studentId].email,
      role: studentMap[f.studentId].role,
      department: studentMap[f.studentId].department,
      createdAt: studentMap[f.studentId].createdAt.toISOString(),
    } : null,
  })));
});

export default router;
