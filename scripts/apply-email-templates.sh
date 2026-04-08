#!/usr/bin/env bash
# Nasadí stylizované email šablony do Supabase projektu.
# Použití: SUPABASE_PAT=<token> bash scripts/apply-email-templates.sh

PROJECT_REF="oplfjstnkhyctzprnvev"
API="https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth"
PAT="${SUPABASE_PAT:?Nastav SUPABASE_PAT=<personal_access_token>}"

# ──────────────────────────────────────────────
# Sdílené styly (inline CSS reuse via shell var)
# ──────────────────────────────────────────────
HEADER='<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Česká Scrabble</title></head><body style="margin:0;padding:0;background-color:#F5F3FF;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3FF;padding:40px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;"><tr><td style="background:linear-gradient(135deg,#6D28D9,#7C3AED);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;"><div style="width:44px;height:44px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:10px;margin:0 auto 12px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;">📖</div><p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:3px;">ČESKÁ SCRABBLE</p><p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:1px;">Online multiplayer hra</p></td></tr><tr><td style="background:#fff;border:1px solid rgba(124,58,237,0.12);border-top:none;border-radius:0 0 12px 12px;padding:36px 32px;">'

FOOTER='</td></tr><tr><td style="padding:24px 0 8px;text-align:center;"><p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">Česká Scrabble · Online multiplayer Scrabble v češtině</p><p style="margin:0;font-size:11px;color:#CBD5E1;">Pokud jste tento e-mail nečekali, ignorujte ho.</p></td></tr></table></td></tr></table></body></html>'

BTN='style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 32px;border-radius:8px;letter-spacing:0.5px;"'

H1='style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F0F23;letter-spacing:0.5px;"'
P='style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;"'
SMALL='style="margin:24px 0 0;font-size:12px;color:#94A3B8;line-height:1.6;"'
DIVIDER='<div style="height:1px;background:rgba(124,58,237,0.1);margin:24px 0;"></div>'

# ──────────────────────────────────────────────
# 1. Confirm Signup (potvrzení registrace)
# ──────────────────────────────────────────────
CONFIRM="${HEADER}
<h1 ${H1}>Ověřte svůj e-mail</h1>
<p ${P}>Vítejte v České Scrabble! Kliknutím na tlačítko níže dokončíte registraci a aktivujete svůj účet.</p>
<div style='text-align:center;margin:28px 0;'>
  <a href='{{ .ConfirmationURL }}' ${BTN}>Potvrdit e-mail</a>
</div>
${DIVIDER}
<p ${SMALL}>Odkaz vyprší za 24 hodin. Pokud jste se neregistrovali, tento e-mail ignorujte.</p>
${FOOTER}"

# ──────────────────────────────────────────────
# 2. Reset Password (obnovení hesla)
# ──────────────────────────────────────────────
RECOVERY="${HEADER}
<h1 ${H1}>Obnovení hesla</h1>
<p ${P}>Obdrželi jsme žádost o obnovení hesla k vašemu účtu. Klikněte na tlačítko níže a nastavte nové heslo.</p>
<div style='text-align:center;margin:28px 0;'>
  <a href='{{ .ConfirmationURL }}' ${BTN}>Nastavit nové heslo</a>
</div>
${DIVIDER}
<p ${SMALL}>Odkaz vyprší za 1 hodinu. Pokud jste o obnovení hesla nežádali, váš účet je v bezpečí — tento e-mail ignorujte.</p>
${FOOTER}"

# ──────────────────────────────────────────────
# 3. Email Change (změna e-mailu)
# ──────────────────────────────────────────────
EMAIL_CHANGE="${HEADER}
<h1 ${H1}>Potvrzení změny e-mailu</h1>
<p ${P}>Požádali jste o změnu e-mailové adresy vašeho účtu. Kliknutím níže změnu potvrdíte.</p>
<div style='text-align:center;margin:28px 0;'>
  <a href='{{ .ConfirmationURL }}' ${BTN}>Potvrdit nový e-mail</a>
</div>
${DIVIDER}
<p ${SMALL}>Pokud jste změnu nepožadovali, kontaktujte nás a okamžitě zabezpečte svůj účet.</p>
${FOOTER}"

# ──────────────────────────────────────────────
# 4. Magic Link (přihlášení odkazem)
# ──────────────────────────────────────────────
MAGIC="${HEADER}
<h1 ${H1}>Přihlašovací odkaz</h1>
<p ${P}>Váš jednorázový přihlašovací odkaz. Platí 1 hodinu — klikněte a jste uvnitř.</p>
<div style='text-align:center;margin:28px 0;'>
  <a href='{{ .ConfirmationURL }}' ${BTN}>Přihlásit se</a>
</div>
${DIVIDER}
<p ${SMALL}>Tento odkaz lze použít pouze jednou. Pokud jste o přihlášení nežádali, ignorujte ho.</p>
${FOOTER}"

# ──────────────────────────────────────────────
# 5. Invite (pozvánka)
# ──────────────────────────────────────────────
INVITE="${HEADER}
<h1 ${H1}>Pozvánka do České Scrabble</h1>
<p ${P}>Byl(a) jste pozván(a) k registraci. Kliknutím níže si vytvoříte účet a začnete hrát.</p>
<div style='text-align:center;margin:28px 0;'>
  <a href='{{ .ConfirmationURL }}' ${BTN}>Přijmout pozvánku</a>
</div>
${DIVIDER}
<p ${SMALL}>Odkaz vyprší za 24 hodin.</p>
${FOOTER}"

# ──────────────────────────────────────────────
# Sestavení JSON payloadu a API volání
# ──────────────────────────────────────────────
PAYLOAD=$(jq -n \
  --arg confirm_subj    "Potvrzení registrace – Česká Scrabble" \
  --arg confirm_body    "$CONFIRM" \
  --arg recovery_subj   "Obnovení hesla – Česká Scrabble" \
  --arg recovery_body   "$RECOVERY" \
  --arg email_chg_subj  "Potvrzení změny e-mailu – Česká Scrabble" \
  --arg email_chg_body  "$EMAIL_CHANGE" \
  --arg magic_subj      "Přihlašovací odkaz – Česká Scrabble" \
  --arg magic_body      "$MAGIC" \
  --arg invite_subj     "Pozvánka – Česká Scrabble" \
  --arg invite_body     "$INVITE" \
  '{
    mailer_subjects_confirmation:  $confirm_subj,
    mailer_templates_confirmation_content: $confirm_body,
    mailer_subjects_recovery:      $recovery_subj,
    mailer_templates_recovery_content: $recovery_body,
    mailer_subjects_email_change:  $email_chg_subj,
    mailer_templates_email_change_content: $email_chg_body,
    mailer_subjects_magic_link:    $magic_subj,
    mailer_templates_magic_link_content: $magic_body,
    mailer_subjects_invite:        $invite_subj,
    mailer_templates_invite_content: $invite_body
  }')

echo "▶  Nasazuji email šablony do projektu ${PROJECT_REF}..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH "$API" \
  -H "Authorization: Bearer ${PAT}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Šablony úspěšně nasazeny!"
else
  echo "❌ Chyba (HTTP $HTTP_CODE):"
  echo "$BODY"
fi
