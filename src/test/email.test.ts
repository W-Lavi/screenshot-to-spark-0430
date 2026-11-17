import { describe, it, expect } from "vitest";
import { emailValido } from "@/lib/treino-api";
describe("emailValido", () => {
  it("aceita e-mail comum", () => expect(emailValido("lucas@gmail.com")).toBe(true));
  it("recusa sem @", () => expect(emailValido("lucasgmail.com")).toBe(false));
  it("recusa sem domínio", () => expect(emailValido("lucas@gmail")).toBe(false));
  it("recusa com espaço", () => expect(emailValido("lu cas@gmail.com")).toBe(false));
});
