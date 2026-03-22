const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const domain = process.argv[2] || 'example.com';
  // Default output path relative to script directory
  const defaultOutput = 'screenshots/domain-screenshot.png';
  const outputArg = process.argv[3];
  const baseDir = path.resolve(__dirname);
  
  // Security: Validate domain - only allow alphanumeric, hyphen, dot
  const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, '');
  if (safeDomain !== domain) {
    console.error(`Screenshot failed: Invalid characters in domain`);
    process.exit(1);
  }
  
  // Build output path relative to script directory
  let outputPath;
  if (outputArg) {
    // If outputArg is absolute, use it; otherwise resolve relative to baseDir
    outputPath = path.isAbsolute(outputArg) ? outputArg : path.resolve(baseDir, outputArg);
  } else {
    outputPath = path.resolve(baseDir, defaultOutput);
  }
  
  // Security: Ensure output path is within baseDir
  if (!outputPath.startsWith(baseDir)) {
    console.error(`Screenshot failed: Path traversal attempt detected`);
    process.exit(1);
  }
  
  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
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
    
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`Screenshot saved to ${outputPath}`);
  } catch (err) {
    console.error(`Screenshot failed: ${err.message}`);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();