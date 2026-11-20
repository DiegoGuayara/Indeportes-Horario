import type { RequestHandler } from "express";
import {
  AttendanceServiceError,
  getAdminAttendanceHistory,
  getAttendanceHistory,
  registerAttendanceEvent,
} from "./attendance.service.js";

export const createAttendanceEvent: RequestHandler = async (req, res) => {
  try {
    const auth = res.locals.auth as { contractorId: string };
    const event = await registerAttendanceEvent(req.body, auth.contractorId);
    res.status(201).json({ data: event });
  } catch (error) {
    if (error instanceof AttendanceServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error("No se pudo registrar la marcación:", error);
    res.status(500).json({ message: "No se pudo registrar la marcación." });
  }
};

export const getMyAttendanceEvents: RequestHandler = async (_req, res) => {
  try {
    const auth = res.locals.auth as { contractorId: string };
    const events = await getAttendanceHistory(auth.contractorId);
    res.status(200).json({ data: events, limit: 100 });
  } catch (error) {
    console.error("No se pudo consultar el historial de asistencia:", error);
    res.status(500).json({ message: "No se pudo consultar el historial de asistencia." });
  }
};

export const getAdminAttendanceEvents: RequestHandler = async (req, res) => {
  try {
    const result = await getAdminAttendanceHistory(req.query);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AttendanceServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error("No se pudo consultar el historial administrativo:", error);
    res.status(500).json({ message: "No se pudo consultar el historial administrativo." });
  }
};
