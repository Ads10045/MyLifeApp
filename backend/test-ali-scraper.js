const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function testFetch() {
  const url = 'https://www.aliexpress.com/wholesale?SearchText=iphone';
  console.log(`Testing fetch of ${url}`);
  try {
    const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    console.log(`Status: ${res.status}`);
    const $ = cheerio.load(res.data);
    // Write to a file to inspect
    fs.writeFileSync('ali_test.html', res.data);
    console.log('HTML saved to ali_test.html');
    
    // Test common selectors
    const titleCount = $('[class*="product-card"]').length;
    console.log(`Found ${titleCount} elements with class matching "product-card"`);
    
    // Check if it's a captcha or empty
    if (res.data.includes('window.runParams')) {
      console.log('Found window.runParams! It might be a JSON-embedded page.');
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

testFetch();
