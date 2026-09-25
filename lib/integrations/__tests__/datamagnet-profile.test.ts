import { afterEach, describe, expect, it } from "vitest";
import {
  parseDatamagnetProfile,
  validateDatamagnetIngestKey,
} from "@/lib/integrations/datamagnet-profile";

const payload = {
  nome: "Ana Souza",
  email: "ana@exemplo.com",
  cargo: "Soldadora",
  habilidades: ["MIG", "TIG"],
};

describe("ingestão Datamagnet", () => {
  const prev = process.env.DATAGMA_INGEST_KEY;

  afterEach(() => {
    process.env.DATAGMA_INGEST_KEY = prev;
  });

  it("recusa chave ausente ou diferente", () => {
    process.env.DATAGMA_INGEST_KEY = "chave-oficial";
    expect(validateDatamagnetIngestKey(null)).toBe(false);
    expect(validateDatamagnetIngestKey("outra")).toBe(false);
    expect(validateDatamagnetIngestKey("chave-oficial")).toBe(true);
  });

  it("recusa quando a chave do servidor não está definida", () => {
    delete process.env.DATAGMA_INGEST_KEY;
    expect(validateDatamagnetIngestKey("chave-oficial")).toBe(false);
  });

  it("aceita o JSON do parceiro com full_name, headline e skills", () => {
    const parsed = parseDatamagnetProfile({
      full_name: "Carlos Teste Silva",
      headline: "Desenvolvedor Full Stack Senior",
      location: "São Paulo, Brasil",
      skills: ["React", "Node.js", "SQL"],
      email: "carlos.teste.silva@teste.local",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.nome).toBe("Carlos Teste Silva");
      expect(parsed.data.cargo).toBe("Desenvolvedor Full Stack Senior");
      expect(parsed.data.location).toBe("São Paulo, Brasil");
    }
  });

  it("lê o perfil dentro de message, com full_name e profile_headline", () => {
    const parsed = parseDatamagnetProfile({
      message: {
        full_name: "Erasmo Silva",
        first_name: "Erasmo",
        last_name: "Silva",
        profile_headline: "Soldador industrial",
        job_title: "Soldador",
        location: "São Paulo, Brasil",
        skills: ["MIG"],
        email: "erasmo.silva@teste.local",
      },
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.nome).toBe("Erasmo Silva");
      expect(parsed.data.cargo).toBe("Soldador industrial");
    }
  });

  it("monta o nome com first_name e last_name quando full_name vem vazio", () => {
    const parsed = parseDatamagnetProfile({
      message: {
        full_name: "",
        first_name: "Erasmo",
        last_name: "Silva",
        job_title: "Soldador",
        skills: ["TIG"],
        email: "erasmo.silva@teste.local",
      },
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.nome).toBe("Erasmo Silva");
      expect(parsed.data.cargo).toBe("Soldador");
    }
  });

  it("aceita nome, e-mail, cargo e habilidades", () => {
    const parsed = parseDatamagnetProfile(payload);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.habilidades).toEqual(["MIG", "TIG"]);
      expect(parsed.data.email).toBe("ana@exemplo.com");
    }
  });

  it("lê o e-mail real em data.email", () => {
    const parsed = parseDatamagnetProfile({
      data: {
        email: "ana.souza@empresa.com",
        name: "Ana Souza",
        jobTitle: "Soldadora",
        skills: ["MIG", "TIG"],
        location: "São Paulo, Brasil",
      },
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.email).toBe("ana.souza@empresa.com");
      expect(parsed.data.nome).toBe("Ana Souza");
      expect(parsed.data.cargo).toBe("Soldadora");
      expect(parsed.data.habilidades).toEqual(["MIG", "TIG"]);
    }
  });

  it("rejeita campos fora do formato", () => {
    expect(parseDatamagnetProfile({ ...payload, email: "sem-arroba" }).ok).toBe(
      false,
    );
    expect(parseDatamagnetProfile({ ...payload, email: "" }).ok).toBe(false);
    expect(parseDatamagnetProfile({ ...payload, habilidades: [] }).ok).toBe(
      false,
    );
    expect(parseDatamagnetProfile({ ...payload, habilidades: [""] }).ok).toBe(
      false,
    );
    expect(parseDatamagnetProfile({ ...payload, cargo: " " }).ok).toBe(false);
  });
});
