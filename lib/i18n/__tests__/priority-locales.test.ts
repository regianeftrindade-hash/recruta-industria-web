import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const LOCALES = [
  "es",
  "fr",
  "de",
  "it",
  "pt-PT",
  "zh-CN",
  "ja",
  "ko",
  "ar",
  "hi",
] as const;

/** Short brand / plan / cognate strings that may stay identical to English. */
const ALLOW_IDENTICAL = new Set([
  "Free+",
  "Premium+",
  "Basic+",
  "Plan:",
  "Compact",
  "Tip:",
]);

function loadPriorityEn(): Record<string, string> {
  return JSON.parse(
    readFileSync(resolve(__dirname, "fixtures/priority-en.json"), "utf8"),
  ) as Record<string, string>;
}

function loadCatalog(locale: string): Record<string, string> {
  return JSON.parse(
    readFileSync(resolve(__dirname, `../messages/catalogs/${locale}.json`), "utf8"),
  ) as Record<string, string>;
}

describe("priority locale leftovers", () => {
  const priorityEn = loadPriorityEn();
  const keys = Object.keys(priorityEn);

  it("fixture covers the priority key set", () => {
    expect(keys.length).toBeGreaterThan(100);
    expect(keys).toContain("surface.auth.pitch.pro.title");
    expect(keys).toContain("mail.twoFactor.subject");
    expect(keys).toContain("fix.u.642");
  });

  for (const locale of LOCALES) {
    it(`${locale}: priority keys are not left as English (except brand/cognates)`, () => {
      const catalog = loadCatalog(locale);
      const leftovers: string[] = [];
      for (const key of keys) {
        const en = priorityEn[key];
        const value = catalog[key];
        if (value == null || value === "") {
          leftovers.push(`${key} (missing)`);
          continue;
        }
        if (value === en && !ALLOW_IDENTICAL.has(en.trim())) {
          leftovers.push(key);
        }
      }
      expect(leftovers).toEqual([]);
    });
  }
});
