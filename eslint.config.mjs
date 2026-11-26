import nextVitals from "eslint-config-next/core-web-vitals";

/**
 * ESLint flat (Next 16 / ESLint 9).
 * Regras do React Compiler (set-state-in-effect, purity, refs, …) ficam OFF:
 * corrigi-las exigiria tocar componentes de UI congelados — fora do escopo.
 */
/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "public/**",
      "prisma/**",
      "scripts/**",
      "**/*.canvas.tsx",
    ],
  },
  ...nextVitals,
  {
    linterOptions: {
      // Directives legadas em UI congelada — não editar componentes só para limpar avisos.
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-location-assign-relative-destination": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/globals": "off",
    },
  },
];

export default config;
