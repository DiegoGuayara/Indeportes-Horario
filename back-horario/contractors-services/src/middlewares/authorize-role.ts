import type { RequestHandler } from "express";
import type { AuthContext } from "./authenticate.js";

export const authorizeRole = (role: AuthContext["role"]): RequestHandler => (_req, res, next) => {
  const auth = res.locals.auth as AuthContext | undefined;
  if (!auth || auth.role !== role) {
    res.status(403).json({ message: "No tienes permisos para realizar esta acción." });
    return;
  }
  next();
};
