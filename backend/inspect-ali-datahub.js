const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const host = 'aliexpress-datahub.p.rapidapi.com';

async function inspectDataHub() {
  console.log(`🔍 Inspecting AliExpress DataHub (Popland) RAW response...`);
  
  try {
    const response = await axios.get(`https://${host}/item_search`, {
      params: {
        page: '1'
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': host
      },
      timeout: 15000
    });

    console.log('✅ Response received!');
    // Log the structure of the first 2 items
    const products = response.data?.result?.resultList || [];
    console.log(`Found ${products.length} products.`);
    
    if (products.length > 0) {
      console.log('--- PRODUCT 1 RAW ---');
      console.log(JSON.stringify(products[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

inspectDataHub();
