import { describe, expect, it } from "vitest";
import { europeanizePtPt } from "@/lib/i18n/pt-pt-europeanize";

describe("europeanizePtPt", () => {
  it("troca léxico BR por PT europeu", () => {
    expect(europeanizePtPt("Cadastre-se e defina a senha do usuário")).toBe(
      "Registe-se e defina a palavra-passe do utilizador",
    );
  });

  it("não altera placeholders de e-mail", () => {
    expect(europeanizePtPt("contato@suaempresa.com.br")).toBe("contato@suaempresa.com.br");
  });
});
