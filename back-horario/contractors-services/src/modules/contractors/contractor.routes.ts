import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRole } from "../../middlewares/authorize-role.js";
import {
  createContractor,
  deleteContractor,
  getContractor,
  listContractors,
  updateContractor,
} from "./contractor.controller.js";

const router = Router();
router.use(authenticate, authorizeRole("ADMIN"));
router.post("/", createContractor);
router.get("/", listContractors);
router.get("/:contractorId", getContractor);
router.patch("/:contractorId", updateContractor);
router.delete("/:contractorId", deleteContractor);

export { router as contractorRoutes };
