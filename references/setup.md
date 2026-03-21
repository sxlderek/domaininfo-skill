# Skill Setup Guide

This document contains detailed instructions for setting up the `domaininfo` skill, including system dependencies, Node.js dependencies, and the Playwright screenshot script.

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

## Screenshot Script Details

This is the Node.js script used by the skill to capture website screenshots.

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

**Run screenshot example**:
```bash
node scripts/domain-screenshot.js example.com domain-screenshot.png
```

## Screenshot Delivery

- Uses OpenClaw's built-in `message` tool to send screenshots (no external tokens required)
- Ensure OpenClaw is configured with a messaging provider (Telegram, WhatsApp, etc.)
