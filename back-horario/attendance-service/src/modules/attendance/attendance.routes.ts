import { Router } from "express";
import { createAttendanceEvent } from "./attendance.controller.js";

const router = Router();

router.post("/events", createAttendanceEvent);

export { router as attendanceRoutes };
