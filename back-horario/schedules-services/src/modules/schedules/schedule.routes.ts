import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRole } from "../../middlewares/authorize-role.js";
import {
  createSchedule,
  deactivateSchedule,
  getMySchedule,
  getSchedule,
  listSchedules,
  updateSchedule,
} from "./schedule.controller.js";

const router = Router();

router.get("/me", authenticate, authorizeRole("CONTRACTOR"), getMySchedule);
router.post("/", authenticate, authorizeRole("ADMIN"), createSchedule);
router.get("/", authenticate, authorizeRole("ADMIN"), listSchedules);
router.get("/:id", authenticate, authorizeRole("ADMIN"), getSchedule);
router.patch("/:id", authenticate, authorizeRole("ADMIN"), updateSchedule);
router.delete("/:id", authenticate, authorizeRole("ADMIN"), deactivateSchedule);

export { router as scheduleRoutes };
