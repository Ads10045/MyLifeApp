require('dotenv').config();
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function testDataHubEndpoints() {
    const endpoints = [
        { name: 'SuperDeals', url: 'https://aliexpress-datahub.p.rapidapi.com/item_search', params: { page: '1' } },
        { name: 'Get Item', url: 'https://aliexpress-datahub.p.rapidapi.com/item_detail', params: { itemId: '1005005886438076' } }
    ];

    for (const ep of endpoints) {
        console.log(`\n🔍 Testing ${ep.name}...`);
        try {
            const res = await axios.get(ep.url, {
                params: ep.params,
                headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'aliexpress-datahub.p.rapidapi.com' }
            });
            console.log(`✅ Success ! Data length:`, res.data?.result?.resultList?.length || 'Detail received');
            if (res.data?.result?.resultList) {
                console.log('Sample item title:', res.data.result.resultList[0].item?.title);
            }
        } catch (e) {
            console.log(`❌ Fail:`, e.message);
        }
    }
}

testDataHubEndpoints();
