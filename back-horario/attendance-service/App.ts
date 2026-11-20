import "dotenv/config";
import express from "express";
import {
  AttendanceEventType,
  AttendanceMethod,
} from "./src/generated/prisma/enums.js";
import { prisma } from "./src/config/prisma.js";

const app = express();
const PORT = Number(process.env.PORT ?? 10112);

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Attendance Service is running");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "attendance-service" });
});

app.post("/events", async (req, res) => {
  const { contractorId, eventType, method, siteId, latitude, longitude } = req.body ?? {};

  if (typeof contractorId !== "string" || contractorId.trim().length === 0) {
    return res.status(400).json({ message: "contractorId es obligatorio." });
  }

  if (!Object.values(AttendanceEventType).includes(eventType)) {
    return res.status(400).json({ message: "eventType debe ser ENTRY o EXIT." });
  }

  if (!Object.values(AttendanceMethod).includes(method)) {
    return res.status(400).json({ message: "method debe ser QR, GPS o MANUAL." });
  }

  const hasLatitude = latitude !== undefined && latitude !== null;
  const hasLongitude = longitude !== undefined && longitude !== null;
  if (hasLatitude !== hasLongitude) {
    return res.status(400).json({ message: "Envía latitud y longitud juntas." });
  }

  if (
    (hasLatitude || hasLongitude) &&
    (typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180)
  ) {
    return res.status(400).json({ message: "Las coordenadas no son válidas." });
  }

  if (method === AttendanceMethod.GPS && !hasLatitude) {
    return res.status(400).json({ message: "El método GPS requiere coordenadas." });
  }

  const typedEventType = eventType as (typeof AttendanceEventType)[keyof typeof AttendanceEventType];
  const typedMethod = method as (typeof AttendanceMethod)[keyof typeof AttendanceMethod];
  const normalizedContractorId = contractorId.trim();

  try {
    const lastEvent = await prisma.attendanceEvent.findFirst({
      where: { contractorId: normalizedContractorId },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    });

    const expectedEventType =
      lastEvent?.eventType === AttendanceEventType.ENTRY
        ? AttendanceEventType.EXIT
        : AttendanceEventType.ENTRY;

    if (typedEventType !== expectedEventType) {
      return res.status(409).json({
        message:
          expectedEventType === AttendanceEventType.ENTRY
            ? "La siguiente marcación debe ser una entrada."
            : "Ya hay una entrada registrada; la siguiente marcación debe ser una salida.",
      });
    }

    const event = await prisma.attendanceEvent.create({
      data: {
        contractorId: normalizedContractorId,
        eventType: typedEventType,
        method: typedMethod,
        siteId: typeof siteId === "string" && siteId.trim() ? siteId.trim() : null,
        latitude: hasLatitude ? latitude : null,
        longitude: hasLongitude ? longitude : null,
      },
    });

    return res.status(201).json({ data: event });
  } catch (error) {
    console.error("No se pudo registrar la marcación:", error);
    return res.status(500).json({ message: "No se pudo registrar la marcación." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Attendance Service is running on port ${PORT}`);
});
