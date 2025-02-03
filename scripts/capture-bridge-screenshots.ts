import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

async function captureScreenshots(transactionUrl: string) {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to transaction page
    await page.goto(transactionUrl, { waitUntil: "networkidle0" });
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, "../docs/screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // Take screenshot of the bridge transaction
    await page.screenshot({
      path: path.join(screenshotsDir, `bridge-transaction-${timestamp}.png`),
      fullPage: true,
    });

    // Wait for status updates and take another screenshot
    await page.waitForTimeout(5000); // Wait for potential status updates
    await page.screenshot({
      path: path.join(screenshotsDir, `bridge-status-${timestamp}.png`),
      fullPage: true,
    });

    console.log(`Screenshots saved to docs/screenshots/`);
  } finally {
    await browser.close();
  }
}

// If running directly, use the URL from command line
if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.error("Please provide a transaction URL");
    process.exit(1);
  }
  captureScreenshots(url).catch(console.error);
}

export { captureScreenshots };
