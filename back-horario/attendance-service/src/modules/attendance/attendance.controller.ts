import type { RequestHandler } from "express";
import { AttendanceServiceError, registerAttendanceEvent } from "./attendance.service.js";

export const createAttendanceEvent: RequestHandler = async (req, res) => {
  try {
    const event = await registerAttendanceEvent(req.body);
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
