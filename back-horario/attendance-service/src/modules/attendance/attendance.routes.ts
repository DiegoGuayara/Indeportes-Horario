import { Router } from "express";
import { authenticateContractor } from "../../middlewares/authenticate.js";
import { createAttendanceEvent } from "./attendance.controller.js";

const router = Router();

router.post("/events", authenticateContractor, createAttendanceEvent);

export { router as attendanceRoutes };
