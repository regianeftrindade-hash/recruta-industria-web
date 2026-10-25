/** Dia do painel admin no horário de Brasília: 00:00 até 23:59 do mesmo dia. */

export const FUSO_BRASILIA = "America/Sao_Paulo";

type Partes = { year: number; month: number; day: number };

function partesNoFuso(date: Date, timeZone: string): Partes {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const valor = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: valor("year"), month: valor("month"), day: valor("day") };
}

/** 00:00:00.000 de um dia civil no fuso, como instante. */
export function inicioDoDiaCivil(year: number, month: number, day: number, timeZone = FUSO_BRASILIA): Date {
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcGuess));
  const valor = (type: string) => parts.find((part) => part.type === type)?.value || "0";
  const hour = valor("hour") === "24" ? 0 : Number(valor("hour"));
  const asUtc = Date.UTC(
    Number(valor("year")),
    Number(valor("month")) - 1,
    Number(valor("day")),
    hour,
    Number(valor("minute")),
    Number(valor("second")),
  );
  return new Date(utcGuess - (asUtc - utcGuess));
}

export function chaveDoDia(date: Date, timeZone = FUSO_BRASILIA): string {
  const { year, month, day } = partesNoFuso(date, timeZone);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function inicioDoDia(date: Date, timeZone = FUSO_BRASILIA): Date {
  const { year, month, day } = partesNoFuso(date, timeZone);
  return inicioDoDiaCivil(year, month, day, timeZone);
}

export function somarDiasCivis(date: Date, dias: number, timeZone = FUSO_BRASILIA): Date {
  const { year, month, day } = partesNoFuso(date, timeZone);
  const deslocado = new Date(Date.UTC(year, month - 1, day + dias));
  return inicioDoDiaCivil(
    deslocado.getUTCFullYear(),
    deslocado.getUTCMonth() + 1,
    deslocado.getUTCDate(),
    timeZone,
  );
}

/** Janela fechada do dia: início inclusive, fim exclusivo (00:00 do dia seguinte). */
export function limitesDoPainel(now = new Date(), timeZone = FUSO_BRASILIA) {
  const inicioHoje = inicioDoDia(now, timeZone);
  const fimHoje = somarDiasCivis(inicioHoje, 1, timeZone);
  const inicioSemana = somarDiasCivis(inicioHoje, -6, timeZone);
  const { year, month } = partesNoFuso(now, timeZone);
  const inicioMes = inicioDoDiaCivil(year, month, 1, timeZone);
  return { inicioHoje, fimHoje, inicioSemana, inicioMes };
}

export function ultimosDias(quantidade: number, now = new Date(), timeZone = FUSO_BRASILIA): string[] {
  const inicioHoje = inicioDoDia(now, timeZone);
  const dias: string[] = [];
  for (let i = quantidade - 1; i >= 0; i -= 1) {
    dias.push(chaveDoDia(somarDiasCivis(inicioHoje, -i, timeZone), timeZone));
  }
  return dias;
}
