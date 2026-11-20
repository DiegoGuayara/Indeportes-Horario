import {
  AttendanceEventType,
  AttendanceMethod,
} from "../../generated/prisma/enums.js";
import type {
  AttendanceEventType as AttendanceEventTypeValue,
  AttendanceMethod as AttendanceMethodValue,
} from "../../generated/prisma/enums.js";
import {
  createAttendanceEventRecord,
  findAttendanceEvents,
  findAttendanceEventsByContractor,
  findLatestAttendanceEvent,
} from "./attendance.repository.js";

export class AttendanceServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AttendanceServiceError";
  }
}

interface CreateAttendanceInput {
  eventType: AttendanceEventTypeValue;
  method: AttendanceMethodValue;
  siteId: string | null;
  latitude: number | null;
  longitude: number | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAttendanceEventType = (
  value: unknown,
): value is AttendanceEventTypeValue =>
  Object.values(AttendanceEventType).some(
    (allowedValue) => allowedValue === value,
  );

const isAttendanceMethod = (value: unknown): value is AttendanceMethodValue =>
  Object.values(AttendanceMethod).some(
    (allowedValue) => allowedValue === value,
  );

const validateInput = (input: unknown): CreateAttendanceInput => {
  if (!isRecord(input)) {
    throw new AttendanceServiceError(
      400,
      "El cuerpo de la solicitud debe ser un objeto JSON.",
    );
  }

  if ("contractorId" in input) {
    throw new AttendanceServiceError(
      400,
      "No envíes contractorId; la identidad se obtiene del token.",
    );
  }

  const { eventType, method, siteId, latitude, longitude } = input;

  if (!isAttendanceEventType(eventType)) {
    throw new AttendanceServiceError(400, "eventType debe ser ENTRY o EXIT.");
  }

  if (!isAttendanceMethod(method)) {
    throw new AttendanceServiceError(400, "method debe ser QR, GPS o MANUAL.");
  }

  if (siteId !== undefined && siteId !== null && typeof siteId !== "string") {
    throw new AttendanceServiceError(400, "siteId debe ser texto.");
  }

  const hasLatitude = latitude !== undefined && latitude !== null;
  const hasLongitude = longitude !== undefined && longitude !== null;

  if (hasLatitude !== hasLongitude) {
    throw new AttendanceServiceError(400, "Envía latitud y longitud juntas.");
  }

  if (
    (hasLatitude || hasLongitude) &&
    (typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180)
  ) {
    throw new AttendanceServiceError(400, "Las coordenadas no son válidas.");
  }

  if (method === AttendanceMethod.GPS && !hasLatitude) {
    throw new AttendanceServiceError(
      400,
      "El método GPS requiere coordenadas.",
    );
  }

  return {
    eventType,
    method,
    siteId: typeof siteId === "string" && siteId.trim() ? siteId.trim() : null,
    latitude: hasLatitude ? (latitude as number) : null,
    longitude: hasLongitude ? (longitude as number) : null,
  };
};

export const registerAttendanceEvent = async (
  input: unknown,
  contractorId: string,
) => {
  const data = validateInput(input);
  const lastEvent = await findLatestAttendanceEvent(contractorId);

  const expectedEventType =
    lastEvent?.eventType === AttendanceEventType.ENTRY
      ? AttendanceEventType.EXIT
      : AttendanceEventType.ENTRY;

  if (data.eventType !== expectedEventType) {
    throw new AttendanceServiceError(
      409,
      expectedEventType === AttendanceEventType.ENTRY
        ? "La siguiente marcación debe ser una entrada."
        : "Ya hay una entrada registrada; la siguiente marcación debe ser una salida.",
    );
  }

  return createAttendanceEventRecord({ ...data, contractorId });
};

export const getAttendanceHistory = (contractorId: string) =>
  findAttendanceEventsByContractor(contractorId);

export interface AdminAttendanceQuery {
  contractorId?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

const optionalDate = (value: unknown, name: string): Date | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new AttendanceServiceError(400, `${name} debe ser una fecha ISO válida.`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AttendanceServiceError(400, `${name} debe ser una fecha ISO válida.`);
  }
  return date;
};

const positiveInteger = (value: unknown, fallback: number, name: string) => {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new AttendanceServiceError(400, `${name} debe ser un número entero positivo.`);
  }

  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) {
    throw new AttendanceServiceError(400, `${name} debe ser un número entero positivo.`);
  }
  return number;
};

export const getAdminAttendanceHistory = async (input: unknown) => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new AttendanceServiceError(400, "Los filtros de consulta no son válidos.");
  }

  const query = input as Record<string, unknown>;
  const contractorId = query.contractorId;
  if (contractorId !== undefined && (typeof contractorId !== "string" || !contractorId.trim())) {
    throw new AttendanceServiceError(400, "contractorId debe ser texto no vacío.");
  }

  const from = optionalDate(query.from, "from");
  const to = optionalDate(query.to, "to");
  if (from && to && from > to) {
    throw new AttendanceServiceError(400, "from no puede ser posterior a to.");
  }

  const page = positiveInteger(query.page, 1, "page");
  const requestedLimit = positiveInteger(query.limit, 50, "limit");
  if (requestedLimit > 100) {
    throw new AttendanceServiceError(400, "limit no puede ser mayor que 100.");
  }

  const limit = requestedLimit;
  const result = await findAttendanceEvents({
    ...(typeof contractorId === "string" ? { contractorId: contractorId.trim() } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    skip: (page - 1) * limit,
    take: limit,
  });

  return { ...result, page, limit };
};
