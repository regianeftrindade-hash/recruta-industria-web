import { describe, expect, it } from "vitest";
import {
  EMPTY_PROPOSAL_TRACKING,
  mergeProposalFunnel,
  parseProposalFunnelPatch,
} from "@/lib/company/job-proposals-shared";

describe("mergeProposalFunnel / parseProposalFunnelPatch", () => {
  it("contratado e naoContratado são mutuamente exclusivos", () => {
    const base = { ...EMPTY_PROPOSAL_TRACKING, naoContratado: true };
    const next = mergeProposalFunnel(base, { contratado: true });
    expect(next.contratado).toBe(true);
    expect(next.naoContratado).toBe(false);

    const other = mergeProposalFunnel({ ...EMPTY_PROPOSAL_TRACKING, contratado: true }, { naoContratado: true });
    expect(other.naoContratado).toBe(true);
    expect(other.contratado).toBe(false);
  });

  it("preserva campos omitidos no patch", () => {
    const current = { ...EMPTY_PROPOSAL_TRACKING, entrevistado: true, emTeste: true };
    const next = mergeProposalFunnel(current, { contatado: true });
    expect(next.entrevistado).toBe(true);
    expect(next.emTeste).toBe(true);
    expect(next.contatado).toBe(true);
  });

  it("parse ignora valores não booleanos", () => {
    const patch = parseProposalFunnelPatch({
      contratado: true,
      naoContratado: "sim",
      entrevistado: 1,
      emTeste: false,
      junk: true,
    });
    expect(patch).toEqual({ contratado: true, emTeste: false });
  });

  it("false explícito sobrescreve true atual", () => {
    const current = {
      ...EMPTY_PROPOSAL_TRACKING,
      contatado: true,
      entrevistado: true,
      emTeste: true,
      entrevistaCancelada: true,
    };
    const next = mergeProposalFunnel(current, {
      contatado: false,
      entrevistado: false,
      emTeste: false,
      entrevistaCancelada: false,
    });
    expect(next).toEqual({ ...EMPTY_PROPOSAL_TRACKING });
  });

  it("contratado true não zera entrevistaCancelada nem emTeste", () => {
    const next = mergeProposalFunnel(
      { ...EMPTY_PROPOSAL_TRACKING, emTeste: true, entrevistaCancelada: true },
      { contratado: true },
    );
    expect(next.contratado).toBe(true);
    expect(next.naoContratado).toBe(false);
    expect(next.emTeste).toBe(true);
    expect(next.entrevistaCancelada).toBe(true);
  });

  it("parse aceita contatado e entrevistaCancelada", () => {
    expect(
      parseProposalFunnelPatch({ contatado: true, entrevistaCancelada: false, extra: null }),
    ).toEqual({ contatado: true, entrevistaCancelada: false });
  });
});
