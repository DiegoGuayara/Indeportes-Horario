import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRole } from "../../middlewares/authorize-role.js";
import { createContractorAccountController, createGuardAccountController } from "./users.controller.js";

const router = Router();

router.post(
  "/users/contractors",
  authenticate,
  authorizeRole("ADMIN"),
  createContractorAccountController,
);

router.post(
  "/users/guards",
  authenticate,
  authorizeRole("ADMIN"),
  createGuardAccountController,
);

export { router as usersRoutes };
