const secret = process.env.JWT_SECRET;

if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
  throw new Error("JWT_SECRET debe existir y tener al menos 32 bytes");
}

export const jwtKey = new TextEncoder().encode(secret);
export const jwtIssuer = "indeportes-auth";
export const jwtAudience = "indeportes-api";
