import { exactUi } from "@/lib/i18n/exact-ui";
import type { CallStatus } from "./types";

export function getCallStatusLabel(
  status: CallStatus,
  role: "company" | "professional",
  isInitiator: boolean,
  incomingCompany: string,
): string {
  if (status === "team_invite") {
    return `Convite — ${incomingCompany || exactUi("Colega")} quer entrevistar com você`;
  }
  if (status === "ringing") {
    if (role === "company") {
      return isInitiator ? exactUi("Chamando…") : exactUi("Aguardando candidato aceitar…");
    }
    return `Chamando — ${incomingCompany || exactUi("Empresa")}`;
  }
  if (status === "accepted") return exactUi("Em chamada");
  if (status === "declined") return exactUi("Chamada recusada");
  if (status === "missed") return exactUi("Chamada perdida");
  if (status === "ended") return exactUi("Chamada encerrada");
  return exactUi("Aguardando");
}
