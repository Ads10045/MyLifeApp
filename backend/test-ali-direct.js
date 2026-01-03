require('dotenv').config();
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function testAliSearch() {
    const host = 'aliexpress-datahub.p.rapidapi.com';
    console.log(`🔍 Test de recherche réelle AliExpress...`);
    try {
        const res = await axios.get(`https://${host}/item_search`, {
            params: { q: 'iphone', page: '1' },
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': host
            },
            timeout: 10000
        });
        console.log(`✅ Succès de la requête.`);
        console.log('Structure de réponse:', JSON.stringify(res.data, null, 2));
        console.log(`Nombre de produits: ${res.data?.result?.resultList?.length || 0}`);
    } catch (error) {
        console.log(`❌ Échec : ${error.message}`);
        if (error.response?.data) {
            console.log('Détails erreur:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testAliSearch();
