import type { ProfileIndustrialData } from '@/lib/profile-industrial';

function norm(value: string): string {
  return value.trim().toLowerCase();
}

/** Remove itens já exibidos em seções categorizadas do perfil. */
export function filterHabilidadesExtras(
  habilidades: string[],
  industrial: Pick<
    ProfileIndustrialData,
    | 'segmentosIndustria'
    | 'maquinasEquipamentos'
    | 'qualidadeProcessos'
    | 'informatica'
    | 'certificacoes'
    | 'idiomas'
    | 'cursos'
  >,
): string[] {
  const known = new Set(
    [
      ...industrial.segmentosIndustria,
      ...industrial.maquinasEquipamentos,
      ...industrial.qualidadeProcessos,
      ...industrial.informatica,
      ...industrial.certificacoes,
      ...industrial.idiomas,
      ...industrial.cursos,
    ].map(norm),
  );

  const seen = new Set<string>();
  return habilidades.filter((item) => {
    const key = norm(item);
    if (!key || known.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = norm(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item.trim());
  }
  return result;
}
