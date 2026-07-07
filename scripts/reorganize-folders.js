/**
 * Reorganiza lib/ e components/ em subpastas, mantendo re-exports nos caminhos antigos.
 * Uso: node scripts/reorganize-folders.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const libMap = {
  auth: ["auth.config.ts", "api-auth.ts", "admin-auth.ts"],
  security: [
    "security.ts",
    "security.server.ts",
    "security-audit.ts",
    "password-strength.ts",
  ],
  company: [
    "company-plan.ts",
    "company-premium-plans.ts",
    "company-storage.ts",
    "company-features-db.ts",
    "company-profile-display.ts",
    "company-profile-tracking.ts",
  ],
  professional: [
    "professional-plan.ts",
    "professional-premium-plans.ts",
    "professional-storage.ts",
    "professional-form-config.ts",
    "professional-profile-map.ts",
    "professional-notifications.ts",
    "professional-reports.ts",
    "professional-registration.ts",
  ],
  payment: [
    "billing.ts",
    "payment-config.ts",
    "payment-tax.ts",
    "payment-activation.ts",
    "pagseguro-client.ts",
    "pagseguro-subscriptions.ts",
    "pix-qr.ts",
    "company-payment.ts",
    "professional-payment.ts",
    "subscription-billing-storage.ts",
  ],
  profile: [
    "profile-completion.ts",
    "profile-industrial.ts",
    "profile-json-fields.ts",
    "profile-messages.ts",
    "profile-snapshot.ts",
    "sobre-mim.ts",
    "arquivo-anexo.ts",
    "teste-comportamental.ts",
  ],
  ui: [
    "theme.ts",
    "button-3d.ts",
    "logo-recruta.ts",
    "decorative-gold-line.ts",
    "dashboard-theme.tsx",
  ],
  infra: ["db.ts", "email.ts", "ensure-db-schema.ts", "users.ts"],
};

const componentMoves = [
  { from: "app/components", folder: "brand", files: ["LogoRecruta.tsx"], defaultExport: true },
  {
    from: "app/components",
    folder: "ui",
    files: [
      "PageLoader.tsx",
      "PageLoader.module.css",
      "MathCaptcha.tsx",
      "MathCaptcha.module.css",
      "PasswordStrengthMeter.tsx",
      "ProfileCompletionBar.tsx",
      "RegisterSectionHeader.tsx",
    ],
    defaultExport: true,
  },
  {
    from: "app/components",
    folder: "payment",
    files: ["PixQrCode.tsx", "BillingOptions.tsx"],
    defaultExport: false,
  },
  {
    from: "app/components",
    folder: "dashboard",
    files: ["DashboardThemeToggle.tsx"],
    defaultExport: true,
  },
  {
    from: "app/components",
    folder: "company",
    files: [
      "BandeiraFavoritoIcon.tsx",
      "CompanyPlanCards.tsx",
      "CompanyExclusiveFeatures.tsx",
      "CompanyDashboardTools.tsx",
      "CompanyCandidateProfilePanel.tsx",
    ],
    defaultExport: "mixed",
  },
  {
    from: "app",
    folder: "app-shell",
    files: ["ManifestInjector.tsx", "ServiceWorkerRegister.tsx"],
    defaultExport: true,
    noStub: true,
  },
];

const defaultOnlyCompany = new Set([
  "BandeiraFavoritoIcon.tsx",
  "CompanyPlanCards.tsx",
  "CompanyExclusiveFeatures.tsx",
  "CompanyCandidateProfilePanel.tsx",
]);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function moveFile(from, to) {
  ensureDir(path.dirname(to));
  if (!fs.existsSync(from)) {
    console.warn("skip (missing):", from);
    return false;
  }
  if (fs.existsSync(to)) {
    console.warn("skip (exists):", to);
    return false;
  }
  fs.renameSync(from, to);
  console.log("moved:", path.relative(root, from), "->", path.relative(root, to));
  return true;
}

function writeLibStub(filePath, folder, file) {
  const base = file.replace(/\.tsx?$/, "");
  const target = `./${folder}/${base}`;
  const content = `/** Re-export de compatibilidade — prefira @/lib/${folder}/${base} */\nexport * from '${target}';\n`;
  fs.writeFileSync(filePath, content, "utf8");
  console.log("lib stub:", path.relative(root, filePath));
}

function writeComponentStub(filePath, folder, file, defaultExport) {
  const base = file.replace(/\.tsx$/, "");
  const target = `@/components/${folder}/${base}`;
  let content = `/** Re-export de compatibilidade — prefira ${target} */\n`;
  const hasDefault =
    defaultExport === true ||
    (defaultExport === "mixed" && defaultOnlyCompany.has(file));
  if (hasDefault) content += `export { default } from '${target}';\n`;
  content += `export * from '${target}';\n`;
  fs.writeFileSync(filePath, content, "utf8");
  console.log("component stub:", path.relative(root, filePath));
}

function reorganizeLib() {
  for (const [folder, files] of Object.entries(libMap)) {
    for (const file of files) {
      const from = path.join(root, "lib", file);
      const to = path.join(root, "lib", folder, file);
      if (moveFile(from, to)) writeLibStub(from, folder, file);
    }
  }

  fs.writeFileSync(
    path.join(root, "lib", "auth.ts"),
    `/** Re-export de compatibilidade — prefira @/lib/auth/auth.config */\nexport { authOptions } from './auth/auth.config';\n`,
    "utf8"
  );

  const usersFile = path.join(root, "lib", "infra", "users.ts");
  if (fs.existsSync(usersFile)) {
    let content = fs.readFileSync(usersFile, "utf8");
    content = content
      .replace(
        "from './security.server'",
        "from '@/lib/security/security.server'"
      )
      .replace("from './db'", "from '@/lib/infra/db'");
    fs.writeFileSync(usersFile, content, "utf8");
  }
}

function reorganizeComponents() {
  for (const group of componentMoves) {
    for (const file of group.files) {
      const from = path.join(root, group.from, file);
      const to = path.join(root, "components", group.folder, file);
      if (!moveFile(from, to)) continue;
      if (file.endsWith(".css") || group.noStub) continue;
      writeComponentStub(from, group.folder, file, group.defaultExport);
    }
  }
}

reorganizeLib();
reorganizeComponents();
console.log("Done.");
