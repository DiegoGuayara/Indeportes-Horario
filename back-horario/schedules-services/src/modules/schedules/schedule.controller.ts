import type { RequestHandler } from "express";
import type { AuthContext } from "../../middlewares/authenticate.js";
import { ScheduleError, createScheduleFromBody, getMySchedules, getScheduleById, getSchedules, toScheduleResponse, updateScheduleFromBody } from "./schedule.service.js";

function sendError(error: unknown, res: Parameters<RequestHandler>[1]): void {
  if (error instanceof ScheduleError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  const code = (error as { code?: string } | null)?.code;
  if (code === "P2025") {
    res.status(404).json({ message: "No se encontró el horario." });
    return;
  }
  if (code === "P2002") {
    res.status(409).json({ message: "Ya existe un registro con esos datos." });
    return;
  }

  console.error("Error en schedules-service:", error);
  res.status(500).json({ message: "Ocurrió un error interno." });
}

function routeId(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const createSchedule: RequestHandler = async (req, res) => {
  try {
    const schedule = await createScheduleFromBody(req.body);
    res.status(201).json({ data: toScheduleResponse(schedule) });
  } catch (error) {
    sendError(error, res);
  }
};

export const listSchedules: RequestHandler = async (req, res) => {
  try {
    const result = await getSchedules(req.query as Record<string, unknown>);
    res.status(200).json(result);
  } catch (error) {
    sendError(error, res);
  }
};

export const getSchedule: RequestHandler = async (req, res) => {
  try {
    const schedule = await getScheduleById(routeId(req.params.id));
    res.status(200).json({ data: schedule });
  } catch (error) {
    sendError(error, res);
  }
};

export const updateSchedule: RequestHandler = async (req, res) => {
  try {
    const schedule = await updateScheduleFromBody(routeId(req.params.id), req.body);
    res.status(200).json({ data: toScheduleResponse(schedule) });
  } catch (error) {
    sendError(error, res);
  }
};

export const deactivateSchedule: RequestHandler = async (req, res) => {
  try {
    const current = await getScheduleById(routeId(req.params.id));
    const schedule = await updateScheduleFromBody(current.id, { isActive: false });
    res.status(200).json({ data: toScheduleResponse(schedule) });
  } catch (error) {
    sendError(error, res);
  }
};

export const getMySchedule: RequestHandler = async (_req, res) => {
  const auth = res.locals.auth as AuthContext | undefined;
  if (!auth?.contractorId) {
    res.status(403).json({ message: "La cuenta no tiene un contratista asociado." });
    return;
  }

  try {
    const schedules = await getMySchedules(auth.contractorId);
    res.status(200).json({ data: schedules });
  } catch (error) {
    sendError(error, res);
  }
};
