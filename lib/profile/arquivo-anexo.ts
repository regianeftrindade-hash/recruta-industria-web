export function isArquivoAnexado(url: unknown): url is string {
  if (!url || typeof url !== 'string') return false;
  const valor = url.trim();
  if (!valor) return false;
  return (
    valor.startsWith('/uploads')
    || valor.startsWith('http://')
    || valor.startsWith('https://')
    || valor.startsWith('data:')
  );
}

export function isArquivoNoServidor(url: string): boolean {
  const valor = url.trim();
  return (
    valor.startsWith('/uploads')
    || valor.startsWith('http://')
    || valor.startsWith('https://')
  );
}

export function nomeArquivoAnexado(url: string): string {
  if (url.startsWith('data:')) return 'arquivo em rascunho';

  try {
    const caminho = url.includes('://') ? new URL(url).pathname : url;
    const nome = decodeURIComponent(caminho.split('/').pop() || '');
    return nome || 'arquivo anexado';
  } catch {
    return 'arquivo anexado';
  }
}
