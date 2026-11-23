#!/usr/bin/env bash
# Restaura es.json completo a partir do commit 755ea070 e reintegra chaves CPF/CNPJ.
# Também regenera es-seg-0..3 usados pelo translate.ts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git show 755ea070:lib/i18n/messages/catalogs/es.json > lib/i18n/messages/catalogs/es.json

python3 - <<'PY'
import json
from pathlib import Path
p = Path("lib/i18n/messages/catalogs/es.json")
d = json.loads(p.read_text())
d["registration.simple.cpfBrazilOnly"] = "El CPF solo se acepta en registros de Brasil."
d["registration.simple.cnpjBrazilOnly"] = "El CNPJ solo se acepta en registros de Brasil."
p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
print("es.json keys:", len(d))
items = list(d.items())
n, size = 4, (len(items) + 3) // 4
for i in range(n):
    part = dict(items[i * size : (i + 1) * size])
    Path(f"lib/i18n/messages/catalogs/es-seg-{i}.json").write_text(
        json.dumps(part, ensure_ascii=False, separators=(",", ":"))
    )
    print(f"es-seg-{i}.json", len(part))
PY

echo "Pronto. Revise, commit e push:"
echo "  git add lib/i18n/messages/catalogs/es.json lib/i18n/messages/catalogs/es-seg-*.json"
echo "  git commit -m 'fix(i18n): restore full Spanish catalog from 755ea070'"
echo "  git push origin main"
