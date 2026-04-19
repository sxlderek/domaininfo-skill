# whois-skill (OpenClaw Skill)

A domain analysis skill that produces a **domain-only report** including:

- WHOIS summary (**prefers registrar WHOIS data when it differs from registry data**)
- DNS records (A/AAAA/NS/MX/TXT)
- Email security signals (DMARC/SPF/DKIM)
- TLS certificate info (HTTPS)
- Optional website screenshot (when supported)

## Usage

In chat:

- `whois <domain>`

Input can be:

- Plain domains (e.g., `example.com`)
- Full URLs (the skill extracts the domain)
- Emails (the skill extracts the domain after `@`)

## Notes

### Registrar vs registry expiry dates

For some TLDs (notably **.com**), you may see both:

- `Registry Expiry Date`
- `Registrar Registration Expiration Date`

When they differ, this skill reports both and treats the **registrar expiration date** as the primary one.

### Screenshot behavior

Screenshot is an optional enhancement:

- If OpenClaw browser automation is available, the skill may capture a screenshot.
- Otherwise it skips screenshot capture silently.

## Files

- `SKILL.md` — main skill instructions
- `references/` — auxiliary docs (if present)
