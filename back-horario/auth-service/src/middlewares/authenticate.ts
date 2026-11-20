import type { RequestHandler } from "express";
import { jwtVerify } from "jose";
import { jwtAudience, jwtIssuer, jwtKey } from "../config/jwt.js";

export const authenticate: RequestHandler = async (req, res, next) => {
  const authorization = req.header("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ message: "Debes iniciar sesión." });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, jwtKey, {
      algorithms: ["HS256"],
      issuer: jwtIssuer,
      audience: jwtAudience,
    });

    const role = payload.role;
    const contractorId = payload.contractorId;

    if (
      typeof payload.sub !== "string" ||
      (role !== "ADMIN" && role !== "CONTRACTOR") ||
      (contractorId !== null && typeof contractorId !== "string") ||
      (role === "CONTRACTOR" && typeof contractorId !== "string")
    ) {
      res.status(401).json({ message: "El token no contiene una identidad válida." });
      return;
    }

    res.locals.auth = {
      userId: payload.sub,
      role,
      contractorId,
    };
    next();
  } catch {
    res.status(401).json({ message: "El token es inválido o expiró." });
  }
};
