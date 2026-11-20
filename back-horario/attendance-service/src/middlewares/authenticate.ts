import type { RequestHandler } from "express";
import { jwtVerify } from "jose";
import { jwtAudience, jwtIssuer, jwtKey } from "../config/jwt.js";

export const authenticateContractor: RequestHandler = async (req, res, next) => {
  const authorization = req.header("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ message: "Debes iniciar sesión como contratista." });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, jwtKey, {
      algorithms: ["HS256"],
      issuer: jwtIssuer,
      audience: jwtAudience,
    });

    if (typeof payload.sub !== "string") {
      res.status(401).json({ message: "El token no contiene una identidad válida." });
      return;
    }

    if (payload.role !== "CONTRACTOR" || typeof payload.contractorId !== "string") {
      res.status(403).json({ message: "Solo un contratista puede registrar su asistencia." });
      return;
    }

    res.locals.auth = {
      userId: payload.sub,
      role: payload.role,
      contractorId: payload.contractorId,
    };
    next();
  } catch {
    res.status(401).json({ message: "El token es inválido o expiró." });
  }
};
