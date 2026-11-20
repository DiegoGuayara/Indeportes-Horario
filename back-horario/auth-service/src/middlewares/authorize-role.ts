import type { RequestHandler } from "express";

type UserRole = "ADMIN" | "CONTRACTOR";

export const authorizeRole = (...allowedRoles: UserRole[]): RequestHandler =>
  (_req, res, next) => {
    const auth = res.locals.auth as { role?: UserRole } | undefined;

    if (!auth) {
      res.status(401).json({ message: "Debes iniciar sesión." });
      return;
    }

    if (!auth.role || !allowedRoles.includes(auth.role)) {
      res.status(403).json({ message: "No tienes permiso para realizar esta acción." });
      return;
    }

    next();
  };
