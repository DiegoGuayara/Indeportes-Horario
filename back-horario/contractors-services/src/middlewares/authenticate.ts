import type { RequestHandler } from "express";
import { jwtVerify } from "jose";

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET no está configurado");

const key = new TextEncoder().encode(secret);
const issuer = process.env.JWT_ISSUER ?? "indeportes-auth";
const audience = process.env.JWT_AUDIENCE ?? "indeportes-api";

export type AuthContext = {
  userId: string;
  role: "ADMIN" | "CONTRACTOR" | "GUARD";
  contractorId: string | null;
};

export const authenticate: RequestHandler = async (req, res, next) => {
  const [scheme, token] = req.header("authorization")?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ message: "Debes iniciar sesión." });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      issuer,
      audience,
    });
    const role = payload.role;
    const contractorId = payload.contractorId;
    if (
      typeof payload.sub !== "string" ||
      (role !== "ADMIN" && role !== "CONTRACTOR" && role !== "GUARD") ||
      (contractorId !== null && typeof contractorId !== "string") ||
      ((role === "ADMIN" || role === "GUARD") && contractorId !== null) ||
      (role === "CONTRACTOR" && typeof contractorId !== "string")
    ) {
      res.status(401).json({ message: "El token no contiene una identidad válida." });
      return;
    }
    res.locals.auth = { userId: payload.sub, role, contractorId } satisfies AuthContext;
    next();
  } catch {
    res.status(401).json({ message: "El token es inválido o expiró." });
  }
};
