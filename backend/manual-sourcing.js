require('dotenv').config();
const sourcingJob = require('./jobs/sourcingJob');

async function runNow() {
    console.log('🚀 Lancement manuel du Sourcing Agent...');
    try {
        const result = await sourcingJob.run();
        console.log('\n📊 Résultat final:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('❌ Erreur fatale:', e.message);
    } finally {
        process.exit(0);
    }
}

runNow();
