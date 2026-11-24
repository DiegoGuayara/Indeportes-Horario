import { prisma } from "../../config/prisma.js";
import type { DayOfWeek, Prisma } from "../../generated/prisma/client.js";

export interface ScheduleFilters {
  contractorId?: string;
  dayOfWeek?: DayOfWeek;
  isActive?: boolean;
  page: number;
  limit: number;
}

export const createSchedule = (data: Prisma.ContractorScheduleCreateInput) =>
  prisma.contractorSchedule.create({ data });

export const listSchedules = async (filters: ScheduleFilters) => {
  const where: Prisma.ContractorScheduleWhereInput = {
    ...(filters.contractorId ? { contractorId: filters.contractorId } : {}),
    ...(filters.dayOfWeek ? { dayOfWeek: filters.dayOfWeek } : {}),
    ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
  };

  const [schedules, total] = await prisma.$transaction([
    prisma.contractorSchedule.findMany({
      where,
      orderBy: [{ contractorId: "asc" }, { dayOfWeek: "asc" }, { startMinute: "asc" }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.contractorSchedule.count({ where }),
  ]);

  return { schedules, total, page: filters.page, limit: filters.limit };
};

export const findScheduleById = (id: string) =>
  prisma.contractorSchedule.findUnique({ where: { id } });

export const updateSchedule = (id: string, data: Prisma.ContractorScheduleUpdateInput) =>
  prisma.contractorSchedule.update({ where: { id }, data });

export const findCurrentSchedulesForContractor = (contractorId: string, today: Date) =>
  prisma.contractorSchedule.findMany({
    where: {
      contractorId,
      isActive: true,
      validFrom: { lte: today },
      OR: [{ validUntil: null }, { validUntil: { gte: today } }],
    },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
  });
