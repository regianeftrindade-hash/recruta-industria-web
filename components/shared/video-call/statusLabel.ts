import type { CallStatus } from "./types";

export function getCallStatusLabel(
  status: CallStatus,
  role: "company" | "professional",
  isInitiator: boolean,
  incomingCompany: string,
): string {
  if (status === "team_invite") {
    return `Convite — ${incomingCompany || "Colega"} quer entrevistar com você`;
  }
  if (status === "ringing") {
    if (role === "company") {
      return isInitiator ? "Chamando…" : "Aguardando candidato aceitar…";
    }
    return `Chamando — ${incomingCompany || "Empresa"}`;
  }
  if (status === "accepted") return "Em chamada";
  if (status === "declined") return "Chamada recusada";
  if (status === "missed") return "Chamada perdida";
  if (status === "ended") return "Chamada encerrada";
  return "Aguardando";
}
