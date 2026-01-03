require('dotenv').config();
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function testAllAli() {
    const hosts = [
        { host: 'aliexpress-datahub.p.rapidapi.com', endpoint: '/item_search', params: {} },
        { host: 'aliexpress-api2.p.rapidapi.com', endpoint: '/search', params: { SearchText: 'phone' } },
        { host: 'aliexpress-data-api.p.rapidapi.com', endpoint: '/product/search', params: { query: 'phone' } },
        { host: 'aliexpress-search-scraper-api.p.rapidapi.com', endpoint: '/search', params: { query: 'phone' } }
    ];

    for (const item of hosts) {
        console.log(`\n🔍 Test de ${item.host}...`);
        try {
            const res = await axios.get(`https://${item.host}${item.endpoint}`, {
                params: item.params,
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': item.host
                },
                timeout: 10000
            });
            console.log(`✅ Succès ! ${res.data?.data?.length || res.data?.result?.length || res.data?.items?.length || 0} produits trouvés.`);
            if (res.data) {
                // Peek at structure
                console.log('Structure detected:', Object.keys(res.data).join(', '));
            }
        } catch (e) {
            console.log(`❌ ${item.host} : ${e.response?.status || 'Error'} - ${e.message}`);
        }
    }
}

testAllAli();
