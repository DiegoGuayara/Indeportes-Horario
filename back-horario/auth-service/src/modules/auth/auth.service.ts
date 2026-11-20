import bcrypt from "bcryptjs";
import { createAccessToken } from "../../config/jwt.js";
import { findUserByEmail } from "./auth.repository.js";

export class AuthServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

const dummyPasswordHash = bcrypt.hashSync("invalid-login-placeholder", 10);

export const login = async (email: string, password: string) => {
  const user = await findUserByEmail(email.trim().toLowerCase());
  const hashToCompare = user?.passwordHash ?? dummyPasswordHash;
  const passwordMatches = await bcrypt.compare(password, hashToCompare);

  if (!user || !user.isActive || !passwordMatches || bcrypt.truncates(password)) {
    throw new AuthServiceError(401, "Correo o contraseña incorrectos.");
  }

  const accessToken = await createAccessToken({
    id: user.id,
    role: user.role,
    contractorId: user.contractorId,
  });

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: 3600,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      contractorId: user.contractorId,
    },
  };
};
