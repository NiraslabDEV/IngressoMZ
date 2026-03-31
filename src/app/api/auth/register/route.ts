import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { HTML_TAG_RE } from "@/lib/api";

const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório.")
    .max(100, "Nome não pode ter mais de 100 caracteres.")
    .refine((v) => !HTML_TAG_RE.test(v), { message: "Nome inválido." }),
  email: z.string().email("Email inválido."),
  password: z
    .string()
    .min(8, "Palavra-passe deve ter pelo menos 8 caracteres."),
  role: z.enum(["BUYER", "ORGANIZER"]).optional().default("BUYER"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { name, email, password, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Mensagem genérica — não confirmar se email existe ou não
    return NextResponse.json(
      { error: "Não foi possível criar a conta." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: { name, email, passwordHash, role },
  });

  // Nunca expor passwordHash — removido explicitamente antes de serializar
  const { passwordHash: _removed, ...safeUser } = user as typeof user & { passwordHash?: string };

  return NextResponse.json(safeUser, { status: 201 });
}
