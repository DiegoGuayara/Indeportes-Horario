import type { RequestHandler } from "express";
import type { AuthContext, AuthRole } from "./authenticate.js";

export const authorizeRole = (...allowedRoles: AuthRole[]): RequestHandler =>
  (_req, res, next) => {
    const auth = res.locals.auth as AuthContext | undefined;

    if (!auth) {
      res.status(401).json({ message: "Debes iniciar sesión." });
      return;
    }

    if (!allowedRoles.includes(auth.role)) {
      res.status(403).json({ message: "No tienes permiso para realizar esta acción." });
      return;
    }

    next();
  };
