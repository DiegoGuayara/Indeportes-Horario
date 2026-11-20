import { prisma } from "../../config/prisma.js";

export const findUserByEmail = (email: string) =>
  prisma.user.findUnique({
    where: { email },
  });

export const findUserByContractorId = (contractorId: string) =>
  prisma.user.findUnique({
    where: { contractorId },
  });

export const createContractorUser = (data: {
  email: string;
  passwordHash: string;
  contractorId: string;
}) =>
  prisma.user.create({
    data: {
      ...data,
      role: "CONTRACTOR",
    },
    select: {
      id: true,
      email: true,
      role: true,
      contractorId: true,
      isActive: true,
      createdAt: true,
    },
  });
