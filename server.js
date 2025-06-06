
const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/lookup-addresses', async (req, res) => {
  const { postcode } = req.query;
  if (!postcode) {
    return res.status(400).json({ error: "Missing postcode" });
  }

  const results = [];

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(`https://www.tax.service.gov.uk/business-rates-find/search?postcode=${encodeURIComponent(postcode)}`, {
      waitUntil: 'networkidle0'
    });

    const addresses = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a.govuk-link'));
      return anchors
        .filter(a => a.href.includes('/valuations/start/'))
        .map(a => {
          const idMatch = a.href.match(/\/valuations\/start\/(\d+)/);
          return {
            id: idMatch ? idMatch[1] : null,
            address: a.textContent.trim()
          };
        })
        .filter(r => r.id);
    });

    await browser.close();
    return res.json(addresses);
  } catch (error) {
    console.error("Puppeteer scraping error:", error.message);
    return res.status(500).json({ error: "Failed to scrape addresses" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
