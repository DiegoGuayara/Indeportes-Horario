import type { RequestHandler } from "express";
import { AuthServiceError, login } from "./auth.service.js";

export const loginController: RequestHandler = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
    res.status(400).json({ message: "Debes enviar correo y contraseña." });
    return;
  }

  if (email.length > 191 || Buffer.byteLength(password, "utf8") > 72) {
    res.status(400).json({ message: "El correo o la contraseña exceden el tamaño permitido." });
    return;
  }

  try {
    const result = await login(email, password);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    console.error("No se pudo iniciar sesión:", error);
    res.status(500).json({ message: "No se pudo iniciar sesión." });
  }
};
