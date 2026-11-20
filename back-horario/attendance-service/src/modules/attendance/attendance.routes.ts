import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRole } from "../../middlewares/authorize-role.js";
import {
  createAttendanceEvent,
  getAdminAttendanceEvents,
  getMyAttendanceEvents,
} from "./attendance.controller.js";

const router = Router();

router.get("/events/me", authenticate, authorizeRole("CONTRACTOR"), getMyAttendanceEvents);
router.get("/events", authenticate, authorizeRole("ADMIN"), getAdminAttendanceEvents);
router.post("/events", authenticate, authorizeRole("CONTRACTOR"), createAttendanceEvent);

export { router as attendanceRoutes };
