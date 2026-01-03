require('dotenv').config();
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function checkAliPermissions() {
    console.log('🔍 Vérification des abonnements AliExpress...');
    
    // Test 1: DataHub (Popland)
    try {
        const res = await axios.get('https://aliexpress-datahub.p.rapidapi.com/item_search', {
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'aliexpress-datahub.p.rapidapi.com' }
        });
        console.log('✅ AliExpress DataHub (Popland) : ACCÈS OK');
    } catch (e) {
        console.log('❌ AliExpress DataHub (Popland) :', e.response?.status === 403 ? 'NON ABONNÉ' : e.message);
    }

    // Test 2: API 2 (Social API)
    try {
        const res = await axios.get('https://aliexpress-api2.p.rapidapi.com/search', {
            params: { SearchText: 'test' },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'aliexpress-api2.p.rapidapi.com' }
        });
        console.log('✅ AliExpress API 2 (Social API) : ACCÈS OK');
    } catch (e) {
        console.log('❌ AliExpress API 2 (Social API) :', e.response?.status === 403 ? 'NON ABONNÉ' : e.message);
    }

    // Test 3: ali-express1
    try {
        const res = await axios.get('https://ali-express1.p.rapidapi.com/search', {
            params: { query: 'test' },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'ali-express1.p.rapidapi.com' }
        });
        console.log('✅ AliExpress ali-express1 : ACCÈS OK');
    } catch (e) {
        console.log('❌ AliExpress ali-express1 :', e.response?.status === 403 ? 'NON ABONNÉ' : e.message);
    }
}

checkAliPermissions();
