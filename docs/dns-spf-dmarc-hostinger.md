# SPF, DKIM e DMARC — recrutaindustria.com (Hostinger)

Registros DNS para o e-mail `contato@recrutaindustria.com` (SMTP Hostinger).
Cole no painel: **Hostinger → Domínios → recrutaindustria.com → DNS / Zona DNS**
(ou **E-mails → Domínio → Domain settings**, se aparecer “Conectar automaticamente”).

Só pode existir **um** SPF e **um** DMARC no domínio.

---

## 1. SPF (TXT)

| Campo | Valor |
|-------|--------|
| Tipo | `TXT` |
| Nome / Host | `@` (ou em branco / `recrutaindustria.com`) |
| Conteúdo | `v=spf1 include:_spf.mail.hostinger.com ~all` |
| TTL | `3600` (ou padrão) |

Se já existir outro SPF (ex.: Google), **una** num só registro, por exemplo:

`v=spf1 include:_spf.mail.hostinger.com include:_spf.google.com ~all`

---

## 2. DMARC (TXT)

Comece em modo monitoramento (`p=none`). Depois de alguns dias sem problema, pode endurecer para `quarantine` ou `reject`.

| Campo | Valor |
|-------|--------|
| Tipo | `TXT` |
| Nome / Host | `_dmarc` |
| Conteúdo | `v=DMARC1; p=none; rua=mailto:contato@recrutaindustria.com; ruf=mailto:contato@recrutaindustria.com; fo=1; adkim=r; aspf=r` |
| TTL | `3600` |

---

## 3. DKIM (Hostinger)

Não invente a chave: a Hostinger gera.

1. **E-mails → Domínio → Domain settings** (ou **DKIM personalizado**)
2. Ative / copie o registro **CNAME** ou **TXT** que a Hostinger mostrar (geralmente algo como `hostingermail-a._domainkey`)
3. Cole na zona DNS e aguarde “conectado”

---

## 4. Conferir depois (até 24–48 h)

- https://mxtoolbox.com/spf.aspx → domínio `recrutaindustria.com`
- https://mxtoolbox.com/dmarc.aspx → `_dmarc.recrutaindustria.com`
- Envie um e-mail de teste e abra o cabeçalho: deve aparecer `spf=pass` e `dkim=pass`

---

## Ordem sugerida

1. SPF  
2. DKIM (painel Hostinger)  
3. DMARC com `p=none`  
4. Após 1–2 semanas ok → trocar DMARC para `p=quarantine`
