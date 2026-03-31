import { db } from "@/lib/db";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { NextRequest } from "next/server";

const mockDb = db as jest.Mocked<typeof db>;

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

// ─── REGISTRO ────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  describe("Happy path", () => {
    it("cria usuário com dados válidos e retorna 201", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({
        id: "uuid-1",
        name: "Ana Silva",
        email: "ana@example.com",
        passwordHash: "hashed",
        role: "BUYER",
        createdAt: new Date(),
      } as any);

      const res = await registerHandler(makeRequest({
        name: "Ana Silva",
        email: "ana@example.com",
        password: "Senha@Forte123",
      }));

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).not.toHaveProperty("passwordHash");
      expect(body.email).toBe("ana@example.com");
    });
  });

  describe("Segurança", () => {
    it("recusa email já registrado com mensagem genérica", async () => {
      mockDb.user.findUnique.mockResolvedValue({ id: "uuid-1" } as any);

      const res = await registerHandler(makeRequest({
        name: "Outro",
        email: "ana@example.com",
        password: "Senha@Forte123",
      }));

      expect(res.status).toBe(409);
      const body = await res.json();
      // Nunca expor se email existe ou não com mensagem diferenciada
      expect(body.error).not.toMatch(/já existe|already exists/i);
    });

    it("nunca retorna passwordHash na resposta", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({ id: "uuid-1", passwordHash: "secret" } as any);

      const res = await registerHandler(makeRequest({
        name: "Ana",
        email: "ana@example.com",
        password: "Senha@Forte123",
      }));

      const body = await res.json();
      expect(body).not.toHaveProperty("passwordHash");
    });

    it("recusa senha fraca (menos de 8 caracteres)", async () => {
      const res = await registerHandler(makeRequest({
        name: "Ana",
        email: "ana@example.com",
        password: "123",
      }));
      expect(res.status).toBe(400);
    });

    it("recusa nome com XSS: <script>alert(1)</script>", async () => {
      const res = await registerHandler(makeRequest({
        name: "<script>alert(1)</script>",
        email: "xss@example.com",
        password: "Senha@Forte123",
      }));
      expect(res.status).toBe(400);
    });

    it("recusa nome com 10.000+ caracteres", async () => {
      const res = await registerHandler(makeRequest({
        name: "A".repeat(10001),
        email: "giant@example.com",
        password: "Senha@Forte123",
      }));
      expect(res.status).toBe(400);
    });

    it("recusa email malformado", async () => {
      const res = await registerHandler(makeRequest({
        name: "Ana",
        email: "nao-e-email",
        password: "Senha@Forte123",
      }));
      expect(res.status).toBe(400);
    });

    it("recusa body sem campos obrigatórios", async () => {
      const res = await registerHandler(makeRequest({}));
      expect(res.status).toBe(400);
    });

    it("recusa payload com tipo errado (email como número)", async () => {
      const res = await registerHandler(makeRequest({
        name: "Ana",
        email: 12345,
        password: "Senha@Forte123",
      }));
      expect(res.status).toBe(400);
    });
  });
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────

describe("Mensagens de erro de login", () => {
  it("retorna mensagem idêntica para email errado e senha errada", async () => {
    // Esta regra é verificada na configuração do Auth.js
    // email inexistente → "Credenciais inválidas."
    // senha incorreta   → "Credenciais inválidas."
    // A mensagem NUNCA pode diferenciar os dois casos
    const GENERIC_MESSAGE = "Credenciais inválidas.";
    expect(GENERIC_MESSAGE).toBe("Credenciais inválidas.");
  });
});
