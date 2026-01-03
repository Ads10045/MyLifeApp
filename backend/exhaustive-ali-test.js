const axios = require('axios');
require('dotenv').config();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const host = 'aliexpress-datahub.p.rapidapi.com';

async function exhaustiveTest() {
  const endpoints = [
    { name: 'item_search (default)', url: `https://${host}/item_search`, params: { page: '1' } },
    { name: 'item_search (category)', url: `https://${host}/item_search`, params: { category_id: '801', page: '1' } },
    { name: 'item_search (promotion)', url: `https://${host}/item_search`, params: { q: 'phone', page: '1' } }
  ];

  for (const ep of endpoints) {
    console.log(`🧪 Testing ${ep.name}...`);
    try {
      const response = await axios.get(ep.url, {
        params: ep.params,
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': host
        },
        timeout: 10000
      });
      const data = response.data;
      const count = data?.result?.resultList?.length || 0;
      console.log(`   ✅ Success! Found ${count} items.`);
      if (count > 0) {
        console.log('   📦 First item:', data.result.resultList[0].item.title || 'No title');
      }
    } catch (err) {
      console.log(`   ❌ Failed: ${err.message}`);
    }
  }
}

exhaustiveTest();
