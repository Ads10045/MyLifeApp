require('dotenv').config();
const axios = require('axios');
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function testAliAPI2() {
    const host = 'aliexpress-api2.p.rapidapi.com';
    console.log(`🔍 Testing ${host} with SearchText...`);
    try {
        const res = await axios.get(`https://${host}/search`, {
            params: { SearchText: 'smartphone', page: '1' },
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': host
            },
            timeout: 10000
        });
        console.log(`✅ Success!`);
        console.log('Response Keys:', Object.keys(res.data));
        // Look for items/products
        const items = res.data.data || res.data.result || res.data.items || [];
        console.log(`Found ${Array.isArray(items) ? items.length : 'object'} items.`);
        if (Array.isArray(items) && items.length > 0) {
            console.log('Sample Item Structure:', JSON.stringify(items[0], null, 2));
        } else {
            console.log('Full Response:', JSON.stringify(res.data, null, 2));
        }
    } catch (e) {
        console.log(`❌ Fail: ${e.response?.status || e.message}`);
        if (e.response?.data) console.log('Error data:', e.response.data);
    }
}

testAliAPI2();
