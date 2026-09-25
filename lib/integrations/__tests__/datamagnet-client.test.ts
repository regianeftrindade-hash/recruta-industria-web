import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractSearchPeople,
  fetchDatamagnetPerson,
  isPublicProfileUrl,
  searchDatagmaPeople,
  searchDatamagnetPeople,
  toProfileInput,
} from "@/lib/integrations/datamagnet-client";

describe("cliente Datamagnet", () => {
  const prevKey = process.env.DATAGMA_API_KEY;
  const prevLegacyKey = process.env.DATAMAGNET_API_KEY;
  const prevUrl = process.env.DATAMAGNET_API_URL;

  afterEach(() => {
    process.env.DATAGMA_API_KEY = prevKey;
    process.env.DATAMAGNET_API_KEY = prevLegacyKey;
    process.env.DATAMAGNET_API_URL = prevUrl;
    vi.unstubAllGlobals();
  });

  it("só aceita URL https", () => {
    expect(isPublicProfileUrl("https://exemplo.com/perfil/ana")).toBe(true);
    expect(isPublicProfileUrl("http://exemplo.com/perfil/ana")).toBe(false);
    expect(isPublicProfileUrl("não-é-url")).toBe(false);
  });

  it("consulta o Datagma com apiId e o link em data", async () => {
    process.env.DATAGMA_API_KEY = "chave-parceiro";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: {
            email: "carlos.teste.silva@teste.local",
            name: "Carlos Teste Silva",
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDatamagnetPerson("https://exemplo.com/perfil/carlos");
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "https://gateway.datagma.net/api/ingress/v2/full?apiId=chave-parceiro&data=https%3A%2F%2Fexemplo.com%2Fperfil%2Fcarlos",
      ),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("busca pessoas no Datagma por cargo e país", async () => {
    process.env.DATAGMA_API_KEY = "chave-parceiro";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          employees: [
            {
              name: "Ana Souza",
              jobTitle: "Programadora React",
              email: { email: "ana.souza@empresa.com" },
            },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchDatagmaPeople({
      keyword: "Programador React",
      location: "Brazil",
    });
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://datagma.net/api/v1/people-search/search",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer chave-parceiro",
        }),
        body: JSON.stringify({
          keywords: "Programador React",
          page: 1,
          location: "Brazil",
        }),
      }),
    );
  });

  it("busca pessoas por keyword e location", async () => {
    process.env.DATAMAGNET_API_KEY = "chave-parceiro";
    process.env.DATAMAGNET_API_URL = "https://api.datamagnet.co";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
          results: [
            {
              full_name: "Ana Souza",
              title: "Programadora React",
              location: "São Paulo",
            },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchDatamagnetPeople({
      keyword: "Programador React",
      location: "Brazil",
    });
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.datamagnet.co/api/v1/people-search/search",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer chave-parceiro",
        }),
        body: JSON.stringify({
          keywords: "Programador React",
          page: 1,
          location: "Brazil",
        }),
      }),
    );
    if (result.ok) {
      const people = extractSearchPeople(result.data);
      const input = toProfileInput(people[0], "Programador React", "Brazil");
      expect(input?.nome).toBe("Ana Souza");
      expect(input?.cargo).toBe("Programadora React");
      expect(input?.habilidades).toEqual(["Programador React"]);
    }
  });
});
