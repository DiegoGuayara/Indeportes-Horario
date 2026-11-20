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

export const findAttendanceEventsByContractor = (contractorId: string) =>
  prisma.attendanceEvent.findMany({
    where: { contractorId },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

interface AdminAttendanceFilter {
  contractorId?: string;
  from?: Date;
  to?: Date;
  skip: number;
  take: number;
}

export const findAttendanceEvents = async (filter: AdminAttendanceFilter) => {
  const where = {
    ...(filter.contractorId ? { contractorId: filter.contractorId } : {}),
    ...(filter.from || filter.to
      ? {
          occurredAt: {
            ...(filter.from ? { gte: filter.from } : {}),
            ...(filter.to ? { lte: filter.to } : {}),
          },
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.attendanceEvent.findMany({
      where,
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.attendanceEvent.count({ where }),
  ]);

  return { events, total };
};

export const createAttendanceEventRecord = (data: NewAttendanceEvent) =>
  prisma.attendanceEvent.create({ data });
