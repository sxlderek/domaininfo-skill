---
name: domaininfo
license: MIT
description: "Look up domain WHOIS information, check email security (DMARC/SPF/DKIM), inspect TLS certificates, and capture website screenshots. Provides a comprehensive, domain-only report."
---

# domaininfo

Look up domain WHOIS information and capture website screenshots.

## When to Use

When the user types `whois <domain>` or `whois <url>` or `whois <email>`:
- Strip any `https://`, `http://`, `www.` prefixes
- If input contains `@`, extract the domain part after `@` (e.g., `user@example.com` → `example.com`)

## Workflow (Strict Buffer-First — NO INTERMEDIATE OUTPUT)

**CRITICAL**: Zero output until everything is ready. No "processing", "capturing", "buffering" messages.

**Phase 1 — Silent Buffer**:
- Execute `whois <domain>` → store registrar data
- Execute `dig <domain>` → store A/AAAA/NS/MX records
- **IP Geolocation (Country Code)**:
  - For each IP address found in A/AAAA records and resolved from NS/MX hostnames:
    - Query `https://ipinfo.io/{IP_ADDRESS}/country` using `web_fetch`.
    - Store the returned country code.
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
- Capture screenshot with Playwright (see [references/setup.md](references/setup.md) for script details)
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
  "filePath": "domain-screenshot.png"
}
```

Do NOT also use curl fallback — single send only. If message tool fails, report failure rather than double-sending.

## Required Setup

For detailed setup instructions, including system dependencies, Node.js dependencies, and the Playwright screenshot script, please refer to [references/setup.md](references/setup.md).

## Example Output Format

```
• Registrar: [name] (IANA ID: [id])
• Creation Date: [YYYY-MM-DD]
• Expiry Date: [YYYY-MM-DD]
• Domain Status: [status flags]
• DNS Servers: [ns1, ns2, ...]
• A Record: [IP] (Country Code)
• AAAA Record: [IP or none] (Country Code)
• MX Record: [priority] [server] ([IP] Country Code)

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
