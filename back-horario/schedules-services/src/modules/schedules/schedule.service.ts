import type { DayOfWeek, Prisma } from "../../generated/prisma/client.js";
import {
  createSchedule,
  findCurrentSchedulesForContractor,
  findScheduleById,
  listSchedules,
  updateSchedule,
} from "./schedule.repository.js";

const days: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
];

export class ScheduleError extends Error {
  constructor(message: string, public readonly statusCode: number = 400) {
    super(message);
    this.name = "ScheduleError";
  }
}

type ScheduleInput = Record<string, unknown>;

function asObject(value: unknown): ScheduleInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ScheduleError("El body debe ser un objeto JSON.");
  }
  return value as ScheduleInput;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ScheduleError(`El campo ${field} es obligatorio.`);
  }
  return value.trim();
}

function parseDay(value: unknown): DayOfWeek {
  if (typeof value !== "string" || !days.includes(value as DayOfWeek)) {
    throw new ScheduleError("dayOfWeek debe ser un día válido en mayúsculas, por ejemplo MONDAY.");
  }
  return value as DayOfWeek;
}

function parseTime(value: unknown, field: string): number {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new ScheduleError(`${field} debe tener formato HH:mm, por ejemplo 08:30.`);
  }
  const [hours, minutes] = value.split(":").map(Number) as [number, number];
  return hours * 60 + minutes;
}

function parseDate(value: unknown, field: string): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ScheduleError(`${field} debe tener formato YYYY-MM-DD.`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ScheduleError(`${field} no es una fecha válida.`);
  }
  return date;
}

function validateTimeRange(startMinute: number, endMinute: number): void {
  if (endMinute <= startMinute) {
    throw new ScheduleError("La hora de salida debe ser posterior a la hora de entrada.");
  }
}

export function toScheduleResponse(schedule: {
  id: string;
  contractorId: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  validFrom: Date;
  validUntil: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  const formatTime = (minute: number) =>
    `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

  return {
    id: schedule.id,
    contractorId: schedule.contractorId,
    dayOfWeek: schedule.dayOfWeek,
    startTime: formatTime(schedule.startMinute),
    endTime: formatTime(schedule.endMinute),
    validFrom: schedule.validFrom.toISOString().slice(0, 10),
    validUntil: schedule.validUntil?.toISOString().slice(0, 10) ?? null,
    isActive: schedule.isActive,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  };
}

export async function createScheduleFromBody(value: unknown) {
  const body = asObject(value);
  const contractorId = requiredString(body.contractorId, "contractorId");
  const dayOfWeek = parseDay(body.dayOfWeek);
  const startMinute = parseTime(body.startTime, "startTime");
  const endMinute = parseTime(body.endTime, "endTime");
  validateTimeRange(startMinute, endMinute);
  const validFrom = parseDate(body.validFrom, "validFrom");
  const validUntil = body.validUntil == null ? null : parseDate(body.validUntil, "validUntil");

  if (validUntil && validUntil < validFrom) {
    throw new ScheduleError("validUntil no puede ser anterior a validFrom.");
  }

  return createSchedule({
    contractorId,
    dayOfWeek,
    startMinute,
    endMinute,
    validFrom,
    validUntil,
  });
}

function optionalBoolean(value: unknown, field: string): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new ScheduleError(`${field} debe ser true o false.`);
}

function positiveInteger(value: unknown, fallback: number, field: string, max: number): number {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > max) {
    throw new ScheduleError(`${field} debe ser un entero entre 1 y ${max}.`);
  }
  return number;
}

export async function getSchedules(query: Record<string, unknown>) {
  const contractorId = query.contractorId === undefined
    ? undefined
    : requiredString(query.contractorId, "contractorId");
  const dayOfWeek = query.dayOfWeek === undefined ? undefined : parseDay(query.dayOfWeek);
  const isActive = query.isActive === undefined ? undefined : optionalBoolean(query.isActive, "isActive");
  const page = positiveInteger(query.page, 1, "page", 1_000_000);
  const limit = positiveInteger(query.limit, 50, "limit", 100);

  const result = await listSchedules({
    ...(contractorId ? { contractorId } : {}),
    ...(dayOfWeek ? { dayOfWeek } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    page,
    limit,
  });
  return { ...result, schedules: result.schedules.map(toScheduleResponse) };
}

export async function getScheduleById(id: string) {
  const schedule = await findScheduleById(id);
  if (!schedule) throw new ScheduleError("No se encontró el horario.", 404);
  return toScheduleResponse(schedule);
}

export async function updateScheduleFromBody(id: string, value: unknown) {
  const body = asObject(value);
  const data: Prisma.ContractorScheduleUpdateInput = {};
  let startMinute: number | undefined;
  let endMinute: number | undefined;

  if (body.contractorId !== undefined) data.contractorId = requiredString(body.contractorId, "contractorId");
  if (body.dayOfWeek !== undefined) data.dayOfWeek = parseDay(body.dayOfWeek);
  if (body.startTime !== undefined) {
    startMinute = parseTime(body.startTime, "startTime");
    data.startMinute = startMinute;
  }
  if (body.endTime !== undefined) {
    endMinute = parseTime(body.endTime, "endTime");
    data.endMinute = endMinute;
  }
  if (body.validFrom !== undefined) data.validFrom = parseDate(body.validFrom, "validFrom");
  if (body.validUntil !== undefined) {
    data.validUntil = body.validUntil === null ? null : parseDate(body.validUntil, "validUntil");
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") throw new ScheduleError("isActive debe ser booleano.");
    data.isActive = body.isActive;
  }
  if (Object.keys(data).length === 0) throw new ScheduleError("Envía al menos un campo para actualizar.");

  const current = await findScheduleById(id);
  if (!current) throw new ScheduleError("No se encontró el horario.", 404);
  validateTimeRange(startMinute ?? current.startMinute, endMinute ?? current.endMinute);

  const nextValidFrom = data.validFrom instanceof Date ? data.validFrom : current.validFrom;
  const nextValidUntil = data.validUntil instanceof Date ? data.validUntil : data.validUntil === null ? null : current.validUntil;
  if (nextValidUntil && nextValidUntil < nextValidFrom) {
    throw new ScheduleError("validUntil no puede ser anterior a validFrom.");
  }

  return updateSchedule(id, data);
}

export async function getMySchedules(contractorId: string) {
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const parts = Object.fromEntries(todayParts.map(({ type, value }) => [type, value]));
  const today = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00.000Z`);
  const schedules = await findCurrentSchedulesForContractor(contractorId, today);
  return schedules.map(toScheduleResponse);
}
