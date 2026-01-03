require('dotenv').config();
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function testDataHub() {
    console.log('📡 Testing AliExpress DataHub (Popland)...');
    try {
        const res = await axios.get('https://aliexpress-datahub.p.rapidapi.com/item_search', {
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'aliexpress-datahub.p.rapidapi.com'
            },
            timeout: 15000
        });
        console.log('✅ Response received. Status:', res.status);
        console.log('Full structure:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log('❌ Error:', e.message);
        if (e.response) console.log('Response data:', JSON.stringify(e.response.data, null, 2));
    }
}

testDataHub();
