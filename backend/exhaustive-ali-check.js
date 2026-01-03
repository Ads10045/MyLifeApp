require('dotenv').config();
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function exhaustiveAliCheck() {
    const hosts = [
        'aliexpress-api2.p.rapidapi.com',
        'ali-express1.p.rapidapi.com',
        'aliexpress-business-apis.p.rapidapi.com',
        'aliexpress-datahub.p.rapidapi.com',
        'aliexpress-data-api.p.rapidapi.com',
        'aliexpress-true-api.p.rapidapi.com'
    ];

    for (const host of hosts) {
        console.log(`\n🔍 Checking ${host}...`);
        try {
            const res = await axios.get(`https://${host}/search`, {
                params: { q: 'phone', SearchText: 'phone', query: 'phone' },
                headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': host },
                timeout: 5000
            });
            console.log(`✅ ${host} is ACTIVE!`);
        } catch (e) {
            console.log(`❌ ${host}: ${e.response?.status || e.message}`);
        }
    }
}

exhaustiveAliCheck();
