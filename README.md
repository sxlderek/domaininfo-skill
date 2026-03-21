# OpenClaw `domaininfo` Skill

A comprehensive OpenClaw Agent Skill for deep domain analysis. Get instant reports on WHOIS data, DNS records, Email Security (DMARC, SPF, DKIM), TLS/SSL certificates, and a live website screenshot.

## Features

-   **WHOIS Lookup**: Registrar, registrant details, creation/expiry dates, domain status.
-   **DNS Records**: Query A, AAAA, NS, and MX records.
-   **Email Security Analysis**:
    -   **DMARC**: Policy (`p=none`/`quarantine`/`reject`), reporting URIs.
    -   **SPF**: `v=spf1` record analysis, mechanisms, and enforcement (`~all` softfail / `-all` hardfail).
    -   **DKIM**: Detection of common selectors (`default`, `google`, `selector1`) and key presence.
    -   Calculated Email Security Score (🟢 Excellent, 🟡 Moderate, 🔴 Poor).
-   **TLS/SSL Certificate Check**: Reports TLS version, Certificate Authority, and expiration date for HTTPS websites.
-   **Live Website Screenshot**: Captures a screenshot of the domain's website using headless Playwright.
-   **Strict Domain-Only Output**: Presents information solely for the queried domain, avoiding cross-domain analysis or assumptions.
-   **Buffer-First Execution**: Ensures a single, complete, and clean output message with all data and the screenshot.

## Usage

Simply type `whois <domain>` in your OpenClaw chat.

The skill supports full URLs (e.g., `https://example.com`) and will automatically extract the domain name.

### Example:
```
whois example.com
```

## Example Output

```
• Registrar: NameCheap, Inc. (IANA ID: 1068)
• Creation Date: 2021-04-29
• Expiry Date: 2027-04-29
• Domain Status: clientTransferProhibited
• DNS Servers: robin.ns.cloudflare.com, anton.ns.cloudflare.com
• A Record: 104.18.12.105 (US), 104.18.13.105 (US)
• AAAA Record: (none) (Country Code)
• MX Record: 1 aspmx.l.google.com (142.250.4.27 US)

[Email Security Section]
• DMARC: ✅ Active | Policy: p=none
• DMARC Report: (none)
• SPF: ✅ Active | Mechanisms: v=spf1 include:_spf.google.com ~all
• SPF Mode: Soft fail (~all)
• DKIM: ✅ Found | Selector: google (2048-bit RSA)
• Security Score: 🟡 Moderate

• TLS Status: ✅ HTTPS enabled
  - TLS Version: TLSv1.3
  - Certificate Authority: Google Trust Services
  - Certificate Expires: 2025-06-18

• Website: https://example.com → ✅ Active
• Screenshot: ✅ Sent (Message ID: [ID])
```

## Setup & Requirements

### System Dependencies
| Binary | Package | Install Command |
|--------|---------|-----------------|
| `whois` | WHOIS client | `sudo apt install whois` |
| `dig` | DNS queries | `sudo apt install dnsutils` |
| `openssl` | TLS checks | (usually pre-installed) |

### Messaging
- Uses OpenClaw's built-in `message` tool for screenshot delivery
- No external API tokens required — just configure your messaging provider in OpenClaw

### Node.js Dependencies
- **Node.js** (v16+)
- **Playwright**: `npm install playwright`
- **Playwright browser engine**: `npx playwright install chromium` (installs the browser engine Playwright uses, not a standalone Chromium executable)

### Quick Install
```bash
cd ~/workspace
npm init -y
npm install playwright
npx playwright install chromium
```

## Screenshot Script

The skill uses a Node.js script with Playwright to capture screenshots. Save as `scripts/domain-screenshot.js`:

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

### Run the script
```bash
node scripts/domain-screenshot.js example.com domain-screenshot.png
```

## Author & License

-   **Author**: Derek Chan
-   **License**: MIT
-   **Version**: 0.2.0 (Playwright Update)

## Repository

[https://github.com/sxlderek/domaininfo-skill](https://github.com/sxlderek/domaininfo-skill)

---

*This domaininfo-skill was built by OpenClaw (https://openclaw.ai/) with the minimax model provided by Pollinations (https://pollinations.ai/). If you found it useful, please give me a star on ClawHub.*