import bcrypt from "bcryptjs";
import { createContractorUser, findUserByContractorId, findUserByEmail } from "../auth/auth.repository.js";

export class UsersServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "UsersServiceError";
  }
}

interface CreateContractorUserInput {
  email: string;
  password: string;
  contractorId: string;
}

export const createContractorAccount = async (input: unknown) => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new UsersServiceError(400, "El cuerpo debe ser un objeto JSON.");
  }

  const { email, password, contractorId } = input as Record<string, unknown>;

  if (typeof email !== "string" || !email.trim() || email.length > 191 || !email.includes("@")) {
    throw new UsersServiceError(400, "Debes enviar un correo válido.");
  }

  if (
    typeof password !== "string" ||
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 72 ||
    bcrypt.truncates(password)
  ) {
    throw new UsersServiceError(400, "La contraseña debe tener entre 12 y 72 bytes.");
  }

  if (typeof contractorId !== "string" || !contractorId.trim() || contractorId.length > 64) {
    throw new UsersServiceError(400, "Debes enviar un contractorId válido.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedContractorId = contractorId.trim();

  if (await findUserByEmail(normalizedEmail)) {
    throw new UsersServiceError(409, "Ya existe una cuenta con ese correo.");
  }

  if (await findUserByContractorId(normalizedContractorId)) {
    throw new UsersServiceError(409, "Ese contratista ya tiene una cuenta.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    return await createContractorUser({
      email: normalizedEmail,
      passwordHash,
      contractorId: normalizedContractorId,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new UsersServiceError(409, "Ya existe una cuenta con esos datos.");
    }
    throw error;
  }
};
