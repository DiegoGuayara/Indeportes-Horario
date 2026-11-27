import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRole } from "../../middlewares/authorize-role.js";
import {
  getCurrentQrCode,
  createAttendanceEvent,
  getAdminAttendanceEvents,
  getMyAttendanceEvents,
} from "./attendance.controller.js";

const router = Router();

router.get("/qr/current", authenticate, authorizeRole("GUARD"), getCurrentQrCode);
router.get("/events/me", authenticate, authorizeRole("CONTRACTOR"), getMyAttendanceEvents);
router.get("/events", authenticate, authorizeRole("ADMIN"), getAdminAttendanceEvents);
router.post("/events", authenticate, authorizeRole("CONTRACTOR"), createAttendanceEvent);

export { router as attendanceRoutes };
