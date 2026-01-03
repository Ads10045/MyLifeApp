require('dotenv').config();
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function checkApi(host, name) {
    console.log(`📡 Test de ${name} (${host})...`);
    try {
        await axios.get(`https://${host}/health`, {
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': host
            },
            timeout: 5000
        });
        console.log(`✅ ${name} est accessible !`);
    } catch (error) {
        console.log(`❌ ${name} : ${error.message} (Status: ${error.response?.status})`);
    }
}

async function runTests() {
    await checkApi('real-time-amazon-data.p.rapidapi.com', 'Amazon');
    await checkApi('aliexpress-datahub.p.rapidapi.com', 'AliExpress');
    await checkApi('ebay-data-api.p.rapidapi.com', 'eBay');
}

runTests();
