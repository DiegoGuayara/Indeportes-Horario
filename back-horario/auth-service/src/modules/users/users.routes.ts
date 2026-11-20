import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorizeRole } from "../../middlewares/authorize-role.js";
import { createContractorAccountController } from "./users.controller.js";

const router = Router();

router.post(
  "/users/contractors",
  authenticate,
  authorizeRole("ADMIN"),
  createContractorAccountController,
);

export { router as usersRoutes };
