---
name: domaininfo (Domain WHOIS + Email Security + TLS + Screenshot)
slug: domaininfo
version: 0.1.0
author: Derek Chan
license: MIT
homepage: https://github.com/sxlderek/domaininfo-skill
description: "Look up domain WHOIS information, check email security (DMARC/SPF/DKIM), inspect TLS certificates, and capture website screenshots. Provides a comprehensive, domain-only report."
---

# domaininfo

Look up domain WHOIS information and capture website screenshots.

## When to Use

When the user types `whois <domain>` or `whois <url>` — strip any `https://`, `http://`, `www.` prefixes to get clean domain.

## Workflow (Strict Buffer-First — NO INTERMEDIATE OUTPUT)

**CRITICAL**: Zero output until everything is ready. No "processing", "capturing", "buffering" messages.

**Phase 1 — Silent Buffer**:
- Execute `whois <domain>` → store registrar data
- Execute `dig <domain>` → store A/AAAA/NS/MX records
- **Check Email Security (DMARC/SPF/DKIM)**:
  ```bash
  dig _dmarc.<domain> TXT +short          # DMARC record
  dig <domain> TXT +short | grep v=spf1   # SPF record
  dig default._domainkey.<domain> TXT +short  # DKIM (default selector)
  dig google._domainkey.<domain> TXT +short   # DKIM (Google)
  dig selector1._domainkey.<domain> TXT +short # DKIM (Microsoft/Office365)
  ```
  Store: DMARC policy (p=), SPF mechanisms, DKIM presence

**Phase 2 — Screenshot & TLS Check**:
- Capture screenshot with Chromium
- If website is HTTPS, also check TLS/SSL:
  ```bash
  echo | openssl s_client -connect domain:443 -servername domain 2>/dev/null | openssl x509 -noout -issuer -dates 2>/dev/null
  ```
  Extract:
  - TLS version (from cipher/ssl_version lines)
  - Certificate issuer (CA name)
  - Not After (expiry date)
- Wait 1 second, verify screenshot file exists

**Phase 3 — Single Final Output**:
- Send screenshot via `message` tool (if exists)
- Output complete WHOIS bullet list + Email Security section + TLS info (if HTTPS)
- ONE message only — no progress/chatter

## Send Screenshot (SINGLE SEND ONLY)

Use `message` tool with action=send and filePath:
```json
{
  "action": "send",
  "caption": "domain.com screenshot",
  "filePath": "/home/adminlin/.openclaw/workspace/domain-screenshot.png"
}
```

Do NOT also use curl fallback — single send only. If message tool fails, report failure rather than double-sending.

## Required Setup

- Xvfb running on display :99: `Xvfb :99 -screen 0 1280x1024x24 &`
- Chromium installed: `chromium-browser --version`
- Config: `browser.noSandbox: true` and `browser.headless: true` in openclaw.json

## Example Output Format

```
• Registrar: [name] (IANA ID: [id])
• Creation Date: [YYYY-MM-DD]
• Expiry Date: [YYYY-MM-DD]
• Domain Status: [status flags]
• DNS Servers: [ns1, ns2, ...]
• A Record: [IP]
• AAAA Record: [IP or none]
• MX Record: [priority] [server]

[Email Security Section]
• DMARC: [✅/❌ Active] | Policy: [none/quarantine/reject]
• DMARC Report: [rua=mailto:... or none]
• SPF: [✅/❌ Active] | Mechanisms: [a mx ip4:...]
• SPF Mode: [~all (soft) / -all (hard)]
• DKIM: [✅/❌/❓ Found] | Selector: [default/google/selector1]
• Security Score: [🟢 Excellent / 🟡 Good / 🔴 Poor]

• Website: [URL] → [status]
• Screenshot: [sent/attached]
```

## Commands

Screenshot:
```bash
export DISPLAY=:99 && chromium-browser --headless --no-sandbox --disable-gpu --screenshot=/path/to/img.png http://domain.com
```

Send via Telegram:
```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto" -F "chat_id=${USER_ID}" -F "photo=@/path/to/img.png" -F "caption=domain.com screenshot"
```
