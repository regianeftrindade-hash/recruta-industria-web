/** Foca e destaca o primeiro campo faltando nos cadastros. */
export function focarCampoCadastro(fieldId: string | null | undefined): void {
  if (!fieldId || typeof document === "undefined") return;
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  if (typeof (el as HTMLElement).focus === "function") {
    try {
      (el as HTMLElement).focus({ preventScroll: true });
    } catch {
      (el as HTMLElement).focus();
    }
  }
}
