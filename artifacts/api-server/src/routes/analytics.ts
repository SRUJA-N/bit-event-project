import { Router } from "express";
import { db, eventsTable, registrationsTable, feedbackTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.get("/analytics/registrations", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const registrations = await db.select().from(registrationsTable);
  res.json(registrations.map(r => ({
    id: r.id,
    eventId: r.eventId,
    studentId: r.studentId,
    paymentStatus: r.paymentStatus,
    adminComment: r.adminComment ?? null,
    registeredAt: r.registeredAt.toISOString(),
  })));
});

router.get("/analytics/feedback", requireAuth, requireRole("admin", "faculty"), async (req, res): Promise<void> => {
  const feedbacks = await db.select().from(feedbackTable);
  res.json(feedbacks.map(f => ({
    id: f.id,
    eventId: f.eventId,
    studentId: f.studentId,
    rating: f.rating,
    comments: f.comments ?? null,
    submittedAt: f.submittedAt.toISOString(),
  })));
});

export default router;
