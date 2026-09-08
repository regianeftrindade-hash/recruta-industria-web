import { expect, type Locator, type Page } from "@playwright/test";

/** Botão, link ou tab do dashboard (nav usa button; URLs legadas usam link). */
export function dashNavControl(page: Page, name: RegExp): Locator {
  return page
    .getByRole("button", { name })
    .or(page.getByRole("link", { name }))
    .or(page.getByRole("tab", { name }))
    .first();
}

/** Clica no controle de nav e espera ficar visível. */
export async function clickDashNav(page: Page, name: RegExp, timeout = 20_000): Promise<Locator> {
  const control = dashNavControl(page, name);
  await expect(control).toBeVisible({ timeout });
  await control.click();
  return control;
}
