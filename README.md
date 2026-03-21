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
-   **Live Website Screenshot**: Captures a screenshot of the domain's website using a headless Chromium browser.
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
• A Record: 104.18.12.105, 104.18.13.105
• AAAA Record: (none)
• MX Record: 1 aspmx.l.google.com

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

-   **Chromium Browser**: Required for website screenshots. Install via `sudo apt install chromium-browser` (Debian/Ubuntu) or `npx playwright install chromium`.
-   **Xvfb**: A virtual display server for headless browser operation. Install via `sudo apt install xvfb`.
-   **OpenClaw Configuration**:
    -   Ensure `browser.noSandbox: true` and `browser.headless: true` are set in your `~/.openclaw/openclaw.json`.
    -   `DISPLAY=:99` environment variable set for OpenClaw gateway.
-   **Telegram Bot Token & Chat ID**: Configured for screenshot delivery.

## Author & License

-   **Author**: Derek Chan
-   **License**: MIT
-   **Version**: 0.1.0 (Initial Release)

## Repository

[https://github.com/sxlderek/domaininfo-skill](https://github.com/sxlderek/domaininfo-skill)
