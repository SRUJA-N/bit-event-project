import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import eventsRouter from "./events";
import registrationsRouter from "./registrations";
import feedbackRouter from "./feedback";
import uploadsRouter from "./uploads";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(eventsRouter);
router.use(registrationsRouter);
router.use(feedbackRouter);
router.use(uploadsRouter);
router.use(reportsRouter);

export default router;
