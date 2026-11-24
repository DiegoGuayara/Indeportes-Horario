import type { RequestHandler } from "express";
import {
  ContractorError,
  createContractorFromBody,
  deactivateContractor,
  getContractorById,
  getContractors,
  updateContractorFromBody,
} from "./contractor.service.js";

function respondError(error: unknown, res: Parameters<RequestHandler>[1]) {
  if (error instanceof ContractorError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }
  const code = (error as { code?: string } | null)?.code;
  if (code === "P2002") {
    res.status(409).json({ message: "Ya existe un contratista con ese código o documento." });
    return;
  }
  if (code === "P2025") {
    res.status(404).json({ message: "No se encontró el contratista." });
    return;
  }
  console.error("Error en contractors-service:", error);
  res.status(500).json({ message: "Ocurrió un error interno." });
}

function paramId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const createContractor: RequestHandler = async (req, res) => {
  try {
    res.status(201).json({ data: await createContractorFromBody(req.body) });
  } catch (error) { respondError(error, res); }
};

export const listContractors: RequestHandler = async (req, res) => {
  try {
    res.status(200).json(await getContractors(req.query as Record<string, unknown>));
  } catch (error) { respondError(error, res); }
};

export const getContractor: RequestHandler = async (req, res) => {
  try {
    res.status(200).json({ data: await getContractorById(paramId(req.params.contractorId)) });
  } catch (error) { respondError(error, res); }
};

export const updateContractor: RequestHandler = async (req, res) => {
  try {
    res.status(200).json({ data: await updateContractorFromBody(paramId(req.params.contractorId), req.body) });
  } catch (error) { respondError(error, res); }
};

export const deleteContractor: RequestHandler = async (req, res) => {
  try {
    res.status(200).json({ data: await deactivateContractor(paramId(req.params.contractorId)) });
  } catch (error) { respondError(error, res); }
};
