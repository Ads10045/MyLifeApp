require('dotenv').config();
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function testApis() {
    console.log('🔑 Clé RapidAPI:', RAPIDAPI_KEY ? 'Définie' : 'MANQUANTE');
    
    // Test Amazon
    console.log('\n📦 Test Amazon...');
    try {
        const res = await axios.get('https://real-time-amazon-data.p.rapidapi.com/search', {
            params: { query: 'phone', page: '1', country: 'US' },
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
            },
            timeout: 10000
        });
        console.log('✅ Amazon OK:', res.data?.data?.products?.length || 0, 'produits');
    } catch (e) {
        console.log('❌ Amazon:', e.response?.status, e.response?.data?.message || e.message);
    }

    // Test AliExpress API 2
    console.log('\n🛍️ Test AliExpress API 2...');
    try {
        const res = await axios.get('https://aliexpress-api2.p.rapidapi.com/search', {
            params: { SearchText: 'phone' },
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'aliexpress-api2.p.rapidapi.com'
            },
            timeout: 10000
        });
        console.log('✅ AliExpress API 2 OK:', JSON.stringify(res.data).substring(0, 200));
    } catch (e) {
        console.log('❌ AliExpress API 2:', e.response?.status, e.response?.data?.message || e.message);
    }
}

testApis();
