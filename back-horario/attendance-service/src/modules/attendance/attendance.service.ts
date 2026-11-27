import {
  AttendanceEventType,
  AttendanceMethod,
} from "../../generated/prisma/enums.js";
import { SignJWT, jwtVerify } from "jose";
import { jwtKey } from "../../config/jwt.js";
import type {
  AttendanceEventType as AttendanceEventTypeValue,
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
  qrToken: string;
  latitude: number;
  longitude: number;
}

const SITE = {
  id: "indeportes-armenia",
  latitude: 4.530788,
  longitude: -75.673432,
  radiusMeters: 100,
} as const;
const qrIssuer = "indeportes-attendance";
const qrAudience = "indeportes-attendance-checkin";
const qrLifetimeSeconds = 60;

export const issueAttendanceQr = async (guardId: string) => {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = new Date((now + qrLifetimeSeconds) * 1000).toISOString();
  const token = await new SignJWT({ purpose: "attendance-checkin", siteId: SITE.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(qrIssuer)
    .setAudience(qrAudience)
    .setSubject(guardId)
    .setIssuedAt(now)
    .setExpirationTime(now + qrLifetimeSeconds)
    .sign(jwtKey);

  return { token, expiresAt, siteId: SITE.id, expiresInSeconds: qrLifetimeSeconds };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAttendanceEventType = (
  value: unknown,
): value is AttendanceEventTypeValue =>
  Object.values(AttendanceEventType).some(
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

  const { eventType, qrToken, latitude, longitude } = input;

  if (!isAttendanceEventType(eventType)) {
    throw new AttendanceServiceError(400, "eventType debe ser ENTRY o EXIT.");
  }

  if (typeof qrToken !== "string" || qrToken.length < 20 || qrToken.length > 2048) {
    throw new AttendanceServiceError(400, "Escanea el código QR vigente del vigilante.");
  }

  if (
    (typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180)
  ) {
    throw new AttendanceServiceError(400, "La ubicación del celular no es válida.");
  }

  return {
    eventType,
    qrToken,
    latitude,
    longitude,
  };
};

const distanceInMeters = (latitude: number, longitude: number) => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = radians(latitude - SITE.latitude);
  const lonDelta = radians(longitude - SITE.longitude);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(SITE.latitude)) *
      Math.cos(radians(latitude)) *
      Math.sin(lonDelta / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(haversine));
};

const verifyAttendanceQr = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, jwtKey, {
      algorithms: ["HS256"],
      issuer: qrIssuer,
      audience: qrAudience,
      maxTokenAge: `${qrLifetimeSeconds}s`,
    });
    if (payload.purpose !== "attendance-checkin" || payload.siteId !== SITE.id) {
      throw new Error("QR claims mismatch");
    }
  } catch {
    throw new AttendanceServiceError(401, "El QR venció o no es válido. Escanea el código actual.");
  }
};

export const registerAttendanceEvent = async (
  input: unknown,
  contractorId: string,
) => {
  const data = validateInput(input);
  await verifyAttendanceQr(data.qrToken);
  const distanceMeters = distanceInMeters(data.latitude, data.longitude);
  if (distanceMeters > SITE.radiusMeters) {
    throw new AttendanceServiceError(
      403,
      `Estás fuera de la sede. Acércate a menos de ${SITE.radiusMeters} metros para marcar asistencia.`,
    );
  }
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

  const event = await createAttendanceEventRecord({
    eventType: data.eventType,
    method: AttendanceMethod.QR,
    siteId: SITE.id,
    latitude: data.latitude,
    longitude: data.longitude,
    contractorId,
  });
  return { event, location: { distanceMeters: Math.round(distanceMeters), radiusMeters: SITE.radiusMeters } };
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
