import { describe, expect, it } from "vitest";
import { escolherPastaEnviados } from "@/lib/admin/sent-folder";

describe("escolherPastaEnviados", () => {
  it("prefere a pasta marcada como Enviados", () => {
    expect(escolherPastaEnviados([
      { path: "INBOX", specialUse: "\\Inbox" },
      { path: "INBOX.Sent", name: "Sent", specialUse: "\\Sent" },
      { path: "INBOX.Trash", specialUse: "\\Trash" },
    ])).toBe("INBOX.Sent");
  });

  it("aceita o nome Enviados quando não há marca especial", () => {
    expect(escolherPastaEnviados([
      { path: "INBOX" },
      { path: "INBOX.Enviados", name: "Enviados" },
    ])).toBe("INBOX.Enviados");
  });

  it("não confunde lixeira nem rascunho com Enviados", () => {
    expect(escolherPastaEnviados([
      { path: "INBOX.Trash", specialUse: "\\Trash" },
      { path: "INBOX.Drafts", name: "Drafts" },
      { path: "INBOX.Sent Messages", name: "Sent Messages" },
    ])).toBe("INBOX.Sent Messages");
  });

  it("devolve vazio quando a caixa não tem pasta Enviados", () => {
    expect(escolherPastaEnviados([
      { path: "INBOX", specialUse: "\\Inbox" },
      { path: "INBOX.Trash", specialUse: "\\Trash" },
    ])).toBeNull();
  });
});
