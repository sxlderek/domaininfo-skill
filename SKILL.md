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

## Security Considerations

- **Input validation**: Only allow alphanumeric, hyphen, and dot characters after extracting the domain. Reject any input containing shell metacharacters (`;`, `&`, `|`, `$`, `(`, `)`, `<`, `>`, `\n`, etc.).
- **Command injection prevention**: Never interpolate user input directly into shell strings. Use argument arrays or safe libraries (e.g., Node.js `dns.resolve`, `whois` npm package) when possible.
- **Timeouts**: Every external call (`whois`, `dig`, `web_fetch`, `openssl`, Playwright) must have a bounded timeout (e.g., 10 s for WHOIS/DNS, 30 s for screenshot, 5 s for ipinfo).
- **Error handling**: On failure, return a generic user‑friendly message (e.g., “⚠️ Could not retrieve data”) and log details only internally.
- **Output sanitization**: Build the final message as a single string before sending; never send partial responses.
- **File‑system safety**: Restrict screenshot writes to a known, whitelisted directory under the skill’s folder; verify the resolved path stays inside that directory.
- **Rate‑limiting & caching**: Cache IP‑to‑country lookups for a short window (e.g., 5 min) to avoid hammering external services.
- **Dependency pinning**: Use a locked `package.json` for Node.js dependencies and run `npm audit` regularly.

## Workflow (Strict Buffer-First — SAFE EXECUTION)

**CRITICAL**: Zero output until everything is ready. No "processing", "capturing", "buffering" messages.

**Phase 1 — Silent Buffer with Validation**:
1. **Extract & validate domain**  
   - Strip `https://`, `http://`, `www.` prefixes.  
   - If input contains `@`, take the part after `@`.  
   - Validate with regex `^[a-z0-9.-]+$` (case‑insensitive).  
   - If invalid, abort and return “❌ Invalid domain”.
2. **Execute `whois`** via safe exec with timeout (10 s). Store registrar data.
3. **Execute `dig`** for A, AAAA, NS, MX records via safe exec with timeout (10 s). Store results.
4. **IP Geolocation (Country Code)**:  
   - For each IP from A/AAAA and resolved NS/MX hostnames:  
     - Query `https://ipinfo.io/{IP}/country` using `web_fetch` with timeout (5 s).  
     - Store the returned country code (trimmed to two letters).  
   - Optionally cache results for 5 minutes.
5. **Check Email Security (DMARC/SPF/DKIM)** with safe exec (timeout 10 s each):  
   - `dig _dmarc.<domain> TXT +short` → DMARC record  
   - `dig <domain> TXT +short \| grep v=spf1` → SPF record  
   - `dig default._domainkey.<domain> TXT +short` → DKIM (default selector)  
   - `dig google._domainkey.<domain> TXT +short` → DKIM (Google)  
   - `dig selector1._domainkey.<domain> TXT +short` → DKIM (Microsoft/Office365)  
   - Store: DMARC policy (`p=`), SPF mechanisms, DKIM presence.

**Phase 2 — Screenshot & TLS Check**:
- **Screenshot with Playwright** (see `references/setup.md` for script details):  
  - Launch headless Chromium with a 30 s navigation timeout and `waitUntil: 'load'`.  
  - After `page.goto`, wait an additional 3 s for slow‑rendering sites.  
  - Capture screenshot to a file inside the skill’s `screenshots/` subdirectory (path validated to stay within).  
  - If any step fails, log internally and continue without the screenshot.
- **TLS/SSL Check** (if website is HTTPS):  
  - Run `openssl s_client -connect domain:443 -servername domain -servername domain 2>/dev/null \| openssl x509 -noout -issuer -dates 2>/dev/null` with timeout (10 s).  
  - Extract: TLS version (from cipher/ssl_version lines), Certificate issuer (CA name), Not After (expiry date).  
  - If the connection fails or times out, note “TLS check failed” but continue.
- Wait 1 second, then verify the screenshot file exists (if attempted).

**Phase 3 — Single Final Output**:
- **Send screenshot** via `message` tool (if captured and successfully saved).  
- **Output complete WHOIS bullet list** + Email Security section + TLS info (if HTTPS) in ONE message only — no progress/chatter.

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

For detailed setup instructions, including system dependencies, Node.js dependencies, and the Playwright screenshot script, please refer to [references/setup.md].

**Security‑focused setup tips**:
- Run `npm install playwright` and `npx playwright install chromium` **once** on a trusted host (outside any sandbox).  
- Keep the resulting `node_modules/playwright` folder in a location that is readable by the skill but **not writable** during runtime (e.g., a read‑only bind mount or a dedicated volume).  
- Ensure the skill’s `screenshots/` directory is writable only for the duration of the screenshot operation, then set back to read‑only or clean up after sending.  
- Consider using a read‑only filesystem overlay for the skill directory to prevent accidental writes.

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
