import { Router } from "express";
import { db, feedbackTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { SubmitFeedbackBody } from "@workspace/api-zod";

const router = Router();

router.post("/feedback", requireAuth, requireRole("student"), async (req, res): Promise<void> => {
  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [fb] = await db.insert(feedbackTable).values({
    eventId: parsed.data.eventId,
    studentId: req.user!.userId,
    rating: parsed.data.rating,
    comments: parsed.data.comments ?? null,
    customResponses: parsed.data.customResponses ?? null,
  }).returning();

  const [student] = await db.select().from(usersTable).where(
    (await import("drizzle-orm")).eq(usersTable.id, req.user!.userId)
  );

  res.status(201).json({
    id: fb.id,
    eventId: fb.eventId,
    studentId: fb.studentId,
    rating: fb.rating,
    comments: fb.comments ?? null,
    customResponses: fb.customResponses ?? null,
    submittedAt: fb.submittedAt.toISOString(),
    student: student ? {
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      department: student.department,
      createdAt: student.createdAt.toISOString(),
    } : null,
  });
});

export default router;
