---
name: domaininfo (Domain WHOIS + Email Security + TLS + Screenshot)
slug: domaininfo
version: 0.2.0
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
- Capture screenshot with Playwright
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

### System Dependencies (must be installed)
- `whois` — WHOIS lookups (`sudo apt install whois`)
- `dig` — DNS queries (`sudo apt install dnsutils`)
- `openssl` — TLS certificate checks (usually pre-installed)
- `curl` — Telegram API for screenshot delivery (usually pre-installed)

### Node.js Dependencies
- **Node.js** — Required runtime (v16+)
- **Playwright** — `npm install playwright` in workspace
- **Playwright browsers** — `npx playwright install chromium`

### Workspace Setup
```bash
# Install Playwright in workspace
cd ~/workspace
npm init -y
npm install playwright
npx playwright install chromium

# Create screenshot script
cat > scripts/domain-screenshot.js << 'EOF'
const { chromium } = require('playwright');
(async () => {
  const domain = process.argv[2] || 'example.com';
  const outputPath = process.argv[3] || 'domain-screenshot.png';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await page.goto(`http://${domain}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`Screenshot saved to ${outputPath}`);
  } catch (err) {
    console.error(`Screenshot failed: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
EOF
```

### Screenshot Delivery
- Uses OpenClaw's built-in `message` tool to send screenshots (no external tokens required)
- Ensure OpenClaw is configured with a messaging provider (Telegram, WhatsApp, etc.)

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

## Screenshot Script

Save as `scripts/domain-screenshot.js`:

```javascript
const { chromium } = require('playwright');

(async () => {
  const domain = process.argv[2] || 'example.com';
  const outputPath = process.argv[3] || 'domain-screenshot.png';
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await page.goto(`http://${domain}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`Screenshot saved to ${outputPath}`);
  } catch (err) {
    console.error(`Screenshot failed: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
```

**Run screenshot**:
```bash
node scripts/domain-screenshot.js example.com domain-screenshot.png
```