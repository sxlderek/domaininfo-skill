const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const domain = process.argv[2] || 'example.com';
  const outputPath = process.argv[3] || 'screenshots/domain-screenshot.png';

  // Security: Validate domain - only allow alphanumeric, hyphen, dot
  const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, '');
  if (safeDomain !== domain) {
    console.error(`Screenshot failed: Invalid characters in domain`);
    process.exit(1);
  }

  // Security: Resolve and validate output path stays within skill directory
  const baseDir = path.resolve(__dirname);
  const resolvedPath = path.resolve(outputPath);
  if (!resolvedPath.startsWith(baseDir)) {
    console.error(`Screenshot failed: Path traversal attempt detected`);
    process.exit(1);
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.setViewportSize({ width: 1280, height: 1024 });
    
    // Security: Timeout and safe navigation
    await page.goto(`http://${safeDomain}`, { 
      waitUntil: 'load', 
      timeout: 30000 
    });
    
    // Wait for slow sites to render
    await page.waitForTimeout(3000);
    
    // Ensure output directory exists
    const fs = require('fs');
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await page.screenshot({ path: resolvedPath, fullPage: false });
    console.log(`Screenshot saved to ${resolvedPath}`);
  } catch (err) {
    console.error(`Screenshot failed: ${err.message}`);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();