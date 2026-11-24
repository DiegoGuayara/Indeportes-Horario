import type { Prisma } from "../../generated/prisma/client.js";
import {
  createContractor,
  findContractor,
  listContractors,
  updateContractor,
} from "./contractor.repository.js";

export class ContractorError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "ContractorError";
  }
}

type Body = Record<string, unknown>;
function asBody(value: unknown): Body {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ContractorError("El body debe ser un objeto JSON.");
  }
  return value as Body;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ContractorError(`El campo ${field} es obligatorio.`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string, maxLength: number): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new ContractorError(`${field} debe ser texto de máximo ${maxLength} caracteres.`);
  }
  return value.trim();
}

function validateEmail(value: string | null): string | null {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new ContractorError("email debe tener un formato válido.");
  }
  return value;
}

export async function createContractorFromBody(value: unknown) {
  const body = asBody(value);
  return createContractor({
    contractorId: requiredString(body.contractorId, "contractorId"),
    firstName: requiredString(body.firstName, "firstName"),
    lastName: requiredString(body.lastName, "lastName"),
    documentNumber: requiredString(body.documentNumber, "documentNumber"),
    email: validateEmail(optionalString(body.email, "email", 191)),
    phone: optionalString(body.phone, "phone", 30),
  });
}

function parseBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new ContractorError(`${field} debe ser true o false.`);
  return value;
}

function parsePage(value: unknown, fallback: number, field: string, max: number): number {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > max) {
    throw new ContractorError(`${field} debe ser un entero entre 1 y ${max}.`);
  }
  return number;
}

export async function getContractors(query: Record<string, unknown>) {
  const page = parsePage(query.page, 1, "page", 1_000_000);
  const limit = parsePage(query.limit, 50, "limit", 100);
  const where: Prisma.ContractorWhereInput = {};
  if (query.isActive !== undefined) where.isActive = parseBoolean(query.isActive, "isActive");
  if (query.search !== undefined) {
    const search = requiredString(query.search, "search");
    where.OR = [
      { contractorId: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { documentNumber: { contains: search } },
      { email: { contains: search } },
    ];
  }
  return listContractors(where, page, limit);
}

export async function getContractorById(contractorId: string) {
  const contractor = await findContractor(requiredString(contractorId, "contractorId"));
  if (!contractor) throw new ContractorError("No se encontró el contratista.", 404);
  return contractor;
}

export async function updateContractorFromBody(contractorId: string, value: unknown) {
  const body = asBody(value);
  const data: Prisma.ContractorUpdateInput = {};
  if (body.firstName !== undefined) data.firstName = requiredString(body.firstName, "firstName");
  if (body.lastName !== undefined) data.lastName = requiredString(body.lastName, "lastName");
  if (body.documentNumber !== undefined) data.documentNumber = requiredString(body.documentNumber, "documentNumber");
  if (body.email !== undefined) data.email = validateEmail(optionalString(body.email, "email", 191));
  if (body.phone !== undefined) data.phone = optionalString(body.phone, "phone", 30);
  if (body.isActive !== undefined) data.isActive = parseBoolean(body.isActive, "isActive");
  if (Object.keys(data).length === 0) throw new ContractorError("Envía al menos un campo para actualizar.");
  await getContractorById(contractorId);
  return updateContractor(contractorId, data);
}

export async function deactivateContractor(contractorId: string) {
  await getContractorById(contractorId);
  return updateContractor(contractorId, { isActive: false });
}
