import type {
  AttendanceEventType,
  AttendanceMethod,
} from "../../generated/prisma/enums.js";
import { prisma } from "../../config/prisma.js";

interface NewAttendanceEvent {
  contractorId: string;
  eventType: AttendanceEventType;
  method: AttendanceMethod;
  siteId: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const findLatestAttendanceEvent = (contractorId: string) =>
  prisma.attendanceEvent.findFirst({
    where: { contractorId },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });

export const createAttendanceEventRecord = (data: NewAttendanceEvent) =>
  prisma.attendanceEvent.create({ data });
