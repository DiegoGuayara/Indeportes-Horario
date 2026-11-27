import { SignJWT } from "jose";

const secret = process.env.JWT_SECRET;

if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
  throw new Error("JWT_SECRET debe existir y tener al menos 32 bytes");
}

export const jwtKey = new TextEncoder().encode(secret);
export const jwtIssuer = "indeportes-auth";
export const jwtAudience = "indeportes-api";

interface TokenUser {
  id: string;
  role: "ADMIN" | "CONTRACTOR" | "GUARD";
  contractorId: string | null;
}

export const createAccessToken = (user: TokenUser) =>
  new SignJWT({ role: user.role, contractorId: user.contractorId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuer(jwtIssuer)
    .setAudience(jwtAudience)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(jwtKey);
