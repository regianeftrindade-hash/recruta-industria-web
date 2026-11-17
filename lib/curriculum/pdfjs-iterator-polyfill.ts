/** PDF.js 6 consulta Iterator antes de criar o método. Node 20 ainda não tem essa classe. */
const scope = globalThis as typeof globalThis & {
  Iterator?: { prototype: { join?: (separator: string) => string } };
};

if (typeof scope.Iterator === "undefined") {
  class IteratorPolyfill {}
  scope.Iterator = IteratorPolyfill as unknown as typeof scope.Iterator;
}
