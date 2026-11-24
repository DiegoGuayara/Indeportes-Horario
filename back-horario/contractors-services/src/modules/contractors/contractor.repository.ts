import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

export const createContractor = (data: Prisma.ContractorCreateInput) =>
  prisma.contractor.create({ data });

export const listContractors = async (where: Prisma.ContractorWhereInput, page: number, limit: number) => {
  const [contractors, total] = await prisma.$transaction([
    prisma.contractor.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contractor.count({ where }),
  ]);
  return { contractors, total, page, limit };
};

export const findContractor = (contractorId: string) =>
  prisma.contractor.findUnique({ where: { contractorId } });

export const updateContractor = (contractorId: string, data: Prisma.ContractorUpdateInput) =>
  prisma.contractor.update({ where: { contractorId }, data });
