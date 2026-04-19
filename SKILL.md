---
name: whois-skill
slug: whois-skill
license: MIT
description: "Look up domain WHOIS information, DNS records, email security (DMARC/SPF/DKIM), and TLS details with an optional website screenshot."
---

# whois-skill

Look up domain WHOIS information and (optionally) capture website screenshots.

## When to Use

When the user types `whois <domain>` or `whois <url>` or `whois <email>`:
- Strip any `https://`, `http://`, `www.` prefixes
- If input contains `@`, extract the domain part after `@` (e.g., `user@example.com` → `example.com`)

## Security Considerations

- **Input validation**: After extracting the domain, only allow alphanumeric, hyphen, and dot characters. Reject anything else.
- **Command injection prevention**: Never interpolate user input directly into shell strings. Prefer argument arrays / safe libraries.
- **Timeouts**: Every external call must have a bounded timeout (e.g., 10s for WHOIS/DNS, 10s for TLS).
- **Error handling**: On failure, return a generic user-friendly message and keep details internal.
- **Output sanitization**: Build the final message as a single string before sending; never send partial responses.
- **File-system safety**: If writing screenshots, restrict writes to a known directory under the skill folder and verify paths stay within it.
- **Rate-limiting & caching**: Cache IP-to-country lookups briefly to avoid hammering external services.

## Workflow (Strict Buffer-First — SAFE EXECUTION)

**CRITICAL**: Zero output until everything is ready. No progress messages.

### Output capture rule (avoid truncated exec output)

When using `exec`, **do not rely on stdout** for multi-section reports.
Instead:

1. Create a temp working directory (e.g., `mktemp -d`) under `/tmp`.
2. Redirect each command’s output into files inside that directory.
3. After commands finish, use the `read` tool to load the needed parts of those files.
4. Build the final report from the file contents and send **one** final message.

This prevents partial/truncated tool output from breaking the report.

### Phase 1 — Silent Buffer with Validation

1. **Extract & validate domain**
   - Strip `https://`, `http://`, `www.` prefixes.
   - If input contains `@`, take the part after `@`.
   - Validate with regex `^[a-z0-9.-]+$` (case-insensitive).
   - If invalid, abort and return “❌ Invalid domain”.
2. **WHOIS**: run `whois` via safe exec with timeout (10s).
   - Prefer and summarize the **registrar WHOIS** fields (e.g., `Registrar Registration Expiration Date`) when both registry and registrar dates exist.
   - If the output includes both `Registry Expiry Date` and `Registrar Registration Expiration Date` and they differ, report **both** and label them clearly, but treat the **registrar expiration** as the primary one.
3. **DNS**: run `dig` for A, AAAA, NS, MX via safe exec with timeout (10s). Store results.
4. **IP Geolocation (Country Code)**
   - For each IP from A/AAAA and resolved NS/MX hostnames:
     - Query `https://ipinfo.io/{IP}/country` using `web_fetch` with timeout (5s).
     - Store the returned 2-letter country code.
5. **Email Security (DMARC/SPF/DKIM)**
   - DMARC: query TXT for `_dmarc.<domain>`
   - SPF: query TXT for `<domain>` and extract the string containing `v=spf1` (parse in code; avoid shell pipelines)
   - DKIM: query TXT for common selectors (`default`, `google`, `selector1`)

### Phase 2 — Screenshot + TLS

#### Screenshot (do it when tooling is available)

If screenshot tooling is available in this runtime, **capture a screenshot by default**.

Preferred order:

1. **OpenClaw `browser` tool** (preferred):
   - Navigate to `https://<domain>/` (fallback to `http://<domain>/` if HTTPS fails).
   - Wait briefly for render (~1–3s).
   - Take **one** screenshot (prefer `fullPage: true`).
   - Keep the screenshot as an attachment for the final output.

2. **Bundled Playwright script**: `scripts/domain-screenshot.js` (ONLY if Node + Playwright + a Chromium runtime are already installed).

If neither is available (missing tool / missing module / missing browser runtime), **skip the screenshot silently** and continue the report.

#### TLS/SSL Check (if HTTPS)

- Fetch certificate info with `openssl` (timeout 10s).
- Extract: certificate issuer and expiry date.
- If it fails or times out, note “TLS check failed” but continue.

#### Mail TLS Certificate Expiry (SMTP STARTTLS on MX)

Check certificate expiry for **inbound mail** on the domain’s mail exchangers using **SMTP STARTTLS** (this is the correct TLS mode for MX hosts in most setups).

- Determine candidate mail hosts from **MX records** collected in Phase 1.
  - Prefer the **lowest preference** MX first.
  - If multiple MX exist, you may check all unique hosts (cap at ~3) and report each.
  - If no MX records exist, skip.
- For each MX host, check **SMTP STARTTLS on port `25`** with bounded timeout (10–15s).
- Extract: `subject`, `issuer`, and `notAfter` (expiry).
- If STARTTLS is not offered, handshake fails, or times out, record a clear failure note and continue.

Example (shell form; keep inputs strictly validated + quoted):

```bash
MX_HOST="<from MX>"
# SMTP STARTTLS (port 25)
echo | timeout 15s openssl s_client -starttls smtp -connect "$MX_HOST:25" -servername "$MX_HOST" 2>/dev/null \
  | openssl x509 -noout -subject -issuer -enddate 2>/dev/null
```

Optional (client mail endpoints): if the user explicitly asks for **SMTPS/IMAPS/POP3S** expiry, do **not** assume MX hosts provide those services.
Instead, check explicit hostnames (e.g. `smtp.<domain>`, `imap.<domain>`, `pop.<domain>`, `mail.<domain>`) or user-provided endpoints on ports `465/993/995`.

### Phase 3 — Single Final Output

- If a screenshot was captured:
  - Prefer delivering it as part of the same outward response (for example as a tool attachment, depending on runtime).
  - If you must send it separately, use the `message` tool **once**.
- Send the final WHOIS + DNS + Email Security + TLS summary in **one** message.

## Sending screenshot media (when needed)

If your runtime requires using the `message` tool to deliver an image, send **one** screenshot.

```json
{
  "action": "send",
  "caption": "domain.com screenshot",
  "filePath": "domain-screenshot.png"
}
```

Notes:
- Some environments restrict which local paths can be attached. If the screenshot path is not allowed, either write the screenshot into an allowed workspace/media directory (if feasible) or skip sending the image and continue the report.
- Do NOT implement provider-API fallbacks (raw HTTP to Telegram, etc.). If sending fails, report failure rather than double-sending.

## Setup Notes

- This skill does **not** include step-by-step installation instructions for Playwright/Chromium.
- Screenshot is an **optional enhancement** and must be skipped if screenshot tooling is not already present.
- See `references/setup.md` for non-invasive environment notes.
