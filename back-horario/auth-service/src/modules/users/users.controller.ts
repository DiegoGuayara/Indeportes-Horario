import type { RequestHandler } from "express";
import { UsersServiceError, createContractorAccount } from "./users.service.js";

export const createContractorAccountController: RequestHandler = async (req, res) => {
  try {
    const user = await createContractorAccount(req.body);
    res.status(201).json({ data: user });
  } catch (error) {
    if (error instanceof UsersServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error("No se pudo crear la cuenta del contratista:", error);
    res.status(500).json({ message: "No se pudo crear la cuenta del contratista." });
  }
};
