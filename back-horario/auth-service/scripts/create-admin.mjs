import "dotenv/config";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { prisma } from "../dist/src/config/prisma.js";
import { UserRole } from "../dist/src/generated/prisma/enums.js";

const ask = async (question) => {
  const readline = createInterface({ input: stdin, output: stdout });
  const answer = await new Promise((resolve) => readline.question(question, resolve));
  readline.close();
  return answer.trim();
};

const askHidden = async (question) => {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    return ask(question);
  }

  stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise((resolve, reject) => {
    let answer = "";

    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdout.write("\n");
    };

    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Operación cancelada."));
          return;
        }

        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(answer);
          return;
        }

        if (character === "\u007f" || character === "\b") {
          answer = Array.from(answer).slice(0, -1).join("");
          stdout.write("\b \b");
          continue;
        }

        answer += character;
        stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });
};

const main = async () => {
  try {
    const email = (await ask("Correo del administrador: ")).toLowerCase();
    if (!email || email.length > 191 || !email.includes("@")) {
      throw new Error("Escribe un correo válido de máximo 191 caracteres.");
    }

    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    if (existingAdmin) {
      throw new Error("Ya existe una cuenta ADMIN. No se creó otra.");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("Ya existe una cuenta con ese correo.");
    }

    const password = await askHidden("Contraseña (mínimo 12 caracteres): ");
    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
      throw new Error("La contraseña debe tener entre 12 y 72 bytes.");
    }

    const confirmation = await askHidden("Confirma la contraseña: ");
    if (password !== confirmation) {
      throw new Error("Las contraseñas no coinciden.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.ADMIN,
        contractorId: null,
      },
      select: { id: true, email: true, role: true },
    });

    console.log(`Cuenta ${admin.role} creada para ${admin.email}.`);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "No se pudo crear el administrador.");
  process.exitCode = 1;
});
