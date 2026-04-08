#!/usr/bin/env python3
"""Nasadí stylizované email šablony do Supabase projektu."""

import json, os, sys, urllib.request, urllib.error

PROJECT_REF = "oplfjstnkhyctzprnvev"
API = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth"
PAT = os.environ.get("SUPABASE_PAT") or (sys.argv[1] if len(sys.argv) > 1 else "")

if not PAT:
    print("Chybi SUPABASE_PAT. Pouziti: python apply-email-templates.py <token>")
    sys.exit(1)

# -- Sdilene bloky --

HEADER = """<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Ceska Scrabble</title>
  <link href="https://fonts.googleapis.com/css2?family=Russo+One&family=Chakra+Petch:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F5F3FF;font-family:'Chakra Petch',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F0F23;">
<div style="background-color:#F5F3FF;background-image:linear-gradient(rgba(124,58,237,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.07) 1px,transparent 1px);background-size:40px 40px;padding:40px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;margin:0 auto;">
  <tr><td>

    <!-- Header text -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:8px;">
      <tr>
        <td align="center" style="padding:24px 0 16px;">
          <h1 style="font-family:'Russo One',Arial,sans-serif;font-size:24px;letter-spacing:0.04em;color:#7C3AED;margin:0;">CESKA SCRABBLE</h1>
        </td>
      </tr>
    </table>

    <!-- Card -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#FFFFFF;border:1px solid rgba(124,58,237,0.15);border-radius:16px;box-shadow:0 2px 20px rgba(124,58,237,0.06),0 1px 4px rgba(0,0,0,0.04);">
      <tr>
        <td style="padding:36px 32px;">
          <!-- Purple accent bar -->
          <div style="width:48px;height:4px;background:linear-gradient(90deg,#7C3AED,#A78BFA);border-radius:2px;margin-bottom:24px;"></div>
"""

FOOTER = """
        </td>
      </tr>
    </table>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <p style="font-size:12px;color:#94A3B8;margin:0;line-height:1.5;">Ceska Scrabble &middot; Online multiplayer Scrabble v cestine</p>
        </td>
      </tr>
    </table>

  </td></tr>
</table>
</div>
</body>
</html>"""

DIVIDER = '<div style="height:1px;background:rgba(124,58,237,0.12);margin:24px 0 20px;"></div>'

CTA_STYLE = ("display:inline-block;background:#7C3AED;color:#ffffff;text-decoration:none;"
             "font-family:'Chakra Petch',Arial,sans-serif;font-weight:600;font-size:15px;"
             "padding:14px 36px;border-radius:10px;"
             "box-shadow:0 0 12px rgba(124,58,237,0.28),0 4px 16px rgba(124,58,237,0.12);"
             "letter-spacing:0.02em;")


def email(title, desc, btn_label, btn_url, note):
    return HEADER + f"""
          <h2 style="font-family:'Russo One',Arial,sans-serif;font-size:20px;color:#0F0F23;margin:0 0 12px;letter-spacing:0.02em;">{title}</h2>
          <p style="font-size:15px;line-height:1.6;color:#64748B;margin:0 0 28px;">{desc}</p>

          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center" style="padding:4px 0 28px;">
              <a href="{btn_url}" target="_blank" style="{CTA_STYLE}">{btn_label}</a>
            </td></tr>
          </table>

          {DIVIDER}
          <p style="font-size:13px;line-height:1.5;color:#94A3B8;margin:0;">
            Pokud tlacitko nefunguje, zkopirujte tento odkaz do prohlizece:<br>
            <a href="{btn_url}" style="color:#7C3AED;word-break:break-all;text-decoration:none;">{btn_url}</a>
          </p>
          <p style="font-size:12px;color:#94A3B8;margin:12px 0 0;line-height:1.5;">{note}</p>
""" + FOOTER


# -- Sablony --

CONFIRM = email(
    "Potvrzeni e-mailu",
    "Vitejte v Ceske Scrabble! Kliknete na tlacitko nize pro potvrzeni vasi e-mailove adresy a aktivaci uctu.",
    "Potvrdit e-mail",
    "{{ .ConfirmationURL }}",
    "Pokud jste si nevytvorili ucet, tento e-mail ignorujte."
)

RECOVERY = email(
    "Obnoveni hesla",
    "Obdrzeli jsme zadost o obnoveni hesla k vasemu uctu. Kliknete na tlacitko nize pro nastaveni noveho hesla.",
    "Nastavit nove heslo",
    "{{ .ConfirmationURL }}",
    "Pokud jste o obnoveni hesla nezadali, vas ucet je v bezpeci."
)

EMAIL_CHANGE = email(
    "Zmena e-mailove adresy",
    "Pozadali jste o zmenu e-mailove adresy vaseho uctu. Kliknutim nize zmenu potvrdite.",
    "Potvrdit zmenu",
    "{{ .ConfirmationURL }}",
    "Pokud jste zmenu nepozadovali, kontaktujte nas prosim."
)

MAGIC = email(
    "Prihlaseni odkazem",
    "Kliknete na tlacitko nize pro prihlaseni do Ceske Scrabble. Odkaz je jednorazovy a plati omezenou dobu.",
    "Prihlasit se",
    "{{ .ConfirmationURL }}",
    "Pokud jste o prihlaseni nezadali, ignorujte tento e-mail."
)

INVITE = email(
    "Pozvanka do Ceske Scrabble",
    "Byli jste pozvani k Ceske Scrabble. Kliknete na tlacitko nize pro prijeti pozvanky a vytvoreni uctu.",
    "Prijmout pozvanku",
    "{{ .ConfirmationURL }}",
    "Odkaz vyprsi za 24 hodin."
)

# -- API volani --

payload = {
    "mailer_subjects_confirmation":          "Potvrzeni registrace - Ceska Scrabble",
    "mailer_templates_confirmation_content":  CONFIRM,
    "mailer_subjects_recovery":              "Obnoveni hesla - Ceska Scrabble",
    "mailer_templates_recovery_content":     RECOVERY,
    "mailer_subjects_email_change":          "Potvrzeni zmeny e-mailu - Ceska Scrabble",
    "mailer_templates_email_change_content": EMAIL_CHANGE,
    "mailer_subjects_magic_link":            "Prihlasovaci odkaz - Ceska Scrabble",
    "mailer_templates_magic_link_content":   MAGIC,
    "mailer_subjects_invite":                "Pozvanka - Ceska Scrabble",
    "mailer_templates_invite_content":       INVITE,
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(
    API,
    data=data,
    method="PATCH",
    headers={
        "Authorization": f"Bearer {PAT}",
        "Content-Type": "application/json",
        "User-Agent": "supabase-email-deploy/1.0",
    },
)

print(f"Nasazuji email sablony do projektu {PROJECT_REF}...")
try:
    with urllib.request.urlopen(req) as resp:
        print(f"Sablony uspesne nasazeny! (HTTP {resp.status})")
        print("   - Potvrzeni registrace")
        print("   - Obnoveni hesla")
        print("   - Zmena e-mailu")
        print("   - Magic link")
        print("   - Pozvanka")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"Chyba (HTTP {e.code}): {body}")
    sys.exit(1)
