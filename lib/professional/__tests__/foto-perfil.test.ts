import { describe, expect, it } from "vitest";
import {
  caminhoFotoPerfil,
  fotoPerfilParaSalvar,
  fotoPerfilSrc,
  patchFotoNoSnapshot,
} from "@/lib/professional/foto-perfil";

describe("foto de perfil", () => {
  it("guarda o caminho e renova o link da imagem", () => {
    const path = "avatars/ana@recruta.ind.br/10_foto.jpg";
    expect(caminhoFotoPerfil(path)).toBe(path);
    expect(fotoPerfilParaSalvar(`https://projeto.supabase.co/storage/v1/object/sign/uploads/${path}?token=abc`)).toBe(path);
    expect(fotoPerfilSrc(path)).toBe(`/api/media/sign?path=${encodeURIComponent(path)}&redirect=1`);
    expect(fotoPerfilSrc(`https://projeto.supabase.co/storage/v1/object/public/uploads/${path}`)).toBe(
      `/api/media/sign?path=${encodeURIComponent(path)}&redirect=1`,
    );
    expect(fotoPerfilParaSalvar("data:image/png;base64,aaaa")).toBeNull();
    expect(caminhoFotoPerfil("../secret")).toBeNull();
    expect(caminhoFotoPerfil("avatars/%2e%2e/segredo")).toBeNull();
  });

  it("troca só a foto no snapshot existente", () => {
    const antes = JSON.stringify({
      nome: "Ana",
      formData: { nome: "Ana", fotoPerfil: "" },
    });
    const depois = JSON.parse(patchFotoNoSnapshot(antes, "avatars/ana@recruta.ind.br/10_foto.jpg"));
    expect(depois.nome).toBe("Ana");
    expect(depois.fotoPerfil).toBe("avatars/ana@recruta.ind.br/10_foto.jpg");
    expect(depois.formData.fotoPerfil).toBe("avatars/ana@recruta.ind.br/10_foto.jpg");
    expect(depois.formData.nome).toBe("Ana");
  });
});
