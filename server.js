
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/lookup-addresses', async (req, res) => {
  const { postcode } = req.query;
  if (!postcode) {
    return res.status(400).json({ error: "Missing postcode" });
  }

  const searchUrl = `https://www.tax.service.gov.uk/business-rates-find/search?postcode=${encodeURIComponent(postcode)}`;
  try {
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Rateable Value Tool)'
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('a.govuk-link').each((i, el) => {
      const href = $(el).attr('href');
      const idMatch = href.match(/\/valuations\/start\/(\d+)/);
      if (idMatch) {
        results.push({ id: idMatch[1], address: $(el).text().trim() });
      }
    });

    return res.json(results);
  } catch (err) {
    console.error("Scraping error:", err.message);
    return res.status(500).json({ error: "Failed to fetch from VOA" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
