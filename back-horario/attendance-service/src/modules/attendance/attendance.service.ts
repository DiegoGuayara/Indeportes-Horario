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
