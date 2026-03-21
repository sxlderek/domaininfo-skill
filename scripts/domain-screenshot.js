const { chromium } = require('playwright');

(async () => {
  const domain = process.argv[2] || 'example.com';
  const outputPath = process.argv[3] || '~/workspace/domain-screenshot.png';
  
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